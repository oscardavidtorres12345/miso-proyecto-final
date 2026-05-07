"""E067 – Recordatorio push 24h antes del check-in (fixme).

FIXME: implementar scheduler/cron job que consulte bookings CONFIRMED con
  check_in entre now() y now() + 24h, envíe push y marque reminder enviado.
"""

import pytest


@pytest.mark.skip(reason="FIXME(E067): 24h reminder scheduler not implemented yet")
class TestCheckInReminderPushNotification:
    """Criterio de aceptación:
      Enviar notificación push al usuario 24 horas antes del check-in
      de una reserva confirmada.
    """

    def test_reminder_endpoint_or_scheduler_exists(self):
        """Debe existir un job/cron o endpoint que dispare recordatorios."""
        assert False, "Implementar scheduler para recordatorio 24h (E067)"

    def test_reminder_sends_push_for_confirmed_bookings_due_in_24h(self):
        """Solo reservas CONFIRMED con check_in en las próximas 24h reciben push."""
        assert False, "Implementar query + push (E067)"

    def test_reminder_is_not_duplicated(self):
        """Una misma reserva no debe recibir el recordatorio dos veces."""
        assert False, "Implementar campo de trazabilidad (E067)"
