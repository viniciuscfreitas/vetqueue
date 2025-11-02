export function parseDateRange(query: any): { start?: Date; end?: Date } {
  const start = query.startDate
    ? new Date((query.startDate as string) + "T00:00:00-03:00")
    : undefined;
  const end = query.endDate
    ? new Date((query.endDate as string) + "T23:59:59.999-03:00")
    : undefined;
  return { start, end };
}

