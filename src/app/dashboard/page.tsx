'use client'

import React, { useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Dashboard() {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading || !user) {
    return null
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {user.email?.split('@')[0] || 'User'}</h1>
        <p className="text-gray-600 mt-2">This is your personal dashboard. Practice your speaking skills and track your progress.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/dashboard/recordings">
              <Button className="w-full">Go to Recordings</Button>
            </Link>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-4">Your Progress</h2>
          <p className="text-gray-500">Start recording to see your progress here.</p>
        </div>
        
        {isAdmin && (
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <h2 className="text-lg font-medium mb-4">Admin Tools</h2>
            <Link href="/dashboard/admin/topics">
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                Manage Speaking Topics
              </Button>
            </Link>
          </div>
        )}
      </div>
      
      {/* No debug information in production */}
    </div>
  )
}
