'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type SidebarContextType = {
    isCollapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
    toggle: () => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Auto-collapse on smaller screens
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1280) { // Using 1280 (xl) for auto-collapse
                setIsCollapsed(true);
            } else {
                setIsCollapsed(false);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggle = () => setIsCollapsed(prev => !prev);

    return (
        <SidebarContext.Provider value={{ isCollapsed, setCollapsed: setIsCollapsed, toggle }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    const context = useContext(SidebarContext);
    if (!context) throw new Error('useSidebar must be used within SidebarProvider');
    return context;
}
