'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PlayfulTodolist } from '@/components/animate-ui/ui-elements/playful-todolist'
import { ArrowRight } from 'lucide-react'

export default function Dashboard() {
  const { user, profile, loading, fetchProfile } = useAuth()
  const router = useRouter()
  const [tasks, setTasks] = useState([
    { id: 1, text: "Complete a recording and get feedback", isCompleted: false, isDynamic: true },
  ])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchProfile(); // Manually trigger profile fetch
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (profile) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const lastSubmissionDate = profile.last_submission_date
        ? new Date(profile.last_submission_date)
        : null;

      const hasSubmittedToday = lastSubmissionDate ? lastSubmissionDate >= today : false;

      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === 1 ? { ...task, isCompleted: hasSubmittedToday } : task
        )
      );
    }
  }, [profile])

  const handleTaskClick = (id: number) => {
    if (id === 1 && !tasks.find(t => t.id === 1)?.isCompleted) {
      router.push('/dashboard/recordings')
    }
  }

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    )
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {getGreeting()}, {profile?.username || user.email?.split('@')[0] || 'User'}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Ready to elevate your speaking skills? Let's get started.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Your Daily Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <PlayfulTodolist tasks={tasks} onTaskClick={handleTaskClick} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle>Your Elite Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline space-x-2">
                <p className="text-4xl font-bold">{profile?.elite_score ?? 0}</p>
                <span className="text-sm">points</span>
              </div>
              <p className="text-primary-foreground/80 mt-2">
                Keep practicing daily to increase your score!
              </p>
            </CardContent>
          </Card>
          <Card className="hover:bg-secondary/50 transition-colors">
            <a href="/dashboard/recordings/history" className="block p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">Review History</h3>
                  <p className="text-sm text-muted-foreground">See your past performance.</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </a>
          </Card>
        </div>
      </div>
    </div>
  )
}
