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


def _render_confirmation_email_html(
    *,
    guest_name: str,
    booking_code: str,
    preview: dict,
) -> str:
    prop = preview.get("property", {})
    stay = preview.get("stay", {})
    pay = preview.get("payment_summary", {})
    currency = pay.get("currency", "COP")
    stars = int(prop.get("stars") or 0)
    stars_label = "★" * stars
    check_in_iso = str(stay.get("check_in"))
    check_out_iso = str(stay.get("check_out"))
    check_in_label = _format_date_es(check_in_iso)
    check_out_label = _format_date_es(check_out_iso)
    nights = int(stay.get("nights") or 0)
    adults = int(stay.get("adults") or 0)

    lodging_amount = _format_currency(float(pay.get("lodging") or 0.0), currency)
    fees_amount = _format_currency(float(pay.get("fees") or 0.0), currency)
    taxes_amount = _format_currency(float(pay.get("taxes") or 0.0), currency)
    insurance_amount = _format_currency(float(pay.get("insurance") or 0.0), currency)
    discount_amount = _format_currency(float(pay.get("discount") or 0.0), currency)
    total_amount = _format_currency(float(pay.get("total") or 0.0), currency)

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
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e0e0e0; border-radius:8px; margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="font-size:17px; font-weight:bold; color:#2d5a1b; margin:0 0 4px;">{prop.get("hotel_name", "Hotel")} {stars_label}</p>
                    <p style="font-size:13px; color:#6aaa2a; margin:0;">📍 {prop.get("city", "")}, {prop.get("country", "")}</p>
                  </td>
                </tr>
              </table>

              <p style="font-size:11px; font-weight:bold; color:#6aaa2a; text-transform:uppercase; letter-spacing:1px; margin:0 0 12px; border-bottom:1px solid #e8e8e8; padding-bottom:8px;">Detalles de la estadía</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr><td width="50%" style="padding:6px 0; font-size:13px; color:#888;">Check-in</td><td width="50%" style="padding:6px 0; font-size:13px; color:#888;">Check-out</td></tr>
                <tr><td style="padding:0 0 12px; font-size:14px; font-weight:600; color:#333;">{check_in_label}</td><td style="padding:0 0 12px; font-size:14px; font-weight:600; color:#333;">{check_out_label}</td></tr>
                <tr><td style="padding:6px 0; font-size:13px; color:#888;">Duración</td><td style="padding:6px 0; font-size:13px; color:#888;">Huéspedes</td></tr>
                <tr><td style="padding:0 0 12px; font-size:14px; font-weight:600; color:#333;">{nights} noches</td><td style="padding:0 0 12px; font-size:14px; font-weight:600; color:#333;">{adults} adultos</td></tr>
                <tr><td style="padding:6px 0; font-size:13px; color:#888;">Habitación</td><td style="padding:6px 0; font-size:13px; color:#888;">Alimentación</td></tr>
                <tr><td style="font-size:14px; font-weight:600; color:#333;">{stay.get("room_name", "")}</td><td style="font-size:14px; font-weight:600; color:#333;">{stay.get("meal_plan", "")}</td></tr>
              </table>

              <p style="font-size:11px; font-weight:bold; color:#6aaa2a; text-transform:uppercase; letter-spacing:1px; margin:0 0 12px; border-bottom:1px solid #e8e8e8; padding-bottom:8px;">Resumen de pago</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr><td style="padding:5px 0; font-size:13px; color:#555;">Alojamiento ({adults} personas)</td><td align="right" style="padding:5px 0; font-size:13px; color:#555;">{lodging_amount}</td></tr>
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
            </td>
          </tr>
          <tr>
            <td style="background:#f9f9f9; border-top:1px solid #e8e8e8; padding:20px 40px; text-align:center;">
              <p style="font-size:11px; color:#aaa; margin:0 0 4px;">© 2025 TravelHub · Todos los derechos reservados</p>
              <p style="font-size:11px; color:#aaa; margin:0;">
                <a href="#" style="color:#6aaa2a; text-decoration:none;">Política de privacidad</a> &nbsp;·&nbsp;
                <a href="#" style="color:#6aaa2a; text-decoration:none;">Cancelar suscripción</a>
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

        if not self.smtp_user or not self.smtp_app_password or not self.smtp_from:
            raise EmailNotificationError(
                "SMTP credentials are incomplete. Configure BOOKING_SMTP_USER, "
                "BOOKING_SMTP_APP_PASSWORD and BOOKING_SMTP_FROM."
            )

        guest_name = str(preview.get("guest_name") or "Guest")
        booking_code = _booking_code(
            booking_id, preview.get("stay", {}).get("check_in")
        )
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
                server.starttls()
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
