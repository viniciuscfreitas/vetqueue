import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getTestApp } from "./helpers";
import { __clearClientLogRateLimit } from "../api/routes/clientLogRoutes";

describe("Client log endpoint", () => {
  beforeEach(() => {
    process.env.CLIENT_LOG_RATE_LIMIT_MAX = "1";
    process.env.CLIENT_LOG_RATE_LIMIT_WINDOW_MS = "60000";
    __clearClientLogRateLimit();
  });

  afterEach(() => {
    __clearClientLogRateLimit();
  });

  it("should accept client error payload", async () => {
    const app = getTestApp();

    const response = await app
      .post("/api/client-logs")
      .send({
        level: "error",
        message: "Client crashed",
        stack: "Error: Client crashed\n    at component",
        sessionId: "session-123",
        url: "https://frontend.local/queue",
      })
      .expect(202);

    expect(response.body).toEqual({ acknowledged: true });
  });

  it("should rate limit repeated payloads", async () => {
    const app = getTestApp();

    await app
      .post("/api/client-logs")
      .send({
        level: "error",
        message: "Repeated error",
        sessionId: "session-123",
      })
      .expect(202);

    const rateLimited = await app
      .post("/api/client-logs")
      .send({
        level: "error",
        message: "Repeated error",
        sessionId: "session-123",
      })
      .expect(429);

    expect(rateLimited.body).toEqual({ error: "Too many client logs" });
  });
});


