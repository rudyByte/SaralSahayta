import { Navbar } from '@/components/navigation/navbar';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-50 relative flex flex-col overflow-hidden">
            <Navbar />
            
            {/* Ambient Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
            
            <div className="flex-1 flex items-center justify-center p-4 relative z-10 pt-28 pb-12">
                {children}
            </div>
        </div>
    );
}
