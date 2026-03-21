'use client';

import React from 'react';
import { Sidebar } from '@/components/navigation/sidebar';
import { Navbar } from '@/components/navigation/navbar';
import { LifeEventsTrigger } from '@/components/life-events/LifeEventsTrigger';
import { SidebarProvider } from '@/lib/sidebar-context';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            <div className="min-h-screen bg-slate-50/50">
            <LifeEventsTrigger />
            <Navbar />
            
            {/* Fixed Sidebar for desktop */}
            <div className="hidden lg:block">
                <Sidebar />
            </div>
            
            {/* Main Content Area */}
            <main className="pt-20 lg:pl-20 min-h-screen relative z-10">
                <div className="pb-12 px-4 md:px-8">
                    {children}
                </div>
            </main>
        </div>
        </SidebarProvider>
    );
}
