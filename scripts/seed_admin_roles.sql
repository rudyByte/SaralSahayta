-- SEED DEFAULT ADMIN ROLES

INSERT INTO "roles" (name, description, permissions) VALUES
(
    'SUPER_ADMIN', 
    'Full system access', 
    '["*"]'::jsonb
),
(
    'SCHEME_MANAGER', 
    'Manage schemes and content', 
    '["schemes.create", "schemes.edit", "schemes.delete", "analytics.view"]'::jsonb
),
(
    'VERIFIER', 
    'Verify documents and applications', 
    '["applications.view", "applications.approve", "applications.reject", "documents.verify"]'::jsonb
),
(
    'SUPPORT', 
    'View user data for support', 
    '["users.view", "applications.view", "notifications.create"]'::jsonb
)
ON CONFLICT (name) DO UPDATE SET 
    permissions = EXCLUDED.permissions,
    description = EXCLUDED.description;
