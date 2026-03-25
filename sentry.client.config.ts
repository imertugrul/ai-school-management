// This file configures the initialization of Sentry on the browser.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://df4f8d3c5e1a16d30a3e36b9db572869@o4511107275554816.ingest.de.sentry.io/4511107280601168",

  tracesSampleRate: 1,
  enableLogs: true,

  // Don't send PII by default on the client
  sendDefaultPii: false,

  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "Non-Error promise rejection captured",
  ],

  beforeSend(event) {
    if (event.request?.data && typeof event.request.data === "object") {
      const data = event.request.data as Record<string, unknown>;
      delete data.password;
      delete data.email;
      delete data.token;
    }
    return event;
  },
});
