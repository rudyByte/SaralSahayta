import { createClient } from '@/lib/supabase-server';

/**
 * Checks if the current user has the required permission.
 * Throws an error if not authorized.
 * 
 * @param permission The permission string to check (e.g., 'applications.view')
 * @returns The user object if authorized
 */
export async function requireAdminPermission(permission: string) {
    const supabase = createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        throw new Error('Unauthorized');
    }

    // 1. Check if high-level admin flag is set (fast check)
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('user_id', user.id)
        .single();

    if (!profile?.is_admin) {
        throw new Error('Forbidden: Not an admin');
    }

    // 2. If specific permission is required, check roles
    if (permission && permission !== '*') {
        const { data: userRoles } = await supabase
            .from('user_roles')
            .select(`
        role:roles (
          permissions
        )
      `)
            .eq('user_id', user.id);

        const hasPermission = userRoles?.some((ur: any) => {
            const perms = ur.role?.permissions;
            // Super admin check
            if (Array.isArray(perms) && perms.includes('*')) return true;
            // Specific permission check
            return Array.isArray(perms) && perms.includes(permission);
        });

        if (!hasPermission) {
            throw new Error(`Forbidden: Missing permission ${permission}`);
        }
    }

    return user;
}

/**
 * Logs an admin action to the audit trail
 */
export async function logAdminAction(
    adminId: string,
    action: string,
    targetTable: string,
    targetId: string,
    details: any = {}
) {
    const supabase = createClient();

    // Fire and forget - don't await strictly if not critical
    await supabase.from('admin_activity_logs').insert({
        admin_id: adminId,
        action,
        target_table: targetTable,
        target_id: targetId,
        details
    });
}
