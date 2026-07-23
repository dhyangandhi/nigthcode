import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import session from "./routes/sessions";
import { sentry } from "@sentry/hono/bun";
import * as Sentry from "@sentry/hono/bun";
import chat from "./routes/chat";
import auth from "./routes/auth";
const app = new Hono()

app.use(
  sentry(app, {
    dsn: "https://fd03fa8c5c86fefd9bb43bae88c7e7c0@o4511716960370688.ingest.us.sentry.io/4511716965548032",
    tracesSampleRate: 1.0,
    enableLogs: true,
    dataCollection: {
      // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
      // https://docs.sentry.io/platforms/javascript/guides/hono/configuration/options/#dataCollection
      // userInfo: false,
      // httpBodies: [],
    },
  }),
);

app.get("/debug-sentry", () => {
  // Send a log before throwing the error
  Sentry.logger.info('User triggered test error', {
    action: 'test_error_endpoint',
  });
  // Send a test metric before throwing the error
  Sentry.metrics.count('test_counter', 1);
  throw new Error("My first Sentry error!");
});

// Your routes here
app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.onError((error, c) => {
    if (error instanceof HTTPException) {
        Sentry.logger.warn("Handled HTTP error", {
          status: error.status,
          message: error.message || "Request failed",
          path: c.req.path,
          method: c.req.method,
        });

        return c.json({
            error: error.message || "Resquest failed"}, error.status);
    };
    
    Sentry.logger.error("Unhandled server error", {
      path: c.req.path,
      method: c.req.method,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    
    return c.json({ error: "Internal server error"}, 500);
});

const routes = app.route("/auth", auth).route("/sessions", session).route("/chat", chat);

export type AppType = typeof routes;
export default { port: 3000, fetch: app.fetch, idleTimeout: 255 };
