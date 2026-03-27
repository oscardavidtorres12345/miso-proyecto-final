import math
from datetime import date, timedelta
from typing import List, Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.models.property import Propiedad
from src.domain.models.room import Habitacion
from src.domain.models.inventory import Inventario
from src.domain.models.rate import Tarifa
from src.domain.models.review import Resena
from src.domain.schemas.search import SearchRequest, PropertyResult, SearchResponse


def _rating_label(rating: Optional[float]) -> Optional[str]:
    if rating is None:
        return None
    if rating >= 4.5:
        return "Excelente"
    if rating >= 4.0:
        return "Muy bien"
    if rating >= 3.0:
        return "Bien"
    return "Regular"


def _date_range(check_in: date, check_out: date) -> List[date]:
    """Genera lista de fechas [check_in, check_out) — noches del hospedaje."""
    days = (check_out - check_in).days
    return [check_in + timedelta(days=i) for i in range(days)]


class PropertyRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def search(self, req: SearchRequest) -> SearchResponse:
        nights = (req.check_out - req.check_in).days
        guests = req.adults + req.children

        # ---------------------------------------------------------------
        # 1. Subconsulta: habitaciones con disponibilidad en TODAS las noches
        #    PF-282: usa BETWEEN (rango de fechas) en lugar de IN(lista) para
        #    aprovechar el índice compuesto (habitacion_id, fecha) de inventario.
        # ---------------------------------------------------------------
        avail_subq = (
            select(Inventario.habitacion_id)
            .where(
                Inventario.fecha >= req.check_in,
                Inventario.fecha < req.check_out,       # exclusive upper bound
                (Inventario.cantidad_total - Inventario.cantidad_confirmada) >= req.rooms,
            )
            .group_by(Inventario.habitacion_id)
            .having(func.count(Inventario.fecha) >= nights)
            .scalar_subquery()
        )

        # ---------------------------------------------------------------
        # 2. Subconsulta: precio promedio por noche — sólo habitaciones disponibles
        #    PF-282: BETWEEN en tarifa + filtro previo sobre avail_subq reduce
        #    la cantidad de filas escaneadas drásticamente con catálogos grandes.
        # ---------------------------------------------------------------
        rate_subq = (
            select(
                Tarifa.habitacion_id,
                func.avg(Tarifa.monto).label("avg_monto"),
                func.min(Tarifa.moneda).label("moneda"),
            )
            .where(
                Tarifa.fecha >= req.check_in,
                Tarifa.fecha < req.check_out,
                Tarifa.habitacion_id.in_(avail_subq),
            )
            .group_by(Tarifa.habitacion_id)
            .subquery()
        )

        # ---------------------------------------------------------------
        # 3. Habitaciones disponibles con capacidad suficiente y precio mínimo
        # ---------------------------------------------------------------
        room_subq = (
            select(
                Habitacion.propiedad_id,
                func.min(rate_subq.c.avg_monto).label("precio_noche"),
                func.min(rate_subq.c.moneda).label("moneda"),
            )
            .join(rate_subq, Habitacion.id == rate_subq.c.habitacion_id)
            .where(
                Habitacion.id.in_(avail_subq),
                Habitacion.capacidad_max >= guests,
            )
            .group_by(Habitacion.propiedad_id)
            .subquery()
        )

        # ---------------------------------------------------------------
        # 4. Calificación promedio — PF-282: filtrada al subconjunto de
        #    propiedades con habitaciones disponibles para reducir el escaneo.
        # ---------------------------------------------------------------
        rating_subq = (
            select(
                Resena.propiedad_id,
                func.avg(Resena.calificacion).label("avg_rating"),
                func.count(Resena.id).label("num_resenas"),
            )
            .where(Resena.propiedad_id.in_(select(room_subq.c.propiedad_id)))
            .group_by(Resena.propiedad_id)
            .subquery()
        )

        # ---------------------------------------------------------------
        # 5. Query principal sobre Propiedad con JOIN a room_subq y rating_subq
        # ---------------------------------------------------------------
        stmt = (
            select(
                Propiedad,
                room_subq.c.precio_noche,
                room_subq.c.moneda,
                rating_subq.c.avg_rating,
                rating_subq.c.num_resenas,
            )
            .join(room_subq, Propiedad.id == room_subq.c.propiedad_id)
            .outerjoin(rating_subq, Propiedad.id == rating_subq.c.propiedad_id)
            .where(
                Propiedad.ubicacion_geog.ilike(f"%{req.destination}%"),
            )
        )

        # HU023 PF-284: Partition pruning — cuando se especifica country, PostgreSQL
        # accede ÚNICAMENTE al shard relevante (ej: propiedad_co para 'CO').
        # Sin este filtro, el planner escanea todas las particiones aunque los
        # GIN/trigram indexes sean usados en cada una.
        if req.country:
            stmt = stmt.where(Propiedad.pais == req.country.upper())

        # Filtros opcionales sobre Propiedad
        if req.pets:
            stmt = stmt.where(Propiedad.acepta_mascotas.is_(True))
        if req.accommodation_type:
            stmt = stmt.where(Propiedad.tipo.in_(req.accommodation_type))
        if req.stars:
            stmt = stmt.where(Propiedad.estrellas.in_(req.stars))
        if req.meal_plan:
            stmt = stmt.where(Propiedad.plan_alimentacion == req.meal_plan)
        if req.amenities:
            for amenidad in req.amenities:
                stmt = stmt.where(Propiedad.amenidades.contains([amenidad]))

        # Filtros de precio (sobre precio_noche antes de impuesto)
        if req.price_min is not None:
            stmt = stmt.where(room_subq.c.precio_noche >= req.price_min)
        if req.price_max is not None:
            stmt = stmt.where(room_subq.c.precio_noche <= req.price_max)

        # Ordenar por rating desc, luego precio asc
        stmt = stmt.order_by(
            rating_subq.c.avg_rating.desc().nulls_last(),
            room_subq.c.precio_noche.asc(),
        )

        # ---------------------------------------------------------------
        # 6. Paginación: total + slice
        # ---------------------------------------------------------------
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.session.execute(count_stmt)
        total = total_result.scalar_one()

        offset = (req.page - 1) * req.page_size
        stmt = stmt.offset(offset).limit(req.page_size)
        rows = await self.session.execute(stmt)
        rows = rows.all()

        # ---------------------------------------------------------------
        # 7. Construir PropertyResult para cada fila
        # ---------------------------------------------------------------
        results: List[PropertyResult] = []
        for propiedad, precio_noche, moneda, avg_rating, num_resenas in rows:
            precio_noche = precio_noche or 0.0
            precio_total = round(
                precio_noche * nights * (1 + propiedad.porcentaje_impuesto), 2
            )
            rating = round(avg_rating, 1) if avg_rating else None
            results.append(
                PropertyResult(
                    id=propiedad.id,
                    nombre=propiedad.nombre,
                    ubicacion_geog=propiedad.ubicacion_geog,
                    distancia_centro_km=propiedad.distancia_centro_km,
                    tipo=propiedad.tipo.value if propiedad.tipo else "",
                    estrellas=propiedad.estrellas,
                    amenidades=propiedad.amenidades or [],
                    plan_alimentacion=(
                        propiedad.plan_alimentacion.value if propiedad.plan_alimentacion else "Ninguno"
                    ),
                    acepta_mascotas=propiedad.acepta_mascotas,
                    imagen_url=propiedad.imagen_url,
                    precio_total=precio_total,
                    precio_por_noche=round(precio_noche, 2),
                    moneda=moneda or "COP",
                    numero_noches=nights,
                    numero_adultos=req.adults,
                    rating=rating,
                    numero_resenas=num_resenas or 0,
                    etiqueta_rating=_rating_label(rating),
                )
            )

        total_pages = math.ceil(total / req.page_size) if req.page_size else 1
        return SearchResponse(
            results=results,
            total=total,
            page=req.page,
            page_size=req.page_size,
            total_pages=total_pages,
        )

