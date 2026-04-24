import os
import smtplib
from datetime import date
from email.message import EmailMessage


class EmailNotificationError(Exception):
    pass


def _as_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _booking_code(booking_id: str, check_in_iso: str | None = None) -> str:
    year = check_in_iso[:4] if check_in_iso else str(date.today().year)
    suffix = "".join(ch for ch in booking_id.upper() if ch.isalnum())[-4:].rjust(4, "0")
    return f"TH-{year}-{suffix}"


def _format_currency(amount: float, currency: str) -> str:
    value = int(round(amount))
    formatted = f"{value:,}".replace(",", ".")
    return f"$ {formatted} {currency}"


def _format_date_es(iso_date: str) -> str:
    months = {
        1: "Ene",
        2: "Feb",
        3: "Mar",
        4: "Abr",
        5: "May",
        6: "Jun",
        7: "Jul",
        8: "Ago",
        9: "Sep",
        10: "Oct",
        11: "Nov",
        12: "Dic",
    }
    dt = date.fromisoformat(iso_date)
    return f"{dt.day:02d} {months[dt.month]} {dt.year}"


def _text_or_default(value: object, default: str) -> str:
    if isinstance(value, str):
        normalized = value.strip()
        if normalized and normalized.lower() != "none":
            return normalized
    return default


def _render_confirmation_email_html(
    *,
    guest_name: str,
    booking_code: str,
    preview: dict,
) -> str:
    privacy_url = os.getenv(
        "BOOKING_EMAIL_PRIVACY_URL",
        "https://travelhub.example/privacy",
    )
    bookings_url = os.getenv(
        "BOOKING_EMAIL_BOOKINGS_URL",
        "https://travelhub.example/reservations",
    )
    unsubscribe_url = os.getenv(
        "BOOKING_EMAIL_UNSUBSCRIBE_URL",
        "https://travelhub.example/notifications/unsubscribe",
    )
    reservations = preview.get("reservations")
    if not isinstance(reservations, list) or not reservations:
        reservations = [preview]

    stay = preview.get("stay", {})
    pay = preview.get("payment_summary", {})
    currency = str(pay.get("currency") or "COP")

    check_in_iso = stay.get("check_in")
    check_out_iso = stay.get("check_out")
    check_in_label = (
        _format_date_es(check_in_iso) if isinstance(check_in_iso, str) else "-"
    )
    check_out_label = (
        _format_date_es(check_out_iso) if isinstance(check_out_iso, str) else "-"
    )
    nights = int(stay.get("nights") or 0)

    rows: list[str] = []
    for item in reservations:
        prop = item.get("property", {})
        item_stay = item.get("stay", {})
        item_pay = item.get("payment_summary", {})
        item_currency = str(item_pay.get("currency") or currency)
        item_check_in = item_stay.get("check_in")
        item_check_out = item_stay.get("check_out")
        row_check_in = (
            _format_date_es(item_check_in) if isinstance(item_check_in, str) else "-"
        )
        row_check_out = (
            _format_date_es(item_check_out) if isinstance(item_check_out, str) else "-"
        )
        hotel_name = _text_or_default(prop.get("hotel_name"), "Alojamiento")
        room_name = _text_or_default(item_stay.get("room_name"), "Habitación estándar")
        meal_plan = _text_or_default(item_stay.get("meal_plan"), "Sin alimentación")
        rows.append(
            f"<tr>"
            f"<td style='padding:8px 0; font-size:13px; color:#333;'>{hotel_name}</td>"
            f"<td style='padding:8px 0; font-size:13px; color:#555;'>{room_name} ({meal_plan})</td>"
            f"<td style='padding:8px 0; font-size:13px; color:#555;'>{row_check_in} → {row_check_out}</td>"
            f"<td align='right' style='padding:8px 0; font-size:13px; color:#333;'>{_format_currency(float(item_pay.get('total') or 0.0), item_currency)}</td>"
            f"</tr>"
        )

    lodging_amount = _format_currency(float(pay.get("lodging") or 0.0), currency)
    fees_amount = _format_currency(float(pay.get("fees") or 0.0), currency)
    taxes_amount = _format_currency(float(pay.get("taxes") or 0.0), currency)
    insurance_amount = _format_currency(float(pay.get("insurance") or 0.0), currency)
    discount_amount = _format_currency(abs(float(pay.get("discount") or 0.0)), currency)
    total_amount = _format_currency(float(pay.get("total") or 0.0), currency)
    batch_booking_id = preview.get("booking_id", "")

    return f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de Reserva – TravelHub</title>
</head>
<body style="margin:0; padding:0; background:#f4f4f4; font-family:Arial, sans-serif; color:#333;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4; padding:32px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden;">
          <tr>
            <td style="background:#2d5a1b; padding:28px 40px; text-align:center;">
              <span style="background:#6aaa2a; color:#fff; font-weight:bold; font-size:16px; padding:5px 12px; border-radius:20px;">Travel</span>
              <span style="color:#a8d96b; font-size:18px; font-weight:bold; margin-left:6px;">Hub</span>
              <p style="color:#a8d96b; font-size:13px; margin:16px 0 0;">✅ &nbsp;¡Tu reserva está confirmada!</p>
            </td>
          </tr>
          <tr>
            <td style="background:#6aaa2a; padding:12px 40px; text-align:center;">
              <span style="color:#d4f0a0; font-size:11px; text-transform:uppercase; letter-spacing:1px;">Código de reserva: </span>
              <span style="color:#ffffff; font-size:16px; font-weight:bold; letter-spacing:3px; font-family:monospace;">{booking_code}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <p style="font-size:15px; margin:0 0 24px;">Hola, <strong>{guest_name}</strong>. Tu reserva ha sido procesada exitosamente. Presenta este correo o tu código al momento del check-in.</p>
              <p style="font-size:12px; color:#6a6a6a; margin:0 0 4px;">Reserva general</p>
              <p style="font-size:14px; color:#333; margin:0 0 20px; font-family:monospace;">{batch_booking_id}</p>

              <p style="font-size:11px; font-weight:bold; color:#6aaa2a; text-transform:uppercase; letter-spacing:1px; margin:0 0 12px; border-bottom:1px solid #e8e8e8; padding-bottom:8px;">Resumen de reservas</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr><td width="50%" style="padding:6px 0; font-size:13px; color:#888;">Check-in</td><td width="50%" style="padding:6px 0; font-size:13px; color:#888;">Check-out</td></tr>
                <tr><td style="padding:0 0 12px; font-size:14px; font-weight:600; color:#333;">{check_in_label}</td><td style="padding:0 0 12px; font-size:14px; font-weight:600; color:#333;">{check_out_label}</td></tr>
                <tr><td style="padding:6px 0; font-size:13px; color:#888;">Duración total</td><td style="padding:6px 0; font-size:13px; color:#888;">Reservas</td></tr>
                <tr><td style="padding:0 0 12px; font-size:14px; font-weight:600; color:#333;">{nights} noches</td><td style="padding:0 0 12px; font-size:14px; font-weight:600; color:#333;">{len(reservations)}</td></tr>
              </table>

              <p style="font-size:11px; font-weight:bold; color:#6aaa2a; text-transform:uppercase; letter-spacing:1px; margin:0 0 12px; border-bottom:1px solid #e8e8e8; padding-bottom:8px;">Detalle por reserva</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <th align="left" style="font-size:12px; color:#888; padding-bottom:8px;">Hotel</th>
                  <th align="left" style="font-size:12px; color:#888; padding-bottom:8px;">Habitación</th>
                  <th align="left" style="font-size:12px; color:#888; padding-bottom:8px;">Fechas</th>
                  <th align="right" style="font-size:12px; color:#888; padding-bottom:8px;">Subtotal</th>
                </tr>
                {"".join(rows)}
              </table>

              <p style="font-size:11px; font-weight:bold; color:#6aaa2a; text-transform:uppercase; letter-spacing:1px; margin:0 0 12px; border-bottom:1px solid #e8e8e8; padding-bottom:8px;">Resumen de pago</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr><td style="padding:5px 0; font-size:13px; color:#555;">Alojamiento</td><td align="right" style="padding:5px 0; font-size:13px; color:#555;">{lodging_amount}</td></tr>
                <tr><td style="padding:5px 0; font-size:13px; color:#555;">Cargos</td><td align="right" style="padding:5px 0; font-size:13px; color:#555;">{fees_amount}</td></tr>
                <tr><td style="padding:5px 0; font-size:13px; color:#555;">Impuestos</td><td align="right" style="padding:5px 0; font-size:13px; color:#555;">{taxes_amount}</td></tr>
                <tr><td style="padding:5px 0; font-size:13px; color:#555;">Seguro</td><td align="right" style="padding:5px 0; font-size:13px; color:#555;">{insurance_amount}</td></tr>
                <tr><td style="padding:5px 0; font-size:13px; color:#6aaa2a;">Descuentos</td><td align="right" style="padding:5px 0; font-size:13px; color:#6aaa2a;">- {discount_amount}</td></tr>
                <tr><td colspan="2" style="padding-top:10px; border-top:1px solid #e0e0e0;"></td></tr>
                <tr><td style="padding:8px 0; font-size:15px; font-weight:bold; color:#2d5a1b;">TOTAL</td><td align="right" style="padding:8px 0; font-size:15px; font-weight:bold; color:#2d5a1b;">{total_amount}</td></tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbec; border:1px solid #f5e48a; border-radius:8px; margin-bottom:28px;">
                <tr><td style="padding:16px 20px;">
                  <p style="font-size:12px; font-weight:bold; color:#7a6010; margin:0 0 8px;">⚠️ Políticas importantes</p>
                  <p style="font-size:12px; color:#5a4a10; margin:0 0 4px;">· Check-in: 15:00 – 23:59 hrs</p>
                  <p style="font-size:12px; color:#5a4a10; margin:0 0 4px;">· Check-out: hasta las 13:00 hrs</p>
                  <p style="font-size:12px; color:#5a4a10; margin:0;">· Presentar documento de identidad al check-in</p>
                </td></tr>
              </table>
              <p style="font-size:12px; color:#666; margin:0 0 4px;">
                Ver tus reservas: <a href="{bookings_url}" style="color:#2d5a1b;">Mis reservas</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f9f9f9; border-top:1px solid #e8e8e8; padding:20px 40px; text-align:center;">
              <p style="font-size:11px; color:#aaa; margin:0 0 4px;">© 2025 TravelHub · Todos los derechos reservados</p>
              <p style="font-size:11px; color:#aaa; margin:0;">
                <a href="{privacy_url}" style="color:#6aaa2a; text-decoration:none;">Política de privacidad</a> &nbsp;·&nbsp;
                <a href="{unsubscribe_url}" style="color:#6aaa2a; text-decoration:none;">Cancelar suscripción</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


class BookingEmailSender:
    def __init__(self) -> None:
        self.enabled = _as_bool(os.getenv("BOOKING_EMAIL_ENABLED"), default=False)
        self.smtp_host = os.getenv("BOOKING_SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("BOOKING_SMTP_PORT", "587"))
        self.smtp_starttls = _as_bool(os.getenv("BOOKING_SMTP_STARTTLS"), default=True)
        self.smtp_auth_enabled = _as_bool(
            os.getenv("BOOKING_SMTP_AUTH_ENABLED"), default=True
        )
        self.smtp_user = os.getenv("BOOKING_SMTP_USER")
        self.smtp_app_password = os.getenv("BOOKING_SMTP_APP_PASSWORD")
        self.smtp_from = os.getenv("BOOKING_SMTP_FROM", self.smtp_user or "")

    def send_confirmation_email(
        self,
        *,
        to_email: str,
        booking_id: str,
        preview: dict,
    ) -> dict:
        if not self.enabled:
            return {"status": "disabled", "detail": "BOOKING_EMAIL_ENABLED=false"}

        if not self.smtp_from:
            raise EmailNotificationError(
                "SMTP sender is missing. Configure BOOKING_SMTP_FROM."
            )
        if self.smtp_auth_enabled and (
            not self.smtp_user or not self.smtp_app_password
        ):
            raise EmailNotificationError(
                "SMTP credentials are incomplete. Configure BOOKING_SMTP_USER, "
                "BOOKING_SMTP_APP_PASSWORD and BOOKING_SMTP_FROM."
            )

        guest_name = str(preview.get("guest_name") or "Guest")
        stay = preview.get("stay") or {}
        booking_code = _booking_code(booking_id, stay.get("check_in"))
        html = _render_confirmation_email_html(
            guest_name=guest_name,
            booking_code=booking_code,
            preview=preview,
        )

        msg = EmailMessage()
        msg["Subject"] = f"TravelHub | Confirmación de reserva {booking_code}"
        msg["From"] = self.smtp_from
        msg["To"] = to_email
        msg.set_content(
            f"Hola {guest_name}, tu reserva {booking_code} fue confirmada exitosamente."
        )
        msg.add_alternative(html, subtype="html")

        try:
            with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=15) as server:
                if self.smtp_starttls:
                    server.starttls()
                if self.smtp_auth_enabled:
                    server.login(self.smtp_user, self.smtp_app_password)
                server.send_message(msg)
        except OSError as exc:
            raise EmailNotificationError(
                "SMTP transport error while sending email."
            ) from exc
        except smtplib.SMTPException as exc:
            raise EmailNotificationError(
                "SMTP rejected booking confirmation email."
            ) from exc

        return {"status": "sent", "detail": f"Email sent to {to_email}"}


booking_email_sender = BookingEmailSender()
