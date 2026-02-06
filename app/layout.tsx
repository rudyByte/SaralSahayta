import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { SWRProvider } from '@/lib/swr-config';
import { Navbar } from '@/components/navigation/navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'SahayoG - Universal Scheme Gateway',
    description: 'AI-powered scholarship and government scheme aggregation platform connecting eligible citizens with financial assistance programs across India.',
    keywords: ['scholarship', 'government schemes', 'financial assistance', 'India', 'education', 'welfare'],
    authors: [{ name: 'SahayoG Team' }],
    openGraph: {
        title: 'SahayoG - Universal Scheme Gateway',
        description: 'Discover and apply for 5,000+ government schemes and scholarships',
        type: 'website',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                <SWRProvider>
                    <AuthProvider>
                        <Navbar />
                        <main className="pt-20">
                            {children}
                        </main>
                    </AuthProvider>
                </SWRProvider>
            </body>
        </html>
    );
}
