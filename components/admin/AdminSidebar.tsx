'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    FileText,
    FolderOpen,
    BarChart3,
    Settings,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Applications', href: '/admin/applications', icon: FileText },
    { name: 'Schemes', href: '/admin/schemes', icon: FolderOpen },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div
            className={cn(
                'bg-primary-900 text-white transition-all duration-300 flex flex-col',
                collapsed ? 'w-20' : 'w-64'
            )}
        >
            {/* Logo */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-primary-800">
                {!collapsed && (
                    <h1 className="text-xl font-bold">Admin Portal</h1>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-2 rounded-lg hover:bg-primary-800 transition-colors"
                >
                    {collapsed ? (
                        <ChevronRight className="h-5 w-5" />
                    ) : (
                        <ChevronLeft className="h-5 w-5" />
                    )}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {navigation.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/admin' && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'flex items-center px-3 py-3 rounded-lg transition-colors group',
                                isActive
                                    ? 'bg-primary-800 text-white'
                                    : 'text-primary-100 hover:bg-primary-800 hover:text-white'
                            )}
                        >
                            <item.icon
                                className={cn(
                                    'h-5 w-5 flex-shrink-0',
                                    isActive ? 'text-white' : 'text-primary-300 group-hover:text-white'
                                )}
                            />
                            {!collapsed && (
                                <span className="ml-3 font-medium">{item.name}</span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User Info */}
            {!collapsed && (
                <div className="p-4 border-t border-primary-800">
                    <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-primary-700 flex items-center justify-center">
                            <Users className="h-5 w-5" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium">Admin User</p>
                            <p className="text-xs text-primary-300">Super Admin</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
