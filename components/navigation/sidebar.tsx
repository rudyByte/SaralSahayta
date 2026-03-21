'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
    LayoutDashboard, 
    Search, 
    History, 
    Files, 
    ClipboardList, 
    Settings, 
    Zap,
    LogOut,
    ChevronRight,
    Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Discover', href: '/discover', icon: Search },
    { name: 'My Journey', href: '/life-events', icon: History, highlight: true },
    { name: 'Document Vault', href: '/documents', icon: Files },
    { name: 'Applications', href: '/applications', icon: ClipboardList },
    { name: 'Settings', href: '/settings', icon: Settings },
];

import useSWR from 'swr';
import { useAuth } from '@/lib/auth-context';
export function Sidebar() {
    const pathname = usePathname();
    const { user, signOut } = useAuth();
    const [isHovered, setIsHovered] = React.useState(false);

    // Sidebar strictly expands on hover and auto-closes otherwise
    const isExpanded = isHovered;
    
    // Fetch profile data for the name
    const { data: profileData } = useSWR(user ? '/api/profile' : null);
    const profileName = profileData?.profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0];
    const userRole = profileData?.profile?.is_admin ? 'Administrator' : 'Verified Citizen';

    return (
        <motion.aside 
            initial={false}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            animate={{ 
                width: isExpanded ? 288 : 80,
            }}
            transition={{ type: "spring", bounce: 0, duration: 0.15 }}
            className={cn(
                "h-screen fixed left-0 top-0 z-[60] flex flex-col transition-all duration-150 border-r shrink-0",
                "bg-white/40 backdrop-blur-[40px] border-white/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)]",
                isExpanded && "shadow-[12px_0_40px_rgba(0,0,0,0.08)]"
            )}
        >
            {/* Logo Section */}
            <div className={cn(
                "pt-4 pb-3 px-6 flex items-center justify-between transition-all duration-150",
                !isExpanded ? "flex-col gap-4" : "flex-row"
            )}>
                <Link href="/dashboard" className="flex items-center group">
                    <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform shrink-0">
                        <Zap className="text-white h-5 w-5 fill-current" />
                    </div>
                    
                    <div className={cn(
                        "flex items-center overflow-hidden transition-all duration-150",
                        isExpanded ? "w-auto opacity-100 ml-3" : "w-0 opacity-0"
                    )}>
                        <span className="text-xl font-black text-slate-900 tracking-tight whitespace-nowrap">
                            Saral <span className="text-primary">Sahayta</span>
                        </span>
                    </div>
                </Link>
            </div>

            {/* Navigation Section */}
            <nav className="flex-1 px-3 space-y-1 mt-4 overflow-y-auto no-scrollbar">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    
                    return (
                        <Link key={item.name} href={item.href}>
                            <motion.div 
                                whileHover={{ x: !isExpanded ? 0 : 4 }}
                                className={cn(
                                "relative flex items-center px-4 py-3.5 rounded-2xl transition-all duration-200 group",
                                !isExpanded ? "justify-center" : "gap-3",
                                isActive 
                                    ? "bg-white text-primary shadow-sm border border-slate-100" 
                                    : "text-slate-500 hover:bg-white/50 hover:text-slate-900"
                            )}>
                                {isActive && isExpanded && (
                                    <motion.div 
                                        layoutId="sidebar-active"
                                        className="absolute left-0 w-1.5 h-6 bg-primary rounded-r-full"
                                    />
                                )}
                                <Icon className={cn(
                                    "h-5 w-5 transition-colors shrink-0",
                                    isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-600"
                                )} />
                                
                                <div className={cn(
                                    "flex items-center flex-1 overflow-hidden transition-all duration-150",
                                    isExpanded ? "w-auto opacity-100 ml-3" : "w-0 opacity-0"
                                )}>
                                    <span className="font-bold text-sm tracking-wide flex-1 whitespace-nowrap">
                                        {item.name}
                                    </span>
                                    {item.highlight && (
                                        <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse shrink-0 ml-2" />
                                    )}
                                </div>
                            </motion.div>
                        </Link>
                    );
                })}
            </nav>

            {/* Premium Upgrade (Contextual) - Hidden when collapsed */}
            <div className={cn(
                "px-6 mt-auto transition-all duration-150 overflow-hidden",
                isExpanded ? "opacity-100 max-h-64 py-6" : "opacity-0 max-h-0 py-0"
            )}>
                <div className="bg-gradient-to-br from-indigo-600 to-primary p-5 rounded-[2rem] relative overflow-hidden group shadow-xl shadow-primary/10 w-60">
                    <div className="absolute top-[-10px] right-[-10px] opacity-10 group-hover:rotate-12 transition-transform duration-500">
                        <Sparkles className="h-20 w-20 text-white" />
                    </div>
                    <p className="text-white font-black text-sm mb-1 whitespace-nowrap">Upgrade to Premium</p>
                    <p className="text-indigo-100/70 text-[10px] font-bold leading-tight mb-4 uppercase tracking-widest whitespace-nowrap">
                        Fast-track applications
                    </p>
                    <Link href="/premium">
                        <Button className="w-full bg-white text-primary hover:bg-indigo-50 font-black h-10 rounded-xl text-xs shadow-md border-0 transition-all active:scale-95 whitespace-nowrap">
                            Get Pro Now
                        </Button>
                    </Link>
                </div>
            </div>

            {/* User Profile Hook */}
            <div className={cn(
                "p-4 border-t border-slate-100/50 transition-all duration-150",
                !isExpanded ? "items-center" : "px-6"
            )}>
                <div className={cn(
                    "flex items-center",
                    !isExpanded ? "flex-col" : "flex-row"
                )}>
                    <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-xs shadow-md shadow-primary/20 shrink-0">
                        {profileName?.charAt(0).toUpperCase()}
                    </div>
                    
                    <div className={cn(
                        "flex-1 min-w-0 transition-all duration-150 overflow-hidden",
                        isExpanded ? "opacity-100 ml-3 w-auto" : "opacity-0 w-0"
                    )}>
                        <p className="text-xs font-black text-slate-900 truncate whitespace-nowrap">{profileName}</p>
                        <p className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-tighter whitespace-nowrap">{userRole}</p>
                    </div>
                    
                    <button 
                        onClick={() => signOut()}
                        className={cn(
                            "p-2 rounded-xl hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all active:scale-90 shrink-0",
                            !isExpanded && "mt-1",
                            isExpanded && "ml-3"
                        )}
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </motion.aside>
    );
}
