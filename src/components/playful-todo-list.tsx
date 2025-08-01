'use client'

import { Check, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Task {
  id: number
  text: string
  isCompleted: boolean
  isDynamic: boolean
}

interface PlayfulTodoListProps {
  tasks: Task[]
  onTaskClick?: (id: number) => void
}

export const PlayfulTodoList = ({ tasks, onTaskClick }: PlayfulTodoListProps) => {
  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div
          key={task.id}
          className={cn(
            "flex items-center justify-between rounded-lg border p-4 transition-all",
            task.isCompleted
              ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
              : "border-border bg-background",
            task.isDynamic && !task.isCompleted && onTaskClick
              ? "cursor-pointer hover:border-primary/50 hover:bg-secondary/50"
              : ""
          )}
          onClick={() => task.isDynamic && !task.isCompleted && onTaskClick?.(task.id)}
        >
          <div className="flex items-center">
            <div
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all",
                task.isCompleted
                  ? "border-green-500 bg-green-500"
                  : "border-primary"
              )}
            >
              {task.isCompleted && <Check className="h-4 w-4 text-white" />}
            </div>
            <span
              className={cn(
                "ml-3 font-medium",
                task.isCompleted ? "text-muted-foreground line-through" : "text-foreground"
              )}
            >
              {task.text}
            </span>
          </div>
          {task.isDynamic && !task.isCompleted && (
            <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
          )}
        </div>
      ))}
    </div>
  )
}
