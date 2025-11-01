import { useState, useMemo } from "react";

function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDefaultDates() {
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  return {
    start: formatDateLocal(thirtyDaysAgo),
    end: formatDateLocal(today),
  };
}

export function useDateRange() {
  const defaultDates = useMemo(() => getDefaultDates(), []);
  
  const [startDate, setStartDate] = useState(defaultDates.start);
  const [endDate, setEndDate] = useState(defaultDates.end);

  const reset = () => {
    setStartDate(defaultDates.start);
    setEndDate(defaultDates.end);
  };

  return {
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    reset,
  };
}

