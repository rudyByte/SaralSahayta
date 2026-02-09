import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/admin-utils';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { AdminProvider } from '@/lib/admin-context';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const userIsAdmin = await isAdmin();

    if (!userIsAdmin) {
        redirect('/discover');
    }

    return (
        <AdminProvider>
            <div className="flex h-screen bg-gray-50">
                {/* Sidebar */}
                <AdminSidebar />

                {/* Main Content */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Header */}
                    <AdminHeader />

                    {/* Page Content */}
                    <main className="flex-1 overflow-y-auto p-6">
                        {children}
                    </main>
                </div>
            </div>
        </AdminProvider>
    );
}
