type ErrorContext = {
  source: 'react-boundary' | 'window-error' | 'unhandled-rejection';
  message: string;
  stack?: string;
  path?: string;
  userAgent?: string;
  extra?: Record<string, unknown>;
};

const getWebhookUrl = () => import.meta.env.VITE_ALERT_WEBHOOK_URL as string | undefined;
const getEnv = () => import.meta.env.MODE || 'unknown';

const toPayload = (context: ErrorContext) => ({
  env: getEnv(),
  app: 'silvertech-directory',
  timestamp: new Date().toISOString(),
  ...context,
});

export const reportFrontendError = async (context: ErrorContext) => {
  try {
    const sentry = (window as any)?.Sentry;
    if (sentry?.captureException) {
      sentry.captureException(new Error(context.message), {
        tags: { source: context.source },
        extra: context.extra,
      });
    }
  } catch {
    // no-op
  }

  const webhook = getWebhookUrl();
  if (!webhook) {
    return;
  }

  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toPayload(context)),
      keepalive: true,
    });
  } catch {
    // no-op
  }
};

