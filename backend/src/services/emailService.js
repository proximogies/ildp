import nodemailer from 'nodemailer';

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.BREVO_SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_KEY, // Brevo SMTP key (not API key)
    },
  });
}

const MAIL_FROM = process.env.MAIL_FROM || 'noreply@ildp.org';
const APP_NAME = 'ILDP';

export async function sendInviteEmail({ to, firstName, inviteUrl }) {
  const transporter = createTransport();

  await transporter.sendMail({
    from: `"${APP_NAME}" <${MAIL_FROM}>`,
    to,
    subject: `You've been invited to ${APP_NAME}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
        <div style="background: #2d6a4f; padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px;">${APP_NAME}</h1>
          <p style="color: #b7e4c7; margin: 8px 0 0;">Inclusive Leadership Digital Platform</p>
        </div>
        <div style="background: #fff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px;">Hi <strong>${firstName}</strong>,</p>
          <p style="color: #4b5563;">You've been invited to join the Inclusive Leadership Digital Platform. Click the button below to set your password and activate your account.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${inviteUrl}" style="background: #2d6a4f; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          <p style="color: #6b7280; font-size: 13px;">This link expires in 48 hours. If you weren't expecting this invite, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} ILDP. Empowering inclusive agricultural leadership.</p>
        </div>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail({ to, firstName, resetUrl }) {
  const transporter = createTransport();

  await transporter.sendMail({
    from: `"${APP_NAME}" <${MAIL_FROM}>`,
    to,
    subject: `Reset your ${APP_NAME} password`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
        <div style="background: #2d6a4f; padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px;">${APP_NAME}</h1>
          <p style="color: #b7e4c7; margin: 8px 0 0;">Inclusive Leadership Digital Platform</p>
        </div>
        <div style="background: #fff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px;">Hi <strong>${firstName}</strong>,</p>
          <p style="color: #4b5563;">We received a request to reset your password. Click the button below to choose a new one.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="background: #2d6a4f; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #6b7280; font-size: 13px;">This link expires in 1 hour. If you didn't request a reset, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} ILDP. Empowering inclusive agricultural leadership.</p>
        </div>
      </div>
    `,
  });
}
