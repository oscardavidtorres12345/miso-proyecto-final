-- Incremental RBAC update for security operations.
-- Adds USER_BLOCK and USER_UNBLOCK permissions and assigns them to ADMIN.

INSERT INTO permission (permission_key, description)
SELECT 'USER_BLOCK', 'PERMISSION TO BLOCK USER ACCOUNTS'
WHERE NOT EXISTS (
    SELECT 1 FROM permission WHERE permission_key = 'USER_BLOCK'
);

INSERT INTO permission (permission_key, description)
SELECT 'USER_UNBLOCK', 'PERMISSION TO UNBLOCK USER ACCOUNTS'
WHERE NOT EXISTS (
    SELECT 1 FROM permission WHERE permission_key = 'USER_UNBLOCK'
);

INSERT INTO role_permission (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM role r
JOIN permission p ON p.permission_key = 'USER_BLOCK'
WHERE r.role_name = 'ADMIN'
  AND NOT EXISTS (
      SELECT 1
      FROM role_permission rp
      WHERE rp.role_id = r.role_id
        AND rp.permission_id = p.permission_id
  );

INSERT INTO role_permission (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM role r
JOIN permission p ON p.permission_key = 'USER_UNBLOCK'
WHERE r.role_name = 'ADMIN'
  AND NOT EXISTS (
      SELECT 1
      FROM role_permission rp
      WHERE rp.role_id = r.role_id
        AND rp.permission_id = p.permission_id
  );
