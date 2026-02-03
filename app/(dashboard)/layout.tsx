// Placeholder for dashboard layout
// Will include Navbar and Sidebar components

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar will be added here */}
            <div className="flex">
                {/* Sidebar will be added here */}
                <main className="flex-1 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
