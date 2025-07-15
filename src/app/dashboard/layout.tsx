'use client'

import React from 'react'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, User, Mic, Settings, Shield } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isAdmin, signOut, checkAdminStatus } = useAuth()
  const pathname = usePathname()
  
  // Auto-check admin status on layout mount
  React.useEffect(() => {
    if (user) {
      // Refresh admin status when layout mounts
      checkAdminStatus();
    }
  }, [user, checkAdminStatus]);
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    )
  }
  
  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`)
  }
  
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white p-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Elite Speaks</h1>
          <p className="text-sm text-gray-400">Dashboard</p>
        </div>
        
        <nav className="space-y-1">
          <Link 
            href="/dashboard" 
            className={`flex items-center px-4 py-2 rounded-md ${
              isActive('/dashboard') && !pathname.includes('/dashboard/') 
                ? 'bg-gray-800 text-white' 
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <User className="h-5 w-5 mr-3" />
            Dashboard
          </Link>
          
          <Link 
            href="/dashboard/recordings" 
            className={`flex items-center px-4 py-2 rounded-md ${
              isActive('/dashboard/recordings') 
                ? 'bg-gray-800 text-white' 
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <Mic className="h-5 w-5 mr-3" />
            Recordings
          </Link>
          
          {/* Admin Links - Only show if user is admin */}
          {isAdmin && (
            <div className="pt-4 mt-4 border-t border-gray-700">
              <p className="px-4 text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                Admin Area
              </p>
              
              <Link 
                href="/dashboard/admin/topics" 
                className={`flex items-center px-4 py-2 rounded-md ${
                  isActive('/dashboard/admin/topics') 
                    ? 'bg-gray-800 text-white' 
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <Shield className="h-5 w-5 mr-3" />
                Manage Topics
              </Link>
            </div>
          )}
        </nav>
        
        <div className="absolute bottom-4 w-56">
          <div className="border-t border-gray-700 pt-4">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center">
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium text-white truncate">
                  {user.email}
                </p>
                <button 
                  onClick={() => signOut()} 
                  className="mt-1 text-xs text-gray-400 hover:text-white flex items-center"
                >
                  <LogOut className="h-3 w-3 mr-1" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
      
      {/* Main content */}
      <main className="flex-1 bg-gray-50">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
