import { QueueEntry, Status } from "@/lib/api";

export function sortQueueEntries(entries: QueueEntry[]): QueueEntry[] {
  return [...entries].sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

export function splitActiveEntries(entries: QueueEntry[]) {
  const sorted = sortQueueEntries(entries);

  const waiting = sorted.filter((entry) => entry.status === Status.WAITING);
  const inProgress = sorted
    .filter(
      (entry) => entry.status === Status.CALLED || entry.status === Status.IN_PROGRESS,
    )
    .sort((a, b) => {
      if (a.status === Status.CALLED && b.status === Status.IN_PROGRESS) return -1;
      if (a.status === Status.IN_PROGRESS && b.status === Status.CALLED) return 1;
      return 0;
    });

  return {
    waiting,
    inProgress,
  };
}

