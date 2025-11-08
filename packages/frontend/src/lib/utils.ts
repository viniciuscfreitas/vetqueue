import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Priority } from "./api"

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

const QUEUE_FORM_PREFS_KEY = "queue_form_prefs"

export interface QueueFormPreferences {
  serviceType?: string
  priority?: Priority
}

export function loadQueueFormPreferences(): QueueFormPreferences {
  if (typeof window === "undefined") {
    return {}
  }

  try {
    const stored = window.localStorage.getItem(QUEUE_FORM_PREFS_KEY)
    if (!stored) {
      return {}
    }

    const parsed = JSON.parse(stored) as QueueFormPreferences | undefined
    const preferences: QueueFormPreferences = {}

    if (parsed?.serviceType && typeof parsed.serviceType === "string") {
      preferences.serviceType = parsed.serviceType
    }

    if (typeof parsed?.priority === "number" && [Priority.EMERGENCY, Priority.HIGH, Priority.NORMAL].includes(parsed.priority)) {
      preferences.priority = parsed.priority
    }

    return preferences
  } catch (error) {
    console.warn("Failed to load queue form preferences", error)
    return {}
  }
}

export function saveQueueFormPreferences(update: QueueFormPreferences): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    const current = loadQueueFormPreferences()
    const next: QueueFormPreferences = {
      ...current,
      ...update,
    }

    window.localStorage.setItem(QUEUE_FORM_PREFS_KEY, JSON.stringify(next))
  } catch (error) {
    console.warn("Failed to save queue form preferences", error)
  }
}

