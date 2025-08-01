'use client'

import React from 'react'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, User, Mic, Shield, History, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isAdmin, signOut, checkAdminStatus, loading } = useAuth()
  const pathname = usePathname()
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)

  React.useEffect(() => {
    if (user) {
      checkAdminStatus(user.id)
    }
  }, [user, checkAdminStatus])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading user session...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null; // Or a redirect, or a message. Let's see how this behaves.
  }

  const isActive = (path: string, exact = false) => {
    if (exact) {
      return pathname === path
    }
    return pathname.startsWith(path)
  }

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: User, exact: true },
    { href: '/dashboard/recordings', label: 'Recordings', icon: Mic },
    { href: '/dashboard/recordings/history', label: 'Past Recordings', icon: History },
  ]

  const adminLinks = [
    { href: '/dashboard/admin/topics', label: 'Manage Topics', icon: Shield },
  ]

  const NavLink = ({ href, label, icon: Icon, exact }: typeof navLinks[0]) => (
    <Link
      href={href}
      onClick={() => setIsSheetOpen(false)}
      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive(href, exact)
          ? 'text-primary bg-primary/10'
          : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
      }`}
    >
      <Icon className="h-5 w-5 mr-3" />
      <span>{label}</span>
    </Link>
  )

  const UserMenu = () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <div className="h-10 w-10 rounded-full bg-gray-800 text-white flex items-center justify-center text-lg font-semibold">
            {user.email?.charAt(0).toUpperCase() || 'U'}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="p-2">
          <p className="text-sm font-medium text-foreground truncate">{user.email}</p>
          <p className="text-xs text-muted-foreground">Welcome back!</p>
        </div>
        <div className="border-t border-border my-2"></div>
        <Button
          onClick={() => signOut()}
          variant="ghost"
          className="w-full justify-start text-sm text-muted-foreground"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </Button>
      </PopoverContent>
    </Popover>
  )

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-2xl font-bold text-gray-900">
                Elite Speaks
              </Link>
            </div>

            <nav className="hidden md:flex items-center space-x-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(link.href, link.exact)
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-primary'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {isAdmin && adminLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-primary'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center">
              <div className="hidden md:block">
                <UserMenu />
              </div>
              <div className="md:hidden">
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Menu className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-72">
                    <div className="p-4">
                      <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xl font-bold">Elite Speaks</h2>
                        <Button variant="ghost" size="icon" onClick={() => setIsSheetOpen(false)}>
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                      <nav className="space-y-2">
                        {navLinks.map((link) => (
                          <NavLink key={link.href} {...link} />
                        ))}
                        {isAdmin && (
                          <div className="pt-4 mt-4 border-t">
                            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                              Admin
                            </p>
                            {adminLinks.map((link) => (
                              <NavLink key={link.href} {...link} />
                            ))}
                          </div>
                        )}
                      </nav>
                      <div className="absolute bottom-4 w-[calc(100%-2rem)]">
                        <div className="border-t pt-4">
                          <UserMenu />
                        </div>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  )
}
