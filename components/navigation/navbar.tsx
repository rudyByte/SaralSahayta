"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useSWR from 'swr';
import {
    Menu,
    X,
    Search,
    BookOpen,
    User,
    LogOut,
    ChevronDown,
    LayoutDashboard,
    Bell,
    HelpCircle,
    Zap,
    History,
    Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { NotificationBell } from './notification-bell';

export function Navbar() {
    const { user, signOut } = useAuth();
    const pathname = usePathname();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const isDashboard = pathname.startsWith('/dashboard') || 
                        pathname.startsWith('/life-events') || 
                        pathname.startsWith('/discover') || 
                        pathname.startsWith('/documents') ||
                        pathname.startsWith('/applications') ||
                        pathname.startsWith('/settings') ||
                        pathname.startsWith('/profile') ||
                        pathname.startsWith('/premium');

    // Fetch profile data for the name
    const { data: profileData } = useSWR(user ? '/api/profile' : null);
    const profileName = profileData?.profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0];

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    const guestLinks = [
        { name: 'Schemes', href: '/discover' },
        { name: 'How it Works', href: '/#features' },
        { name: 'About', href: '/#about' },
        { name: 'Resources', href: '/resources' },
    ];

    const authLinks = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Journey', href: '/life-events', icon: History },
        { name: 'Schemes', href: '/discover', icon: Search },
    ];

    return (
        <header className={cn(
            "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
            isDashboard ? "lg:pl-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 py-3" : 
            isScrolled ? "bg-white shadow-sm border-b border-slate-100 py-3" : "bg-transparent py-6"
        )}>

            <div className="container mx-auto px-4 md:px-8">
                <nav className="flex items-center justify-between gap-8 text-slate-900">
                    
                    {/* Brand / Context Title */}
                    <div className="flex items-center gap-3">
                        {!isDashboard ? (
                            <Link href="/" className="flex items-center gap-2 group">
                                <div className="bg-primary text-white p-1.5 rounded-xl group-hover:scale-110 transition-transform shadow-lg shadow-primary/20 shrink-0">
                                    <Zap className="h-5 w-5 sm:h-6 sm:w-6 fill-current" />
                                </div>
                                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 leading-none">
                                    Saral<span className="text-primary">Sahayta</span>
                                </span>
                            </Link>
                        ) : (
                            <div className="flex items-center gap-2 min-w-0">
                                <Link href="/dashboard" className="flex items-center gap-2 shrink-0 group">
                                    <div className="bg-primary text-white p-1.5 rounded-xl shadow-md shadow-primary/20">
                                        <Zap className="h-4 w-4 fill-current" />
                                    </div>
                                </Link>
                                <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-400 truncate max-w-[140px] sm:max-w-xs">
                                    {pathname.split('/')[1]?.replace('-', ' ') || 'Portal'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Navigation - Dynamic based on state */}
                    {!isDashboard ? (
                        <div className="hidden md:flex items-center gap-1.5">
                            {guestLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="px-5 py-2 rounded-full text-sm font-bold text-slate-600 hover:text-primary hover:bg-primary/5 transition-all"
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="hidden md:flex flex-1 max-w-md">
                            <div className="relative w-full group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                <input 
                                    type="text" 
                                    placeholder="Quick search (schemes, documents, help)..."
                                    className="w-full h-11 bg-slate-50 border-0 rounded-2xl pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    <span className="px-1.5 py-0.5 rounded-md border border-slate-200 text-[10px] text-slate-400 font-bold bg-white">CTRL</span>
                                    <span className="px-1.5 py-0.5 rounded-md border border-slate-200 text-[10px] text-slate-400 font-bold bg-white">K</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Auth / Profile Actions */}
                    <div className="flex items-center gap-3 md:gap-4">
                        {user ? (
                            <>
                                <div className="hidden sm:flex items-center gap-1">
                                    <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 text-slate-400 hover:text-primary hover:bg-primary/5">
                                        <HelpCircle className="h-5 w-5" />
                                    </Button>
                                    <NotificationBell />
                                </div>
                                
                                <div className="relative">
                                    <button
                                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                                        className="flex items-center gap-3 p-1.5 pr-3 hover:bg-slate-100 rounded-2xl transition-all border border-transparent hover:border-slate-100"
                                    >
                                        <div className="h-9 w-9 rounded-xl bg-primary-100 text-primary flex items-center justify-center font-black text-xs ring-2 ring-white shadow-sm overflow-hidden border border-primary/20">
                                            {profileName?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="hidden sm:block text-left mr-1">
                                            <p className="text-xs font-black text-slate-900 truncate leading-none mb-1">
                                                {profileName}
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter leading-none">
                                                My Account
                                            </p>
                                        </div>
                                        <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform duration-300", isProfileOpen && "rotate-180")} />
                                    </button>

                                    {/* Dropdown Menu */}
                                    {isProfileOpen && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                                            <div className="absolute right-0 mt-3 w-72 max-w-[90vw] bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-slate-100 z-50 p-3 animate-in fade-in zoom-in duration-300 origin-top-right">
                                                <div className="px-4 py-4 bg-slate-50 rounded-2xl mb-2 flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white font-black text-lg">
                                                        {profileName?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-black text-slate-900 truncate leading-none mb-1">{profileName}</p>
                                                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest truncate">{user.email}</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <ProfileLink 
                                                        href="/dashboard" 
                                                        icon={<LayoutDashboard className="h-4 w-4" />} 
                                                        label="Main Dashboard" 
                                                        onClick={() => setIsProfileOpen(false)} 
                                                    />
                                                    <ProfileLink 
                                                        href="/profile" 
                                                        icon={<User className="h-4 w-4" />} 
                                                        label="Profile Settings" 
                                                        onClick={() => setIsProfileOpen(false)} 
                                                    />
                                                    <ProfileLink 
                                                        href="/premium" 
                                                        icon={<Zap className="h-4 w-4" />} 
                                                        label="Premium Status" 
                                                        onClick={() => setIsProfileOpen(false)} 
                                                    />
                                                    <div className="h-px bg-slate-100 my-2 mx-2" />
                                                    <button
                                                        onClick={() => { signOut(); setIsProfileOpen(false); }}
                                                        className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
                                                    >
                                                        <LogOut className="h-4 w-4" />
                                                        Sign Out
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link href="/login">
                                    <Button variant="ghost" className="rounded-2xl font-black text-slate-600 flex md:px-6">Login</Button>
                                </Link>
                                <Link href="/register">
                                    <Button className="rounded-2xl font-black px-6 shadow-xl shadow-primary/20">Sign Up</Button>
                                </Link>
                            </div>
                        )}

                        {/* Mobile Menu Toggle */}
                        <button
                            className="md:hidden p-2 text-slate-600 hover:text-primary transition-colors"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </nav>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 top-[70px] z-50 bg-white/95 backdrop-blur-xl md:hidden animate-in fade-in slide-in-from-top duration-500">
                    <div className="p-6 space-y-8">
                        {/* Search in mobile */}
                        {isDashboard && (
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search schemes..."
                                    className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-4 font-bold"
                                />
                            </div>
                        )}

                        <nav className="flex flex-col gap-2">
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest px-4 mb-2">Main Navigation</p>
                            {(user ? authLinks : guestLinks).map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="flex items-center gap-4 px-6 py-4 rounded-3xl text-xl font-black text-slate-700 hover:bg-primary/5 hover:text-primary transition-all"
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>
            )}
        </header>
    );
}

function ProfileLink({ href, icon, label, onClick }: any) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-primary rounded-2xl transition-all"
        >
            <div className="p-1.5 bg-slate-100 rounded-lg text-slate-400 group-hover:text-primary">
                {icon}
            </div>
            {label}
        </Link>
    );
}
