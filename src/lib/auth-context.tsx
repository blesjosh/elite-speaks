'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

interface Profile {
  elite_score: number;
  last_submission_date: string | null;
  username: string | null;
}

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isAdmin: boolean
  profile: Profile | null
  fetchProfile: () => Promise<void>
  signUp: (email: string, password: string) => Promise<any>
  signIn: (email: string, password: string) => Promise<any>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<any>
  checkAdminStatus: (userId: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)

  const checkAdminStatus = useCallback(async (userId: string) => {
    if (!userId) {
      setIsAdmin(false);
      return false;
    }
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('is_admin')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code === 'PGRST116') {
        setIsAdmin(false);
        return false;
      } else if (error) {
        throw error;
      }
      
      const isUserAdmin = data?.is_admin === true;
      setIsAdmin(isUserAdmin);
      return isUserAdmin;
    } catch (error) {
      console.error('Failed to check admin status:', error);
      setIsAdmin(false);
      return false;
    }
  }, []);

  const fetchProfile = useCallback(async (userToFetch: User) => {
    try {
      const { data, error, status } = await supabase
        .from('profiles')
        .select(`elite_score, last_submission_date, username`)
        .eq('user_id', userToFetch.id)
        .single();

      if (error && status !== 406) throw error;
      if (data) setProfile(data);
    } catch (error: any) {
      console.error('Error fetching user profile:', error.message || error);
    }
  }, []);

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setSession(session);
      setLoading(false);
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const manageUserData = async () => {
      if (user) {
        await Promise.all([
          checkAdminStatus(user.id),
          fetchProfile(user)
        ]);
      } else {
        setIsAdmin(false);
        setProfile(null);
      }
    };
    manageUserData();
  }, [user, checkAdminStatus, fetchProfile]);


  const signUp = useCallback(async (email: string, password: string) => {
    return supabase.auth.signUp({ email, password });
  }, []);

  const signIn = useCallback((email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    // No need to push here, the auth state change will handle it
  }, []);

  const signInWithGoogle = useCallback(() => {
    return supabase.auth.signInWithOAuth({ provider: 'google' });
  }, []);

  const memoizedFetchProfile = useCallback(() => {
    if (user) {
      return fetchProfile(user);
    }
    return Promise.resolve();
  }, [user, fetchProfile]);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    isAdmin,
    profile,
    fetchProfile: memoizedFetchProfile,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
    checkAdminStatus,
  }), [user, session, loading, isAdmin, profile, memoizedFetchProfile, signUp, signIn, signOut, signInWithGoogle, checkAdminStatus]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}