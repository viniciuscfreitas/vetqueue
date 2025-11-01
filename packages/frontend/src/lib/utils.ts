import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
}

export function calculateWaitTime(createdAt: string | Date, calledAt?: string | Date | null): string {
  const created = new Date(createdAt)
  if (!calledAt) {
    const now = new Date()
    const diff = now.getTime() - created.getTime()
    return formatDuration(diff)
  }
  const called = new Date(calledAt)
  const diff = called.getTime() - created.getTime()
  return formatDuration(diff)
}

export function calculateServiceTime(calledAt?: string | Date | null, completedAt?: string | Date | null): string {
  if (!calledAt) return "—"
  
  const called = new Date(calledAt)
  const endTime = completedAt ? new Date(completedAt) : new Date()
  const diff = endTime.getTime() - called.getTime()
  
  if (!completedAt) {
    return `${formatDuration(diff)} (em andamento)`
  }
  return formatDuration(diff)
}

