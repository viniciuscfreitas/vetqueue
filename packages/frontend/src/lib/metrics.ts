"use client";

const QUEUE_FORM_METRICS_KEY = "queue_form_metrics";
const MAX_METRICS_STORED = 50;

export type QueueFormMetricStatus = "submitted" | "abandoned";

export interface QueueFormMetric {
  status: QueueFormMetricStatus;
  variant: "page" | "inline";
  durationMs: number;
  identifyStepMs?: number;
  usedTutorQuickCreate: boolean;
  usedPatientQuickCreate: boolean;
  hasScheduledAppointment: boolean;
  timestamp: string;
}

function loadMetrics(): QueueFormMetric[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(QUEUE_FORM_METRICS_KEY);
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as QueueFormMetric[]) : [];
  } catch (error) {
    console.warn("Failed to load queue form metrics", error);
    return [];
  }
}

function persistMetrics(metrics: QueueFormMetric[]) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(QUEUE_FORM_METRICS_KEY, JSON.stringify(metrics));
  } catch (error) {
    console.warn("Failed to persist queue form metrics", error);
  }
}

export function recordQueueFormMetric(metric: QueueFormMetric) {
  if (typeof window === "undefined") {
    return;
  }

  const metrics = loadMetrics();
  metrics.push(metric);
  while (metrics.length > MAX_METRICS_STORED) {
    metrics.shift();
  }
  persistMetrics(metrics);

  if (window?.console) {
    console.debug("[metrics] queue form", metric);
  }
}

export function clearQueueFormMetrics() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(QUEUE_FORM_METRICS_KEY);
}

export function getQueueFormMetrics(): QueueFormMetric[] {
  return loadMetrics();
}

