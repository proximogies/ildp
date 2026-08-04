import { BrevoClient } from '@getbrevo/brevo';

function getClient() {
  return new BrevoClient({ apiKey: process.env.BREVO_API_KEY });
}

const MAIL_FROM = process.env.MAIL_FROM || 'noreply@ildp.org';
const MAIL_FROM_NAME = process.env.MAIL_FROM_NAME || 'ILDP';
const APP_NAME = 'ILDP';

function baseTemplate(bodyContent) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
      <div style="background: #2d6a4f; padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 22px; font-weight: 700;">${APP_NAME}</h1>
        <p style="color: #b7e4c7; margin: 6px 0 0; font-size: 13px;">Inclusive Leadership Digital Platform</p>
      </div>
      <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        ${bodyContent}
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 28px 0 20px;" />
        <p style="color: #9ca3af; font-size: 11px; text-align: center; margin: 0;">
          © ${new Date().getFullYear()} ${APP_NAME}. Empowering inclusive agricultural leadership.
        </p>
      </div>
    </div>
  `;
}

export async function sendInviteEmail({ to, firstName, inviteUrl }) {
  const client = getClient();

  await client.transactionalEmails.sendTransacEmail({
    sender: { name: MAIL_FROM_NAME, email: MAIL_FROM },
    to: [{ email: to, name: firstName }],
    subject: `You've been invited to ${APP_NAME}`,
    htmlContent: baseTemplate(`
      <p style="font-size: 16px; margin: 0 0 8px;">Hi <strong>${firstName}</strong>,</p>
      <p style="color: #4b5563; margin: 0 0 24px;">
        You've been invited to join the Inclusive Leadership Digital Platform.
        Click the button below to set your password and activate your account.
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${inviteUrl}"
          style="background: #2d6a4f; color: #ffffff; padding: 14px 36px; border-radius: 8px;
                 text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
          Accept Invitation
        </a>
      </div>
      <p style="color: #6b7280; font-size: 13px; margin: 0;">
        This link expires in <strong>48 hours</strong>. If you weren't expecting this invite, you can safely ignore this email.
      </p>
    `),
  });
}

export async function sendPasswordResetEmail({ to, firstName, resetUrl }) {
  const client = getClient();

  await client.transactionalEmails.sendTransacEmail({
    sender: { name: MAIL_FROM_NAME, email: MAIL_FROM },
    to: [{ email: to, name: firstName }],
    subject: `Reset your ${APP_NAME} password`,
    htmlContent: baseTemplate(`
      <p style="font-size: 16px; margin: 0 0 8px;">Hi <strong>${firstName}</strong>,</p>
      <p style="color: #4b5563; margin: 0 0 24px;">
        We received a request to reset your password. Click the button below to choose a new one.
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${resetUrl}"
          style="background: #2d6a4f; color: #ffffff; padding: 14px 36px; border-radius: 8px;
                 text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p style="color: #6b7280; font-size: 13px; margin: 0;">
        This link expires in <strong>1 hour</strong>. If you didn't request a reset, you can safely ignore this email.
      </p>
    `),
  });
}
