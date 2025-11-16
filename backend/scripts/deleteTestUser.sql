-- Delete test user with ID 4 to reset for setup testing
USE [EQMS];
GO

-- Delete from UserRoles first (FK constraint)
DELETE FROM UserRoles WHERE userId = 4;

-- Delete the user
DELETE FROM Users WHERE id = 4;

-- Verify deletion
SELECT COUNT(*) AS remainingSuperusers
FROM Users u
JOIN UserRoles ur ON u.id = ur.userId
JOIN Roles r ON ur.roleId = r.id
WHERE u.active = 1 AND ur.active = 1 AND r.name = 'superuser'
  AND (ur.expiresAt IS NULL OR ur.expiresAt > GETDATE());
GO
