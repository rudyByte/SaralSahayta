'use client';

import { ShieldAlert, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';

export default function SuspendedPage() {
    const supabase = createClient();
    const router = useRouter();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 text-center">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldAlert className="h-10 w-10 text-red-600" />
                </div>
                
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Account Suspended</h1>
                <p className="text-slate-600 mb-8">
                    Your account has been suspended for violating our terms of service or due to suspicious activity. 
                    If you believe this is a mistake, please contact our support team.
                </p>

                <div className="space-y-3">
                    <Button 
                        variant="outline" 
                        className="w-full h-12 rounded-xl text-slate-700 font-medium border-slate-200"
                        onClick={() => window.open('mailto:support@saralsahayta.in')}
                    >
                        Contact Support
                    </Button>
                    <Button 
                        variant="ghost" 
                        className="w-full h-12 rounded-xl text-red-600 font-medium hover:bg-red-50 hover:text-red-700"
                        onClick={handleLogout}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </div>
            </div>
        </div>
    );
}
