// Asks the server to send the welcome email. Sign-up does not depend on it, so callers log a failure and carry on.
export const sendWelcomeEmail = async (email: string): Promise<void> => {
  const res = await fetch('/.netlify/functions/send-welcome-email', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    throw new Error(`Welcome email request failed (${res.status})`);
  }
};
