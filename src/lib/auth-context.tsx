'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isAdmin: boolean
  signUp: (email: string, password: string) => Promise<any>
  signIn: (email: string, password: string) => Promise<any>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<any>
  checkAdminStatus: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  const checkAdminStatus = async () => {
    if (!user) {
      setIsAdmin(false);
      return false;
    }
    
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('is_admin')
        .eq('user_id', user.id)
        .single();
      
      // Handle case where user doesn't have a record in user_roles
      if (error && error.code === 'PGRST116') { // No rows returned error
        console.log('User has no admin role record:', user.id);
        setIsAdmin(false);
        return false;
      } else if (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        return false;
      }
      
      const isUserAdmin = data?.is_admin === true;
      setIsAdmin(isUserAdmin);
      return isUserAdmin;
    } catch (error) {
      console.error('Failed to check admin status:', error);
      setIsAdmin(false);
      return false;
    }
  };

  useEffect(() => {
    // Function to update auth state
    const updateAuthState = async (session: Session | null) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // If we have a user, check admin status
      if (session?.user) {
        await checkAdminStatus();
      } else {
        setIsAdmin(false);
      }
      
      setLoading(false);
    };
    
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      await updateAuthState(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("Auth state changed:", _event);
      // Always refresh admin status when auth state changes
      await updateAuthState(session);
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : undefined
      }
    })
    return { data, error }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined
      }
    })
    return { data, error }
  }

  const value = {
    user,
    session,
    loading,
    isAdmin,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
    checkAdminStatus,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}