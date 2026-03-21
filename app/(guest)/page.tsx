import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { 
    ArrowRight, 
    Search, 
    FileText, 
    CheckCircle, 
    Users,
    Zap,
    Shield,
    Sparkles,
    Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default async function HomePage() {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="container mx-auto px-4 text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest mb-8 animate-bounce">
                        <Sparkles className="h-4 w-4" />
                        AI-Powered Scheme Discovery
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 leading-[1.1] tracking-tight">
                        Your Gateway to <span className="text-primary italic">5,000+</span> <br />
                        Government Benefits.
                    </h1>
                    <p className="text-lg md:text-xl text-slate-500 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
                        We use AI to match your profile with scholarships, welfare programs, and financial aid. 
                        Simplified, secure, and completely free for all citizens.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-6 justify-center">
                        {user ? (
                            <Link
                                href="/dashboard"
                                className="inline-flex items-center justify-center px-12 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-lg hover:bg-black transition-all shadow-2xl shadow-slate-200 hover:scale-105 active:scale-95"
                            >
                                Enter My Dashboard <ArrowRight className="ml-3 h-6 w-6" />
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href="/register"
                                    className="inline-flex items-center justify-center px-10 py-5 bg-primary text-white rounded-[2rem] font-black text-lg hover:bg-primary-600 transition-all shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95"
                                >
                                    Start My Journey <ArrowRight className="ml-3 h-6 w-6" />
                                </Link>
                                <Link
                                    href="/login"
                                    className="inline-flex items-center justify-center px-10 py-5 bg-white text-slate-900 border-2 border-slate-100 rounded-[2rem] font-black text-lg hover:bg-slate-50 transition-all active:scale-95"
                                >
                                    Sign In
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-slate-50/50">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h2 className="text-4xl font-black text-slate-900 mb-6">Designed for Every Citizen</h2>
                        <p className="text-slate-500 font-medium">From students seeking scholarships to seniors looking for pensions, we've simplified the entire process.</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <FeatureCard
                            icon={<Zap className="h-8 w-8 text-primary" />}
                            title="Instant Match"
                            description="Our algorithm analyzes 52 parameters to find schemes you're 100% eligible for."
                        />
                        <FeatureCard
                            icon={<Shield className="h-8 w-8 text-primary" />}
                            title="Zero-Knowledge OCR"
                            description="Upload documents securely. We extract data locally on your device for maximum privacy."
                        />
                        <FeatureCard
                            icon={<Globe className="h-8 w-8 text-primary" />}
                            title="22+ Languages"
                            description="Access the portal in your native language. We support Hindi, Marathi, Tamil, and more."
                        />
                        <FeatureCard
                            icon={<CheckCircle className="h-8 w-8 text-primary" />}
                            title="Direct Apply"
                            description="One-click application redirection with pre-filled profile data to save you hours."
                        />
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section id="about" className="py-24 overflow-hidden">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="lg:w-1/2">
                            <div className="relative">
                                <div className="absolute -left-10 -top-10 w-40 h-40 bg-primary/10 rounded-full blur-2xl" />
                                <h2 className="text-5xl font-black text-slate-900 mb-8 leading-tight">
                                    Bridging the Gap Between <br />
                                    <span className="text-primary italic text-6xl">Government & You.</span>
                                </h2>
                                <p className="text-slate-500 text-lg font-medium leading-relaxed mb-8">
                                    Every year, billions of rupees in welfare funds go unclaimed because citizens aren't aware of the schemes. 
                                    Saral Sahayta was built to ensure that no eligible beneficiary is left behind.
                                </p>
                                <ul className="space-y-4">
                                    {[
                                        "Verified source of 10,000+ central and state schemes.",
                                        "AI-driven eligibility scoring to reduce rejection rates.",
                                        "Digital Document Vault with automated expiry alerts."
                                    ].map((text, i) => (
                                        <li key={i} className="flex items-center gap-3 font-bold text-slate-700">
                                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                <CheckCircle className="h-4 w-4" />
                                            </div>
                                            {text}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <div className="lg:w-1/2 grid grid-cols-2 gap-6 p-8 bg-slate-50 rounded-[3rem]">
                           <div className="space-y-6">
                               <SummaryCard title="52k+" label="Daily Applications" />
                               <SummaryCard title="99%" label="Security Rating" dark />
                           </div>
                           <div className="space-y-6 pt-12">
                               <SummaryCard title="28" label="States Covered" dark />
                               <SummaryCard title="4.9/5" label="Citizen Trust Score" />
                           </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="bg-slate-900 text-white py-24 rounded-[4rem] mx-4 mb-24 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.3),transparent)]" />
                <div className="container mx-auto px-4 text-center relative z-10">
                    <h2 className="text-3xl font-black mb-16 uppercase tracking-widest text-primary">By the Numbers</h2>
                    <div className="grid md:grid-cols-3 gap-16">
                        <StatCard number="₹50,000Cr+" label="Annual Funds Unclaimed" />
                        <StatCard number="125Mn+" label="Target Beneficiaries" />
                        <StatCard number="10,000+" label="Central/State Schemes" />
                    </div>
                    <div className="mt-20">
                         <Link href="/register">
                            <Button className="h-16 px-12 rounded-full bg-white text-slate-900 hover:bg-slate-100 font-black text-xl shadow-2xl">
                                Join the Transformation
                            </Button>
                         </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-slate-100">
                <div className="container mx-auto px-4 text-center">
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <Zap className="h-6 w-6 text-primary" />
                        <span className="text-xl font-black text-slate-900 tracking-tight">Saral Sahayta</span>
                    </div>
                    <p className="text-slate-400 font-bold text-sm">Empowering every citizen with digital benefit discovery.</p>
                    <div className="flex justify-center gap-8 mt-8 text-slate-400 font-black text-xs uppercase tracking-widest">
                        <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
                        <Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link>
                        <Link href="#" className="hover:text-primary transition-colors">API Docs</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all group border border-slate-50">
            <div className="mb-6 p-4 rounded-2xl bg-slate-50 group-hover:bg-primary/5 w-fit transition-colors">{icon}</div>
            <h3 className="text-xl font-black text-slate-900 mb-4">{title}</h3>
            <p className="text-slate-500 font-medium leading-relaxed">{description}</p>
        </div>
    );
}

function SummaryCard({ title, label, dark }: { title: string; label: string; dark?: boolean }) {
    return (
        <div className={cn(
            "p-8 rounded-[2rem] shadow-xl",
            dark ? "bg-slate-900 text-white" : "bg-white text-slate-900 shadow-slate-200/50"
        )}>
            <h4 className="text-3xl font-black mb-1">{title}</h4>
            <p className={cn("text-xs font-black uppercase tracking-widest", dark ? "text-primary" : "text-slate-400")}>{label}</p>
        </div>
    );
}

function StatCard({ number, label }: { number: string; label: string }) {
    return (
        <div>
            <div className="text-5xl md:text-6xl font-black mb-4 tracking-tighter">{number}</div>
            <div className="text-primary font-black uppercase tracking-[0.2em] text-xs">{label}</div>
        </div>
    );
}
