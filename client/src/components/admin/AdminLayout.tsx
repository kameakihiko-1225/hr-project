import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Building2, 
  LayoutList, 
  Briefcase, 
  Users,
  Menu,
  X,
  CheckCircle2,
  AlertCircle,
  Image,
  TrendingUp
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

import { createLogger } from "@/lib/logger";

import { Label } from "@/components/ui/label";
import { LanguageSelector } from '../ui/LanguageSelector';

const logger = createLogger('adminLayout');

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [location, navigate] = useLocation();
  const isMobile = useIsMobile();
  // Authentication removed - no user management needed
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const navigation = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Companies", href: "/admin/companies", icon: Building2 },
    { name: "Departments", href: "/admin/departments", icon: LayoutList },
    { name: "Positions", href: "/admin/positions", icon: Briefcase },

    { name: "Blog", href: "/admin/blog", icon: Image },

    { name: "Admin Users", href: "/admin/admins", icon: Users },
  ];

  const isActive = (path: string) => {
    return location.startsWith(path);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleSubmenu = (name: string) => {
    setExpandedItems((prev) => 
      prev.includes(name) 
        ? prev.filter(item => item !== name) 
        : [...prev, name]
    );
  };

  // Authentication removed - no logout needed

  // Authentication removed - no user avatar needed

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div 
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out md:relative md:translate-x-0`}
      >
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-white">
          <img src="/2025-07-14 1.05.36 PM.jpg" alt="Millat Umidi HR Logo" className="h-20 w-20 object-contain" />
          <span className="text-xl font-bold tracking-tight" style={{ color: '#222' }}>
            Millat Umidi HR
          </span>
        </div>
        <nav className="flex flex-col p-4 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
          {navigation.map((item) => (
            <div key={item.name}>
              {'submenu' in item ? (
                <div>
                  <button
                    onClick={() => toggleSubmenu(item.name)}
                    className={`flex items-center justify-between px-4 py-3 text-sm font-medium rounded-md w-full text-left ${
                      isActive(item.submenu?.[0]?.href || '')
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <div className="flex items-center">
                      <item.icon
                        className={`mr-3 h-5 w-5 ${
                          isActive(item.submenu?.[0]?.href || '') ? "text-blue-500" : "text-gray-400"
                        }`}
                      />
                      {item.name}
                    </div>
                    <svg
                      className={`h-5 w-5 transform ${expandedItems.includes(item.name) ? 'rotate-180' : ''} transition-transform`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  {expandedItems.includes(item.name) && (
                    <div className="pl-10 space-y-1">
                      {item.submenu?.map((subItem) => (
                        <Link
                          key={subItem.name}
                          to={subItem.href}
                          className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                            isActive(subItem.href)
                              ? "bg-blue-50 text-blue-600"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          }`}
                        >
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                    isActive(item.href)
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      isActive(item.href) ? "text-blue-500" : "text-gray-400"
                    }`}
                  />
                  {item.name}
                </Link>
              )}
            </div>
          ))}

        </nav>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top header */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between h-16 px-4">
            {isMobile && (
              <Button variant="ghost" size="icon" onClick={toggleSidebar}>
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <div className="flex-1 flex justify-end items-center gap-4">
              {/* Language Selector */}
              <LanguageSelector className="mr-2" />

            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}; 