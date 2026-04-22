-- Incremental RBAC update: adds SECURITY_EVENT_READ and assigns it to ADMIN.

INSERT INTO permission (permission_key, description)
SELECT 'SECURITY_EVENT_READ', 'PERMISSION TO READ SECURITY EVENTS'
WHERE NOT EXISTS (
    SELECT 1 FROM permission WHERE permission_key = 'SECURITY_EVENT_READ'
);

INSERT INTO role_permission (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM role r
JOIN permission p ON p.permission_key = 'SECURITY_EVENT_READ'
WHERE r.role_name = 'ADMIN'
  AND NOT EXISTS (
      SELECT 1
      FROM role_permission rp
      WHERE rp.role_id = r.role_id
        AND rp.permission_id = p.permission_id
  );
