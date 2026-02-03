export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen">
            {/* Sidebar will go here */}
            <div className="w-64 border-r">Sidebar</div>
            <main className="flex-1 p-6">
                {children}
            </main>
        </div>
    )
}
