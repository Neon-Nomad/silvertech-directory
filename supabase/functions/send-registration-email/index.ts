import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-api-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
}

const resendApiKey = Deno.env.get("RESEND_API_KEY");
const resendSenderEmail = Deno.env.get("RESEND_FROM_EMAIL") || "andrew@silvertechdirectory.com";
const resendSenderName = Deno.env.get("RESEND_FROM_NAME") || "SilverTech Directory";

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        if (!resendApiKey) {
            throw new Error("RESEND_API_KEY is not set in environment variables.");
        }

        const { email } = await req.json();

        if (!email) {
            throw new Error("Missing email in request body");
        }

        const payload = {
            from: `${resendSenderName} <${resendSenderEmail}>`,
            to: [email],
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

        const resendResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify(payload),
        });

        if (!resendResponse.ok) {
            const errorText = await resendResponse.text();
            throw new Error(`Resend API request failed (${resendResponse.status}): ${errorText}`);
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
