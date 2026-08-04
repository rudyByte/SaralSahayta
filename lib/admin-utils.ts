import { createClient } from '@/lib/supabase-server';

/**
 * Check if the current user is an admin
 * @returns Promise<boolean> - true if user is admin, false otherwise
 */
export async function isAdmin(): Promise<boolean> {
    try {
        const supabase = createClient();

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return false;

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('is_admin')
            .eq('user_id', user.id)
            .single();

        return profile?.is_admin === true;
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

/**
 * Get admin user profile with role information
 */
export async function getAdminProfile() {
    try {
        const supabase = createClient();

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return null;

        const { data: profile } = await supabase
            .from('user_profiles')
            .select(`
                *,
                user_roles (
                    roles (
                        name,
                        description,
                        permissions
                    )
                )
            `)
            .eq('user_id', user.id)
            .single();

        return profile;
    } catch (error) {
        console.error('Error fetching admin profile:', error);
        return null;
    }
}

/**
 * Check if user has specific permission
 */
export async function hasPermission(permission: string): Promise<boolean> {
    try {
        const profile = await getAdminProfile();

        if (!profile?.is_admin) return false;

        // Super admin has all permissions
        const roles = profile.user_roles as any[];
        if (!roles || roles.length === 0) return false;

        for (const userRole of roles) {
            const role = userRole.roles;
            if (!role) continue;

            const permissions = role.permissions as string[];

            // Check for wildcard permission
            if (permissions.includes('*')) return true;

            // Check for specific permission
            if (permissions.includes(permission)) return true;
        }

        return false;
    } catch (error) {
        console.error('Error checking permission:', error);
        return false;
    }
}
