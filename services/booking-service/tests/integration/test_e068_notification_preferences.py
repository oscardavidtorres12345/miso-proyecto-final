"""E068 – Configuración de preferencias de notificaciones por usuario (fixme).

FIXME: implementar modelo user_notification_preference, endpoints
  GET/PUT y respetar preferencias antes de enviar push.
"""

import pytest


@pytest.mark.skip(reason="FIXME(E068): notification preferences not implemented yet")
class TestUserNotificationPreferences:
    """Criterio de aceptación:
      El usuario puede configurar qué tipos de notificaciones push
      desea recibir (booking_confirmed, booking_cancelled, checkin_reminder).
    """

    def test_preference_model_exists(self):
        """Debe existir tabla/modelo para persistir preferencias por usuario."""
        assert False, "Implementar user_notification_preference (E068)"

    def test_get_preferences_endpoint(self):
        """GET /users/{id}/notification-preferences debe retornar preferencias."""
        assert False, "Implementar endpoint GET (E068)"

    def test_update_preferences_endpoint(self):
        """PUT /users/{id}/notification-preferences debe actualizar preferencias."""
        assert False, "Implementar endpoint PUT (E068)"

    def test_push_service_respects_preferences(self):
        """El servicio de push debe omitir envío si el usuario desactivó el tipo."""
        assert False, "Integrar chequeo de preferencias en push flow (E068)"
