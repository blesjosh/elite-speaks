'use client'

import React, { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function FixAdminAccess() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFixAccess = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // First check if the user has a record in the user_roles table
      const { data: userData, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        throw new Error(`Failed to get user: ${userError.message}`)
      }
      
      if (!userData.user) {
        throw new Error('No authenticated user found')
      }
      
      const userId = userData.user.id
      
      // Check if user already has a record in user_roles
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
      
      if (roleError) {
        throw new Error(`Failed to check user roles: ${roleError.message}`)
      }
      
      // If user doesn't have a record in user_roles, create one
      if (!roleData || roleData.length === 0) {
        const { data: insertData, error: insertError } = await supabase
          .from('user_roles')
          .insert([{ user_id: userId, is_admin: true }])
          .select()
        
        if (insertError) {
          throw new Error(`Failed to insert user role: ${insertError.message}`)
        }
        
        setResult({
          action: 'insert',
          message: 'Admin role created successfully',
          data: insertData
        })
      } else {
        // User has a record, ensure is_admin is true
        const { data: updateData, error: updateError } = await supabase
          .from('user_roles')
          .update({ is_admin: true, updated_at: new Date().toISOString() })
          .eq('user_id', userId)
          .select()
        
        if (updateError) {
          throw new Error(`Failed to update user role: ${updateError.message}`)
        }
        
        setResult({
          action: 'update',
          message: 'Admin role updated successfully',
          data: updateData
        })
      }
      
      // Force reload the page to refresh auth context
      setTimeout(() => {
        window.location.reload()
      }, 1500)
      
    } catch (err: any) {
      console.error('Error fixing admin access:', err)
      setError(err.message || 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 my-4 border rounded-md bg-gray-50">
      <h3 className="text-lg font-medium mb-2">Fix Admin Access Tool</h3>
      <p className="text-sm text-gray-600 mb-4">
        This tool will attempt to fix your admin access by directly updating the database.
      </p>
      
      <button 
        onClick={handleFixAccess}
        disabled={loading}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
      >
        {loading ? 'Fixing...' : 'Fix Admin Access Now'}
      </button>
      
      {result && (
        <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded">
          <p className="text-green-700 font-medium">{result.message}</p>
          <p className="text-sm text-green-600 mt-1">Action: {result.action}</p>
          <p className="text-xs text-green-600 mt-2">
            Reloading page in a moment to refresh your session...
          </p>
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      )}
    </div>
  )
}
