'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabaseClient'

export default function AdminStatusChecker() {
  const { user, isAdmin, checkAdminStatus } = useAuth()
  const [checking, setChecking] = useState(false)
  const [directCheck, setDirectCheck] = useState<boolean | null>(null)
  const [userInfo, setUserInfo] = useState<any>(null)

  const checkDirectly = async () => {
    if (!user) return
    
    setChecking(true)
    try {
      // Direct DB query to check admin status
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      setDirectCheck(data?.is_admin || false)
      setUserInfo(data)
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking admin status directly:', error)
      }
    } catch (error) {
      console.error('Failed to check admin status directly:', error)
    } finally {
      setChecking(false)
    }
  }

  const refreshAdminStatus = async () => {
    setChecking(true)
    if (user) {
      await checkAdminStatus(user.id)
    }
    await checkDirectly()
    setChecking(false)
  }
  
  useEffect(() => {
    if (user) {
      checkDirectly()
    }
  }, [user])

  if (!user) return null

  return (
    <div className="p-4 my-4 border rounded-md bg-gray-50">
      <h3 className="text-lg font-medium mb-2">Admin Status Checker</h3>
      
      <div className="space-y-2 mb-4 text-sm">
        <p><strong>User ID:</strong> {user.id}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Auth Context isAdmin:</strong> {isAdmin ? '✅ Yes' : '❌ No'}</p>
        <p><strong>Direct DB Check:</strong> {
          directCheck === null 
            ? 'Checking...' 
            : directCheck 
              ? '✅ Yes' 
              : '❌ No'
        }</p>
        
        {userInfo === null ? (
          <p><strong>User Role Record:</strong> Not found</p>
        ) : (
          <>
            <p><strong>User Role Record:</strong> Found</p>
            <pre className="bg-gray-100 p-2 rounded overflow-x-auto text-xs">
              {JSON.stringify(userInfo, null, 2)}
            </pre>
          </>
        )}
      </div>
      
      <div className="flex gap-2">
        <button 
          onClick={refreshAdminStatus}
          disabled={checking}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {checking ? 'Checking...' : 'Refresh Admin Status'}
        </button>
      </div>
    </div>
  )
}
