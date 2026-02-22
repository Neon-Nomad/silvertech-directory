import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const brevoApiKey = Deno.env.get("BREVO_API_KEY");
const brevoSenderEmail = Deno.env.get("BREVO_SENDER_EMAIL") || "andrew@silvertechdirectory.com";
const brevoSenderName = Deno.env.get("BREVO_SENDER_NAME") || "SilverTech Directory";

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

        const payload = {
            sender: { name: brevoSenderName, email: brevoSenderEmail },
            to: [{ email }],
            subject: "Welcome to SilverTech Directory!",
            htmlContent: `
            <html>
                <body>
                    <h1>Welcome to SilverTech Directory!</h1>
                    <p>Thank you for signing up. We're excited to have you on board.</p>
                    <p>You can now log in to your account.</p>
                    <a href="https://silvertechdirectory.com/login">Login Now</a>
                </body>
            </html>
        `,
            textContent: `
            Welcome to SilverTech Directory!
            Thank you for signing up. We're excited to have you on board.
            You can now log in to your account by visiting https://silvertechdirectory.com/login
        `,
        };

        const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "api-key": brevoApiKey,
            },
            body: JSON.stringify(payload),
        });

        if (!brevoResponse.ok) {
            const errorText = await brevoResponse.text();
            throw new Error(`Brevo API request failed (${brevoResponse.status}): ${errorText}`);
        }

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
