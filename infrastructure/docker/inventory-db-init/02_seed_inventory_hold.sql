-- Opcional para pruebas: normalmente este archivo puede quedar vacio.
-- Se mantiene para futuras seeds de holds de prueba.

-- Ejemplo (comentado):
-- INSERT INTO inventory_hold (
--   hold_id, room_id, user_id, check_in, check_out, units, status, created_at, expires_at, updated_at
-- ) VALUES (
--   'hold-demo-001', 101, 'demo-user', DATE '2026-04-10', DATE '2026-04-12', 1,
--   'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '15 minute', NULL
-- ) ON CONFLICT (hold_id) DO NOTHING;
