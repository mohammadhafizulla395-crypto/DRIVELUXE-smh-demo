'use client'

import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { CheckSquare, Play, Check, Calendar, RotateCcw } from 'lucide-react'
import { employeeApi, ApiError } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AdminPageHeader,
  AdminEmptyState,
} from '@/components/admin/admin-ui'
import type { Task } from '@/types'

type Filter = 'all' | 'pending' | 'in_progress' | 'done'

const STATUS_BADGE: Record<Task['status'], string> = {
  pending: 'border-amber-500/30 bg-amber-500/15 text-amber-300',
  in_progress: 'border-sky-500/30 bg-sky-500/15 text-sky-300',
  done: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
}

const STATUS_LABEL: Record<Task['status'], string> = {
  pending: 'Pending',
  in_progress: 'In progress',
  done: 'Done',
}

export function EmployeeTasks() {
  const { toast } = useToast()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loaded, setLoaded] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoaded(false)
    employeeApi.tasks
      .list(filter === 'all' ? undefined : filter)
      .then((res) => setTasks(res.tasks))
      .catch((err) => {
        const e = err as ApiError
        toast({
          title: 'Could not load tasks',
          description: e.message,
          variant: 'destructive',
        })
        setTasks([])
      })
      .finally(() => setLoaded(true))
  }, [filter, toast])

  useEffect(() => {
    load()
  }, [load])

  const advance = async (task: Task) => {
    const next = task.status === 'pending' ? 'in_progress' : 'done'
    setBusyId(task.id)
    try {
      await employeeApi.tasks.update(task.id, next)
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: next } : t)),
      )
      toast({
        title: next === 'in_progress' ? 'Task started' : 'Task completed',
        description:
          next === 'in_progress'
            ? 'Marked as in progress.'
            : 'Nice work — marked as done.',
      })
    } catch (err) {
      const e = err as ApiError
      toast({
        title: 'Update failed',
        description: e.message,
        variant: 'destructive',
      })
    } finally {
      setBusyId(null)
    }
  }

  const reset = async (task: Task) => {
    setBusyId(task.id)
    try {
      await employeeApi.tasks.update(task.id, 'pending')
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: 'pending' } : t)),
      )
      toast({ title: 'Task reset', description: 'Back to pending.' })
    } catch (err) {
      const e = err as ApiError
      toast({
        title: 'Reset failed',
        description: e.message,
        variant: 'destructive',
      })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Today's Tasks"
        description="Tasks assigned to you. Start, complete, or reset them as you progress."
        actions={
          <Select
            value={filter}
            onValueChange={(v) => setFilter(v as Filter)}
          >
            <SelectTrigger className="w-[160px] bg-card/40">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tasks</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {!loaded ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full bg-white/5 rounded-xl" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <AdminEmptyState
          title="No tasks here"
          description={
            filter === 'all'
              ? 'You have no tasks assigned right now. Enjoy the breather.'
              : `No ${STATUS_LABEL[filter as Task['status']]
                  .toLowerCase()} tasks at the moment.`
          }
        />
      ) : (
        <div className="space-y-3">
          {tasks.map((t) => (
            <Card
              key={t.id}
              className={cn(
                'border-white/10 bg-card/40 p-4 flex items-start gap-4',
                t.status === 'done' && 'opacity-70',
              )}
            >
              <div
                className={cn(
                  'grid place-items-center h-10 w-10 rounded-lg shrink-0 ring-1',
                  t.status === 'pending' &&
                    'bg-amber-500/10 ring-amber-500/20 text-amber-300',
                  t.status === 'in_progress' &&
                    'bg-sky-500/10 ring-sky-500/20 text-sky-300',
                  t.status === 'done' &&
                    'bg-emerald-500/10 ring-emerald-500/20 text-emerald-300',
                )}
              >
                <CheckSquare className="h-5 w-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold">{t.title}</h3>
                  <Badge
                    variant="outline"
                    className={STATUS_BADGE[t.status]}
                  >
                    {STATUS_LABEL[t.status]}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
                  {t.description || 'No description provided.'}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Created {format(new Date(t.createdAt), 'MMM d, yyyy')}
                  </span>
                  {t.dueDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Due {format(new Date(t.dueDate), 'MMM d, yyyy')}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {t.status !== 'done' ? (
                  <Button
                    size="sm"
                    onClick={() => advance(t)}
                    disabled={busyId === t.id}
                    className="bg-teal-500/15 text-teal-200 ring-1 ring-teal-400/30 hover:bg-teal-500/25 hover:text-teal-100 border border-teal-400/20"
                  >
                    {t.status === 'pending' ? (
                      <>
                        <Play className="mr-1.5 h-3.5 w-3.5" /> Start
                      </>
                    ) : (
                      <>
                        <Check className="mr-1.5 h-3.5 w-3.5" /> Mark done
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => reset(t)}
                    disabled={busyId === t.id}
                    className="border-white/10 bg-card/40"
                  >
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reopen
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
