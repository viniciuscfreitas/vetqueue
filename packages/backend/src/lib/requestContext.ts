import { AsyncLocalStorage } from "async_hooks";

export interface RequestContext {
  requestId?: string;
  userLogLevel?: "debug" | "info" | "warn" | "error";
  userId?: string;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

export const getRequestContext = (): RequestContext | undefined => {
  return requestContext.getStore();
};

export const getRequestId = (): string | undefined => {
  return getRequestContext()?.requestId;
};

export const getUserLogLevel = (): "debug" | "info" | "warn" | "error" | undefined => {
  return getRequestContext()?.userLogLevel;
};

