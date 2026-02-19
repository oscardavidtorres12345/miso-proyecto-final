from fastapi import FastAPI, Request, HTTPException, Response
from schemas import TransactionSchema
import redis.asyncio as redis
import os
import time

app = FastAPI()
redis_client = redis.from_url(os.getenv("REDIS_URL", "redis://redis:6379"), decode_responses=True)
transaction_schema = TransactionSchema()

# Constantes para Experimento 1
BLOCK_TTL = 120  # 2 minutos de bloqueo
ATTEMPT_WINDOW = 120 # Ventana de 2 minutos
MAX_ATTEMPTS = 15

@app.middleware("http")
async def check_fraud_block(request: Request, call_next):
    # Simular extracción de IP (en producción vendría de headers como X-Forwarded-For)
    # Para el experimento, asumimos que viene en el body o header, aqui simulamos una IP fija si no hay
    client_ip = request.headers.get("X-Client-IP", "127.0.0.1")
    
    # 1. Validar si la IP está bloqueada (Lectura rápida en Redis)
    is_blocked = await redis_client.get(f"blacklist:{client_ip}")
    if is_blocked:
        return Response(content="IP Blocked due to suspicious activity", status_code=403)
    
    response = await call_next(request)
    return response

@app.post("/pay")
async def process_payment(request: Request):
    # Validacion con Marshmallow
    try:
        body = await request.json()
        data = transaction_schema.load(body)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    client_ip = data['ip_address']
    
    # Lógica asíncrona de conteo (Rate Limiting)
    # Usamos pipeline para atomicidad y velocidad
    pipe = redis_client.pipeline()
    key = f"attempts:{client_ip}"
    
    pipe.incr(key)
    pipe.expire(key, ATTEMPT_WINDOW)
    results = await pipe.execute()
    current_attempts = results[0]

    # Detección de Fraude (Umbral 15)
    if current_attempts > MAX_ATTEMPTS:
        # Bloqueo inmediato
        await redis_client.setex(f"blacklist:{client_ip}", BLOCK_TTL, "1")
        print(f"ALERTA: IP {client_ip} bloqueada por velocidad.")
        raise HTTPException(status_code=403, detail="Fraud detection triggered")

    # Simulación de procesamiento de pago
    return {"status": "approved", "transaction_id": "txn_12345", "attempts": current_attempts}

@app.get("/health")
def health():
    return {"status": "ok"}
