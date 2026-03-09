"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useSWR from 'swr';
import {
    Menu,
    X,
    Search,
    Home,
    BookOpen,
    User,
    ClipboardList,
    LogOut,
    ChevronDown,
    LayoutDashboard,
    FileText,
    Bell
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

    // Fetch profile data for the name
    const { data: profileData } = useSWR(user ? '/api/profile' : null);
    const profileName = profileData?.profile?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0];

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

    const navLinks = [
        { name: 'Home', href: '/', icon: <Home className="h-4 w-4" /> },
        { name: 'Discover', href: '/discover', icon: <Search className="h-4 w-4" /> },
        { name: 'My Applications', href: '/applications', icon: <ClipboardList className="h-4 w-4" />, auth: true },
        { name: 'My Documents', href: '/documents', icon: <FileText className="h-4 w-4" />, auth: true },
        { name: 'Resources', href: '/resources', icon: <BookOpen className="h-4 w-4" /> },
    ];

    const filteredLinks = navLinks.filter(link => !link.auth || (link.auth && user));

    return (
        <header className={cn(
            "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
            isScrolled
                ? "bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] py-3"
                : "bg-transparent py-6"
        )}>
            <div className="container mx-auto px-4 md:px-6">
                <nav className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="bg-primary text-white p-1.5 rounded-lg group-hover:scale-110 transition-transform shadow-md">
                            <BookOpen className="h-6 w-6" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-slate-900">
                            Saral<span className="text-primary">Sahayta</span>
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-1">
                        {filteredLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "px-4 py-2 rounded-full text-sm font-medium transition-all hover:bg-slate-100",
                                    pathname === link.href
                                        ? "text-primary bg-primary/10 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                                )}
                            >
                                <div className="flex items-center gap-1.5 px-1">
                                    {link.name}
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Auth Section */}
                    <div className="hidden md:flex items-center gap-4">
                        {user ? (
                            <div className="flex items-center gap-4">
                                <NotificationBell />
                                <div className="relative">
                                    <button
                                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                                        className="flex items-center gap-2 p-1.5 pr-3 hover:bg-slate-100 rounded-full transition-colors"
                                    >
                                        <div className="h-8 w-8 rounded-full bg-primary-100 text-primary flex items-center justify-center font-bold text-xs ring-2 ring-white">
                                            {profileName?.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-sm font-medium text-slate-700 max-w-[120px] truncate">
                                            {profileName}
                                        </span>
                                        <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", isProfileOpen && "rotate-180")} />
                                    </button>

                                    {/* Dropdown Menu */}
                                    {isProfileOpen && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                                            <div className="absolute right-0 mt-3 w-64 bg-white/80 backdrop-blur-2xl rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-white/40 z-50 overflow-hidden animate-in fade-in zoom-in duration-300 origin-top-right">
                                                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                                                    <p className="text-sm font-bold text-slate-900 truncate">{user.email}</p>
                                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-0.5">Verified Account</p>
                                                </div>
                                                <div className="p-2">
                                                    <Link
                                                        href="/profile"
                                                        onClick={() => setIsProfileOpen(false)}
                                                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                                                    >
                                                        <User className="h-4 w-4 text-slate-400" />
                                                        My Profile
                                                    </Link>
                                                    <Link
                                                        href="/settings/notifications"
                                                        onClick={() => setIsProfileOpen(false)}
                                                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                                                    >
                                                        <Bell className="h-4 w-4 text-slate-400" />
                                                        Notifications
                                                    </Link>
                                                    <Link
                                                        href="/discover"
                                                        onClick={() => setIsProfileOpen(false)}
                                                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                                                    >
                                                        <LayoutDashboard className="h-4 w-4 text-slate-400" />
                                                        Dashboard
                                                    </Link>
                                                    <hr className="my-2 border-slate-100" />
                                                    <button
                                                        onClick={() => { signOut(); setIsProfileOpen(false); }}
                                                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <LogOut className="h-4 w-4" />
                                                        Sign Out
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" asChild className="rounded-full px-5">
                                    <Link href="/login">Login</Link>
                                </Button>
                                <Button asChild className="rounded-full px-6 shadow-md shadow-primary/20">
                                    <Link href="/register">Register</Link>
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden p-2 text-slate-600 hover:text-primary transition-colors"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </nav>
            </div>

            {/* Mobile Navigation Menu */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 top-[70px] z-50 bg-white md:hidden animate-in fade-in slide-in-from-top duration-300">
                    <div className="flex flex-col h-full bg-white px-4 py-8 space-y-6 overflow-y-auto">
                        {/* Links */}
                        <div className="flex flex-col space-y-2">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-4 mb-2">Navigation</p>
                            {filteredLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        "flex items-center gap-4 px-4 py-4 rounded-2xl text-lg font-semibold transition-all",
                                        pathname === link.href
                                            ? "text-primary bg-primary-50"
                                            : "text-slate-600 hover:bg-slate-50"
                                    )}
                                >
                                    <div className={cn(
                                        "p-2 rounded-xl",
                                        pathname === link.href ? "bg-primary text-white" : "bg-slate-100 text-slate-500"
                                    )}>
                                        {link.icon}
                                    </div>
                                    {link.name}
                                </Link>
                            ))}
                        </div>

                        {/* Account Section for Mobile */}
                        <div className="pt-6 border-t border-slate-100 flex flex-col space-y-4">
                            {user ? (
                                <>
                                    <div className="px-4">
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-4">Account</p>
                                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                                                {user.email?.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-900 truncate">{user.email}</p>
                                                <p className="text-xs text-slate-500">Citizen Profile</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 px-4">
                                        <Button variant="outline" asChild className="rounded-xl h-12 justify-start px-4">
                                            <Link href="/profile"><User className="h-4 w-4 mr-2" /> Profile</Link>
                                        </Button>
                                        <Button variant="destructive" onClick={signOut} className="rounded-xl h-12 justify-start px-4">
                                            <LogOut className="h-4 w-4 mr-2" /> Logout
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className="grid grid-cols-2 gap-3 px-4">
                                    <Button variant="outline" asChild className="rounded-xl h-12">
                                        <Link href="/login">Login</Link>
                                    </Button>
                                    <Button asChild className="rounded-xl h-12">
                                        <Link href="/register">Register</Link>
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Quote/Trust Badge */}
                        <div className="mt-auto px-4 py-6 text-center">
                            <p className="text-xs text-slate-400">
                                <Search className="h-3 w-3 inline-block mr-1 opacity-50" />
                                Connecting Bharat to Benefits
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
