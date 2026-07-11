import { Resend } from "resend";
import { config } from "@/lib/config";

const resend = config.RESEND_API_KEY ? new Resend(config.RESEND_API_KEY) : null;

export async function sendInviteEmail(
  email: string,
  testTitle: string,
  inviteLink: string,
  companyName: string
) {
  if (!resend) {
    console.warn("RESEND_API_KEY not configured. Email not sent to:", email);
    console.warn("Invite Link:", inviteLink);
    return;
  }

  try {
    await resend.emails.send({
      from: "TokenHire <invites@tokenhire.dev>", // Replace with your verified domain
      to: email,
      subject: `You've been invited to take a ${testTitle} assessment by ${companyName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Hello!</h2>
          <p>You have been invited by <strong>${companyName}</strong> to take a technical assessment for <strong>${testTitle}</strong>.</p>
          <p>Click the button below to start your assessment. The link will expire according to the test's settings.</p>
          <div style="margin: 30px 0;">
            <a href="${inviteLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Start Assessment
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:<br/>
          <a href="${inviteLink}">${inviteLink}</a></p>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
          <p style="color: #888; font-size: 12px;">Powered by TokenHire</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send invite email:", error);
  }
}
