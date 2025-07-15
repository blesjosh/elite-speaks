'use client'

import { supabase } from '@/lib/supabaseClient'

export interface Topic {
  id: string
  title: string
  description: string
  status: 'active' | 'scheduled' | 'expired' | 'drafted'
  scheduled_for: string
  expires_at: string | null
  difficulty_level: 'easy' | 'medium' | 'hard'
  is_generated: boolean
  source: string
  tags: string[]
  created_at: string
}

export const topicsService = {
  // Get the current active topic
  getActiveTopic: async (): Promise<Topic | null> => {
    try {
      const { data, error } = await supabase.rpc('get_active_topic')
      
      if (error) {
        console.error('Error fetching active topic:', error)
        return null
      }
      
      return data && data.length > 0 ? data[0] : null
    } catch (error) {
      console.error('Failed to fetch active topic:', error)
      return null
    }
  },
  
  // Get all topics
  getAllTopics: async (): Promise<Topic[]> => {
    try {
      const { data, error } = await supabase
        .from('speaking_topics')
        .select('*')
        .order('scheduled_for', { ascending: false })
      
      if (error) {
        console.error('Error fetching topics:', error)
        return []
      }
      
      return data as Topic[] || []
    } catch (error) {
      console.error('Failed to fetch topics:', error)
      return []
    }
  },
  
  // Get topics by status
  getTopicsByStatus: async (status: 'active' | 'scheduled' | 'expired' | 'drafted'): Promise<Topic[]> => {
    try {
      const { data, error } = await supabase
        .from('speaking_topics')
        .select('*')
        .eq('status', status)
        .order('scheduled_for', { ascending: false })
      
      if (error) {
        console.error(`Error fetching ${status} topics:`, error)
        return []
      }
      
      return data as Topic[] || []
    } catch (error) {
      console.error(`Failed to fetch ${status} topics:`, error)
      return []
    }
  },
  
  // Create a new topic
  createTopic: async (topic: Omit<Topic, 'id' | 'created_at'>): Promise<Topic | null> => {
    try {
      const { data, error } = await supabase
        .from('speaking_topics')
        .insert([topic])
        .select()
      
      if (error) {
        console.error('Error creating topic:', error)
        return null
      }
      
      return data && data.length > 0 ? data[0] : null
    } catch (error) {
      console.error('Failed to create topic:', error)
      return null
    }
  },
  
  // Update an existing topic
  updateTopic: async (id: string, updates: Partial<Omit<Topic, 'id' | 'created_at'>>): Promise<Topic | null> => {
    try {
      const { data, error } = await supabase
        .from('speaking_topics')
        .update(updates)
        .eq('id', id)
        .select()
      
      if (error) {
        console.error('Error updating topic:', error)
        return null
      }
      
      return data && data.length > 0 ? data[0] : null
    } catch (error) {
      console.error('Failed to update topic:', error)
      return null
    }
  },
  
  // Delete a topic
  deleteTopic: async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('speaking_topics')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('Error deleting topic:', error)
        return false
      }
      
      return true
    } catch (error) {
      console.error('Failed to delete topic:', error)
      return false
    }
  },
  
  // Check if user is admin
  isUserAdmin: async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('is_admin')
        .eq('user_id', userId)
        .single()
      
      if (error) {
        console.error('Error checking admin status:', error)
        return false
      }
      
      return data?.is_admin || false
    } catch (error) {
      console.error('Failed to check admin status:', error)
      return false
    }
  },
}
