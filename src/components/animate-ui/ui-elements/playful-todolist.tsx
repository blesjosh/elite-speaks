'use client';

import * as React from 'react';
import { motion, type Transition } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/animate-ui/radix/checkbox';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

interface Task {
  id: number;
  text: string;
  isCompleted: boolean;
  isDynamic: boolean;
}

interface PlayfulTodolistProps {
  tasks: Task[];
  onTaskClick?: (id: number) => void;
  className?: string;
}

const getPathAnimate = (isChecked: boolean) => ({
  pathLength: isChecked ? 1 : 0,
  opacity: isChecked ? 1 : 0,
});

const getPathTransition = (isChecked: boolean): Transition => ({
  pathLength: { duration: 0.3, ease: 'easeInOut' },
  opacity: {
    duration: 0.01,
    delay: isChecked ? 0 : 0.3,
  },
});

function PlayfulTodolist({ tasks, onTaskClick, className }: PlayfulTodolistProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {tasks.map((task) => (
        <div
          key={task.id}
          className={cn(
            'flex items-center justify-between rounded-lg border p-4 transition-all group',
            task.isCompleted
              ? 'border-green-200 bg-green-50'
              : 'border-border bg-background',
            task.isDynamic && !task.isCompleted && onTaskClick
              ? 'cursor-pointer hover:border-primary/50 hover:bg-secondary/50'
              : ''
          )}
          onClick={() => task.isDynamic && !task.isCompleted && onTaskClick?.(task.id)}
        >
          <div className="flex items-center">
            <Checkbox
              checked={task.isCompleted}
              id={`checkbox-${task.id}`}
              className="pointer-events-none"
            />
            <div className="relative ml-3">
              <Label
                htmlFor={`checkbox-${task.id}`}
                className={cn(
                  'font-medium',
                  task.isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'
                )}
              >
                {task.text}
              </Label>
              {task.isCompleted && (
                <motion.svg
                  width="100%"
                  height="24"
                  viewBox="0 0 200 24"
                  className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none z-10 w-full"
                  initial={false}
                  animate={getPathAnimate(task.isCompleted)}
                >
                  <motion.path
                    d="M 2 12.91 s 39.8 -11.36 58.1 -11.34 c 22.2 0.02 -27.82 14.25 -13.39 22.02 c 12.61 6.77 84.18 -27.98 93.31 -17.28 c 7.52 8.38 -6.8 20.02 24.61 22.05 c 24.55 1.93 73.37 -20.36 73.37 -20.36"
                    vectorEffect="non-scaling-stroke"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeMiterlimit={10}
                    fill="none"
                    transition={getPathTransition(task.isCompleted)}
                    className="stroke-muted-foreground"
                  />
                </motion.svg>
              )}
            </div>
          </div>
          {task.isDynamic && !task.isCompleted && (
            <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
          )}
        </div>
      ))}
    </div>
  );
}

export { PlayfulTodolist };
