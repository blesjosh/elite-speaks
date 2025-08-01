'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-fixed'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Trash2, Pencil, Plus, AlertCircle } from 'lucide-react'

// Define topic interface
interface Topic {
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

// For the new topic form
interface TopicFormData {
  title: string
  description: string
  status: 'active' | 'scheduled' | 'drafted' | 'expired'
  scheduled_for: string
  expires_at: string
  difficulty_level: 'easy' | 'medium' | 'hard'
  tags: string
  is_generated: boolean
  source: string
}

export default function AdminTopicsPage() {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()
  const [topics, setTopics] = useState<Topic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(null)
  const [formData, setFormData] = useState<TopicFormData>({
    title: '',
    description: '',
    status: 'drafted',
    scheduled_for: new Date().toISOString().split('T')[0],
    expires_at: '',
    difficulty_level: 'medium',
    tags: '',
    is_generated: false,
    source: 'admin'
  })
  
  // Define fetchTopics function before using it
  const fetchTopics = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('speaking_topics')
        .select('*')
        .order('scheduled_for', { ascending: false })
      
      if (error) throw error
      
      setTopics(data || [])
    } catch (error) {
      console.error('Error fetching topics:', error)
      alert('Failed to load topics')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Fetch topics on component mount
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login')
      } else if (!isAdmin) {
        // Check if user is admin using the auth context value
        router.push('/dashboard')
      } else {
        // User is admin, fetch topics
        fetchTopics()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, isAdmin])
  
  const handleCreateTopic = async () => {
    try {
      // Convert tags string to array
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      
      const { data, error } = await supabase
        .from('speaking_topics')
        .insert([
          {
            title: formData.title,
            description: formData.description,
            status: formData.status,
            scheduled_for: formData.scheduled_for,
            expires_at: formData.expires_at || null,
            difficulty_level: formData.difficulty_level,
            tags: tagsArray,
            is_generated: formData.is_generated,
            source: formData.source,
            created_by: user?.id
          }
        ])
        .select()
      
      if (error) throw error
      
      // Instead of refetching, update state locally
      if (data) {
        setTopics(prevTopics => [data[0], ...prevTopics])
      }
      
      // Close the dialog and reset form
      setIsDialogOpen(false)
      resetForm()
      
      alert('Topic created successfully!')
    } catch (error) {
      console.error('Error creating topic:', error)
      alert('Failed to create topic')
    }
  }
  
  const handleUpdateTopic = async () => {
    if (!currentTopic) return
    
    try {
      // Convert tags string to array
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      
      const { data, error } = await supabase
        .from('speaking_topics')
        .update({
          title: formData.title,
          description: formData.description,
          status: formData.status,
          scheduled_for: formData.scheduled_for,
          expires_at: formData.expires_at || null,
          difficulty_level: formData.difficulty_level,
          tags: tagsArray,
          is_generated: formData.is_generated,
          source: formData.source
        })
        .eq('id', currentTopic.id)
        .select()
      
      if (error) throw error
      
      // Instead of refetching, update state locally
      if (data) {
        setTopics(prevTopics => 
          prevTopics.map(t => t.id === currentTopic.id ? data[0] : t)
        )
      }
      
      // Close the dialog and refresh topics
      setIsDialogOpen(false)
      setIsEditMode(false)
      setCurrentTopic(null)
      resetForm()
      
      alert('Topic updated successfully!')
    } catch (error) {
      console.error('Error updating topic:', error)
      alert('Failed to update topic')
    }
  }
  
  const handleDeleteTopic = async (id: string) => {
    if (!confirm('Are you sure you want to delete this topic?')) return
    
    try {
      const { error } = await supabase
        .from('speaking_topics')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      // Instead of refetching, update state locally
      setTopics(prevTopics => prevTopics.filter(t => t.id !== id))
      
      alert('Topic deleted successfully!')
    } catch (error) {
      console.error('Error deleting topic:', error)
      alert('Failed to delete topic')
    }
  }
  
  const handleEditTopic = (topic: Topic) => {
    if (!topic) return;
    
    setCurrentTopic(topic)
    setIsEditMode(true)
    
    // Ensure we have valid defaults for all fields
    const defaultDate = new Date();
    
    // Populate form with topic data
    setFormData({
      title: topic.title || '',
      description: topic.description || '',
      status: (topic.status as 'active' | 'scheduled' | 'drafted' | 'expired') || 'drafted',
      scheduled_for: topic.scheduled_for ? topic.scheduled_for.split('T')[0] : new Date().toISOString().split('T')[0],
      expires_at: topic.expires_at ? topic.expires_at.split('T')[0] : '',
      difficulty_level: (topic.difficulty_level as 'easy' | 'medium' | 'hard') || 'medium',
      tags: topic.tags && Array.isArray(topic.tags) ? topic.tags.join(', ') : '',
      is_generated: Boolean(topic.is_generated),
      source: topic.source || 'admin'
    })
    
    setIsDialogOpen(true)
  }
  
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: 'drafted',
      scheduled_for: new Date().toISOString().split('T')[0],
      expires_at: '',
      difficulty_level: 'medium',
      tags: '',
      is_generated: false,
      source: 'admin'
    })
  }
  
  const handleFormChange = (field: keyof TopicFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">Active</Badge>
      case 'scheduled':
        return <Badge variant="outline" className="border-blue-500 text-blue-500">Scheduled</Badge>
      case 'expired':
        return <Badge variant="outline" className="border-gray-500 text-gray-500">Expired</Badge>
      case 'drafted':
        return <Badge variant="outline" className="border-amber-500 text-amber-500">Draft</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }
  
  const getDifficultyBadge = (level: string) => {
    switch (level) {
      case 'easy':
        return <Badge variant="outline" className="border-green-500 text-green-500">Easy</Badge>
      case 'medium':
        return <Badge variant="outline" className="border-blue-500 text-blue-500">Medium</Badge>
      case 'hard':
        return <Badge variant="outline" className="border-red-500 text-red-500">Hard</Badge>
      default:
        return <Badge variant="outline">{level}</Badge>
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-['Inter_Tight']">
                Admin Dashboard
              </h1>
              <p className="text-gray-600">Manage speaking topics</p>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={() => router.push('/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Tabs defaultValue="all" className="w-full">
            <div className="flex justify-between items-center mb-6">
              <TabsList>
                <TabsTrigger value="all">All Topics</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                <TabsTrigger value="expired">Expired</TabsTrigger>
                <TabsTrigger value="drafted">Drafts</TabsTrigger>
              </TabsList>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setIsEditMode(false)
                    setCurrentTopic(null)
                    resetForm()
                  }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Topic
                  </Button>
                </DialogTrigger>
                
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>
                      {isEditMode ? 'Edit Topic' : 'Create New Topic'}
                    </DialogTitle>
                    <DialogDescription>
                      {isEditMode 
                        ? 'Update the details for this speaking topic.' 
                        : 'Add a new topic for users to practice speaking about.'}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="title" className="text-right">
                        Title
                      </Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleFormChange('title', e.target.value)}
                        className="col-span-3"
                        placeholder="Enter a clear, engaging title"
                      />
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="description" className="text-right">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleFormChange('description', e.target.value)}
                        className="col-span-3"
                        placeholder="Provide context, talking points, or questions for the speaker"
                        rows={4}
                      />
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="status" className="text-right">
                        Status
                      </Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => handleFormChange('status', value as 'active' | 'scheduled' | 'drafted' | 'expired')}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="drafted">Draft</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="scheduled" className="text-right">
                        Scheduled For
                      </Label>
                      <Input
                        id="scheduled"
                        type="date"
                        value={formData.scheduled_for}
                        onChange={(e) => handleFormChange('scheduled_for', e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="expires" className="text-right">
                        Expires At
                      </Label>
                      <Input
                        id="expires"
                        type="date"
                        value={formData.expires_at}
                        onChange={(e) => handleFormChange('expires_at', e.target.value)}
                        className="col-span-3"
                        placeholder="Optional expiration date"
                      />
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="difficulty" className="text-right">
                        Difficulty
                      </Label>
                      <Select
                        value={formData.difficulty_level}
                        onValueChange={(value) => handleFormChange('difficulty_level', value as 'easy' | 'medium' | 'hard')}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="tags" className="text-right">
                        Tags
                      </Label>
                      <Input
                        id="tags"
                        value={formData.tags}
                        onChange={(e) => handleFormChange('tags', e.target.value)}
                        className="col-span-3"
                        placeholder="Comma-separated tags (news, technology, ethics)"
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => {
                      setIsDialogOpen(false)
                      setIsEditMode(false)
                      setCurrentTopic(null)
                      resetForm()
                    }}>
                      Cancel
                    </Button>
                    <Button onClick={isEditMode ? handleUpdateTopic : handleCreateTopic}>
                      {isEditMode ? 'Update Topic' : 'Create Topic'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            <TabsContent value="all" className="mt-2">
              <TopicsTable 
                topics={topics} 
                onEdit={handleEditTopic} 
                onDelete={handleDeleteTopic} 
                getStatusBadge={getStatusBadge}
                getDifficultyBadge={getDifficultyBadge}
              />
            </TabsContent>
            
            <TabsContent value="active" className="mt-2">
              <TopicsTable 
                topics={topics.filter(topic => topic.status === 'active')} 
                onEdit={handleEditTopic} 
                onDelete={handleDeleteTopic} 
                getStatusBadge={getStatusBadge}
                getDifficultyBadge={getDifficultyBadge}
              />
            </TabsContent>
            
            <TabsContent value="scheduled" className="mt-2">
              <TopicsTable 
                topics={topics.filter(topic => topic.status === 'scheduled')} 
                onEdit={handleEditTopic} 
                onDelete={handleDeleteTopic} 
                getStatusBadge={getStatusBadge}
                getDifficultyBadge={getDifficultyBadge}
              />
            </TabsContent>
            
            <TabsContent value="expired" className="mt-2">
              <TopicsTable 
                topics={topics.filter(topic => topic.status === 'expired')} 
                onEdit={handleEditTopic} 
                onDelete={handleDeleteTopic} 
                getStatusBadge={getStatusBadge}
                getDifficultyBadge={getDifficultyBadge}
              />
            </TabsContent>
            
            <TabsContent value="drafted" className="mt-2">
              <TopicsTable 
                topics={topics.filter(topic => topic.status === 'drafted')} 
                onEdit={handleEditTopic} 
                onDelete={handleDeleteTopic} 
                getStatusBadge={getStatusBadge}
                getDifficultyBadge={getDifficultyBadge}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

interface TopicsTableProps {
  topics: Topic[]
  onEdit: (topic: Topic) => void
  onDelete: (id: string) => void
  getStatusBadge: (status: string) => React.ReactNode
  getDifficultyBadge: (level: string) => React.ReactNode
}

const TopicsTable = React.memo(function TopicsTable({ topics, onEdit, onDelete, getStatusBadge, getDifficultyBadge }: TopicsTableProps) {
  // Ensure topics is always an array
  const topicsArray = Array.isArray(topics) ? topics : [];
  
  if (topicsArray.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="bg-gray-100 p-3 rounded-full">
            <AlertCircle className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-medium">No topics found</h3>
          <p className="mt-2 text-sm text-gray-500">
            Create a new topic to get started
          </p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Scheduled For</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topicsArray.map((topic) => {
              // Skip rendering if topic is undefined or missing id
              if (!topic || !topic.id) return null;
              
              return (
                <TableRow key={topic.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{topic.title || 'Untitled'}</div>
                      <div className="text-sm text-gray-500 line-clamp-1">{topic.description || 'No description'}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(topic.status || 'drafted')}</TableCell>
                  <TableCell>{topic.scheduled_for ? new Date(topic.scheduled_for).toLocaleDateString() : 'Not scheduled'}</TableCell>
                  <TableCell>{getDifficultyBadge(topic.difficulty_level || 'medium')}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {topic.tags && Array.isArray(topic.tags) ? topic.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      )) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => onEdit(topic)} title="Edit Topic">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      
                      <Button variant="ghost" size="icon" onClick={() => onDelete(topic.id)} title="Delete Topic">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
})
