'use client';

import React, { useState, useEffect } from 'react';
import {
    Bell,
    BellRing,
    Check,
    Trash2,
    ExternalLink,
    Calendar,
    FileText,
    Zap,
    Info
} from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import useSWR from 'swr';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const { data, mutate } = useSWR('/api/notifications', fetcher, {
        refreshInterval: 30000 // Refresh every 30s
    });

    const notifications = data?.notifications || [];
    const unreadCount = notifications.filter((n: any) => !n.isRead).length;

    const markAsRead = async (id: string) => {
        await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
        mutate();
    };

    const markAllAsRead = async () => {
        await fetch('/api/notifications/read-all', { method: 'POST' });
        mutate();
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'DEADLINE': return <Calendar className="h-4 w-4 text-rose-500" />;
            case 'EXPIRY': return <FileText className="h-4 w-4 text-amber-500" />;
            case 'MATCH': return <Zap className="h-4 w-4 text-emerald-500" />;
            default: return <Info className="h-4 w-4 text-blue-500" />;
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-10 w-10 rounded-full hover:bg-slate-100 transition-all"
                >
                    {unreadCount > 0 ? (
                        <>
                            <BellRing className="h-5 w-5 text-primary animate-bounce-subtle" />
                            <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white border-2 border-white">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        </>
                    ) : (
                        <Bell className="h-5 w-5 text-slate-500" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="end"
                sideOffset={8}
                className="w-80 md:w-96 p-0 rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">Notifications</span>
                        {unreadCount > 0 && (
                            <Badge variant="secondary" className="bg-primary-500/20 text-primary-300 border-transparent text-[10px]">
                                {unreadCount} New
                            </Badge>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="text-[10px] font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                        >
                            <Check className="h-3 w-3" />
                            Mark all as read
                        </button>
                    )}
                </div>

                {/* Content */}
                <ScrollArea className="h-[400px]">
                    {notifications.length > 0 ? (
                        <div className="flex flex-col">
                            {notifications.map((n: any) => (
                                <div
                                    key={n.id}
                                    className={cn(
                                        "p-4 border-b border-slate-100 transition-colors hover:bg-slate-50 relative group",
                                        !n.isRead && "bg-primary-50/30"
                                    )}
                                >
                                    <div className="flex gap-3">
                                        <div className={cn(
                                            "mt-1 h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border",
                                            !n.isRead ? "bg-white border-primary/20" : "bg-slate-100 border-slate-200"
                                        )}>
                                            {getIcon(n.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-0.5">
                                                <p className={cn(
                                                    "text-sm font-bold truncate pr-6",
                                                    !n.isRead ? "text-slate-900" : "text-slate-600"
                                                )}>
                                                    {n.title}
                                                </p>
                                                {!n.isRead && (
                                                    <span className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-2">
                                                {n.message}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-medium text-slate-400">
                                                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    {n.link && (
                                                        <Link
                                                            href={n.link}
                                                            onClick={() => { setIsOpen(false); markAsRead(n.id); }}
                                                            className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5"
                                                        >
                                                            View
                                                            <ExternalLink className="h-2.5 w-2.5" />
                                                        </Link>
                                                    )}
                                                    {!n.isRead && (
                                                        <button
                                                            onClick={() => markAsRead(n.id)}
                                                            className="text-[10px] font-bold text-slate-400 hover:text-slate-900"
                                                        >
                                                            Read
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                            <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                                <Bell className="h-6 w-6 text-slate-300" />
                            </div>
                            <p className="text-sm font-bold text-slate-900">Quiet for now</p>
                            <p className="text-xs text-slate-500 mt-1 max-w-[180px]">
                                When you have alerts about deadlines or schemes, they'll appear here.
                            </p>
                        </div>
                    )}
                </ScrollArea>

                {/* Footer */}
                <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
                    <Link
                        href="/settings/notifications"
                        onClick={() => setIsOpen(false)}
                        className="text-xs font-bold text-slate-600 hover:text-primary transition-colors"
                    >
                        Notification Settings
                    </Link>
                </div>
            </PopoverContent>
        </Popover>
    );
}
