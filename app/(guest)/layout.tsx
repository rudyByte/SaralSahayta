import { Navbar } from '@/components/navigation/navbar';

export default function GuestLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <main>
                {children}
            </main>
        </div>
    );
}
