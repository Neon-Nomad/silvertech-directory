import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import * as Brevo from "https://esm.sh/@getbrevo/brevo@2.0.0"

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const brevoApiKey = Deno.env.get("BREVO_API_KEY");

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        if (!brevoApiKey) {
            throw new Error("BREVO_API_KEY is not set in environment variables.");
        }

        const { email } = await req.json();

        if (!email) {
            throw new Error("Missing email in request body");
        }

        const api = new Brevo.TransactionalEmailsApi();
        api.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, brevoApiKey);


        const sendSmtpEmail = new Brevo.SendSmtpEmail();
        sendSmtpEmail.sender = { name: "SilverTech Directory", email: "noreply@silvertechdirectory.com" };
        sendSmtpEmail.to = [{ email }];
        sendSmtpEmail.subject = "Welcome to SilverTech Directory!";
        sendSmtpEmail.htmlContent = `
            <html>
                <body>
                    <h1>Welcome to SilverTech Directory!</h1>
                    <p>Thank you for signing up. We're excited to have you on board.</p>
                    <p>You can now log in to your account.</p>
                    <a href="https://silvertechdirectory.com/login">Login Now</a>
                </body>
            </html>
        `;
        sendSmtpEmail.textContent = `
            Welcome to SilverTech Directory!
            Thank you for signing up. We're excited to have you on board.
            You can now log in to your account by visiting https://silvertechdirectory.com/login
        `;
        

        await api.sendTransacEmail(sendSmtpEmail);

        return new Response(
            JSON.stringify({ message: "Registration email sent successfully." }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        );
    } catch (error) {
        console.error("Failed to send registration email:", error.message);
        return new Response(
            JSON.stringify({
                error: error.message,
                details: error.type || "unknown_error"
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            }
        );
    }
});
