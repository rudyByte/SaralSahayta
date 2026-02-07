import Link from 'next/link';
import { ArrowRight, Search, FileText, CheckCircle, Users } from 'lucide-react';

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
            {/* Hero Section */}
            <section className="container mx-auto px-4 py-20">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-5xl md:text-6xl font-bold text-primary-900 mb-6">
                        Your Gateway to <span className="text-primary">5,000+</span> Government Schemes
                    </h1>
                    <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                        Discover scholarships, welfare programs, and financial assistance you're eligible for.
                        Powered by AI, simplified for everyone.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/register"
                            className="inline-flex items-center justify-center px-8 py-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors shadow-lg hover:shadow-xl"
                        >
                            Get Started <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                        <Link
                            href="/login"
                            className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary border-2 border-primary rounded-lg font-semibold hover:bg-primary-50 transition-colors"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="container mx-auto px-4 py-16">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <FeatureCard
                        icon={<Search className="h-8 w-8 text-primary" />}
                        title="Smart Discovery"
                        description="AI-powered matching finds schemes you qualify for based on your profile"
                    />
                    <FeatureCard
                        icon={<FileText className="h-8 w-8 text-primary" />}
                        title="Document Guidance"
                        description="Step-by-step help to obtain required documents online or offline"
                    />
                    <FeatureCard
                        icon={<CheckCircle className="h-8 w-8 text-primary" />}
                        title="Easy Application"
                        description="Pre-filled forms and real-time validation make applying effortless"
                    />
                    <FeatureCard
                        icon={<Users className="h-8 w-8 text-primary" />}
                        title="Family Support"
                        description="Manage applications for your entire family from one account"
                    />
                </div>
            </section>

            {/* Stats Section */}
            <section className="bg-primary text-white py-16">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-3 gap-8 text-center">
                        <StatCard number="5,000+" label="Schemes Indexed" />
                        <StatCard number="125M+" label="Eligible Citizens" />
                        <StatCard number="22" label="Languages Supported" />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-50 py-8">
                <div className="container mx-auto px-4 text-center text-gray-600">
                    <p>&copy; 2026 Saral Sahayta. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="mb-4">{icon}</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600">{description}</p>
        </div>
    );
}

function StatCard({ number, label }: { number: string; label: string }) {
    return (
        <div>
            <div className="text-4xl md:text-5xl font-bold mb-2">{number}</div>
            <div className="text-primary-100">{label}</div>
        </div>
    );
}
