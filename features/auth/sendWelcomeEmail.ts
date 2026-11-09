// Asks the server to send the welcome email to the account this session belongs to. The server finds the address
// from the session, so nothing about the recipient is sent from the browser. Failures are only logged: sign-in does not
// depend on this email.
export const requestWelcomeEmail = async (accessToken: string): Promise<void> => {
  const res = await fetch('/.netlify/functions/send-welcome-email', {
    method: 'POST',
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok && res.status !== 200) {
    throw new Error(`Welcome email request failed (${res.status})`);
  }
};
