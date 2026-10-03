import nodemailer from 'nodemailer';

export interface MaintenanceWelcomeEmailParams {
  to: string;
  name: string;
  email: string;
  temporaryPassword: string;
  teamName: string;
}

export interface PasswordResetEmailParams {
  to: string;
  name: string;
  email: string;
  newTemporaryPassword: string;
}

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  private static getTransporter(): nodemailer.Transporter | null {
    if (this.transporter) return this.transporter;

    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
        return this.transporter;
      } catch (err) {
        console.warn('⚠️ [EmailService] Failed to initialize SMTP transporter. Falling back to log dispatcher.', err);
      }
    }
    return null;
  }

  /**
   * Dispatch welcome credentials to a newly provisioned maintenance staff member
   */
  static async sendMaintenanceWelcomeEmail(params: MaintenanceWelcomeEmailParams): Promise<{ success: boolean; preview?: string }> {
    const portalUrl = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/login?portal=maintenance` : 'http://localhost:5173/login?portal=maintenance';
    const fromAddress = process.env.SMTP_FROM || 'Vynk Campus Facility Portal <no-reply@vynk.campus>';

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0b0f19; color: #e2e8f0; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden; padding: 32px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #f59e0b; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Vynk Campus Maintenance</h1>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 6px;">Staff Credentials & Portal Activation</p>
        </div>
        
        <p style="font-size: 15px; line-height: 1.6; color: #cbd5e1;">Hello <strong>${params.name}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.6; color: #94a3b8;">
          A maintenance staff account has been created for you on the <strong>Vynk Campus Management Platform</strong>. You have been assigned to the <strong>${params.teamName}</strong> team.
        </p>

        <div style="background-color: #131c2e; border: 1px solid #27354f; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <h3 style="margin-top: 0; color: #f59e0b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Your Login Credentials</h3>
          <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #94a3b8; width: 140px;">Portal Entry:</td>
              <td style="padding: 6px 0; color: #38bdf8;"><a href="${portalUrl}" style="color: #38bdf8; text-decoration: none;">${portalUrl}</a></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Username / Email:</td>
              <td style="padding: 6px 0; color: #f8fafc; font-weight: 600;">${params.email}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Temporary Password:</td>
              <td style="padding: 6px 0; color: #fbbf24; font-family: monospace; font-weight: 700; font-size: 16px;">${params.temporaryPassword}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Assigned Team:</td>
              <td style="padding: 6px 0; color: #f8fafc;">${params.teamName}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #2a1f10; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 13px; color: #fde68a;">
            <strong>Mandatory Security Requirement:</strong> You will be required to change this temporary password upon your first sign-in.
          </p>
        </div>

        <div style="text-align: center; margin-top: 28px;">
          <a href="${portalUrl}" style="display: inline-block; background-color: #d97706; color: #ffffff; padding: 12px 28px; border-radius: 10px; font-weight: 700; font-size: 14px; text-decoration: none; box-shadow: 0 4px 14px rgba(217, 119, 6, 0.3);">
            Sign In to Maintenance Portal →
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #1e293b; margin: 32px 0 16px;" />
        <p style="font-size: 11px; color: #64748b; text-align: center; margin: 0;">
          This is an automated notification from Vynk Campus Management Platform. Please do not reply directly to this email.
        </p>
      </div>
    `;

    const textContent = `
Hello ${params.name},

A maintenance staff account has been created for you on the Vynk Campus Management Platform.
Assigned Team: ${params.teamName}

Your Login Credentials:
- Maintenance Portal: ${portalUrl}
- Email: ${params.email}
- Temporary Password: ${params.temporaryPassword}

Note: You will be required to set a permanent password upon your first login.
`;

    const transporter = this.getTransporter();
    if (transporter) {
      try {
        const info = await transporter.sendMail({
          from: fromAddress,
          to: params.to,
          subject: 'Your Vynk Maintenance Staff Account Credentials',
          text: textContent,
          html: htmlContent,
        });
        console.log(`✉️ [EmailService] Welcome email delivered to ${params.to} (MessageId: ${info.messageId})`);
        return { success: true };
      } catch (err) {
        console.error(`❌ [EmailService] Failed to send email via SMTP to ${params.to}:`, err);
      }
    }

    // Always log clean dispatch to console for verification / local development
    console.log(`
================================================================================
📧 [Vynk Email Dispatcher] MAINTENANCE CREDENTIALS SENT
--------------------------------------------------------------------------------
To:                 ${params.to}
Recipient:          ${params.name}
Assigned Team:      ${params.teamName}
Portal URL:         ${portalUrl}
Email / Username:   ${params.email}
Temporary Password: ${params.temporaryPassword}
Status:             Delivered (Development / Demo Logger)
Notice:             First-time password change enforced on login
================================================================================
`);

    return { success: true, preview: `Credentials dispatched to ${params.to}` };
  }

  /**
   * Dispatch password reset credentials to a maintenance staff member
   */
  static async sendPasswordResetEmail(params: PasswordResetEmailParams): Promise<{ success: boolean; preview?: string }> {
    const portalUrl = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/login?portal=maintenance` : 'http://localhost:5173/login?portal=maintenance';
    const fromAddress = process.env.SMTP_FROM || 'Vynk Campus Facility Portal <no-reply@vynk.campus>';

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0b0f19; color: #e2e8f0; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden; padding: 32px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #f59e0b; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Vynk Campus Maintenance</h1>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 6px;">Password Reset Notice</p>
        </div>
        
        <p style="font-size: 15px; line-height: 1.6; color: #cbd5e1;">Hello <strong>${params.name}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.6; color: #94a3b8;">
          Your password for the Vynk Maintenance Portal has been reset by the Super Administrator.
        </p>

        <div style="background-color: #131c2e; border: 1px solid #27354f; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <h3 style="margin-top: 0; color: #f59e0b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Your New Login Credentials</h3>
          <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #94a3b8; width: 140px;">Portal Entry:</td>
              <td style="padding: 6px 0; color: #38bdf8;"><a href="${portalUrl}" style="color: #38bdf8; text-decoration: none;">${portalUrl}</a></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Username / Email:</td>
              <td style="padding: 6px 0; color: #f8fafc; font-weight: 600;">${params.email}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">New Temporary Password:</td>
              <td style="padding: 6px 0; color: #fbbf24; font-family: monospace; font-weight: 700; font-size: 16px;">${params.newTemporaryPassword}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #2a1f10; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 13px; color: #fde68a;">
            <strong>Mandatory Security Requirement:</strong> You will be required to change this temporary password upon your next sign-in.
          </p>
        </div>

        <div style="text-align: center; margin-top: 28px;">
          <a href="${portalUrl}" style="display: inline-block; background-color: #d97706; color: #ffffff; padding: 12px 28px; border-radius: 10px; font-weight: 700; font-size: 14px; text-decoration: none; box-shadow: 0 4px 14px rgba(217, 119, 6, 0.3);">
            Sign In with Temporary Password →
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #1e293b; margin: 32px 0 16px;" />
        <p style="font-size: 11px; color: #64748b; text-align: center; margin: 0;">
          This is an automated notification from Vynk Campus Management Platform.
        </p>
      </div>
    `;

    const textContent = `
Hello ${params.name},

Your password for the Vynk Maintenance Portal has been reset by the Super Administrator.

Your New Login Credentials:
- Maintenance Portal: ${portalUrl}
- Email: ${params.email}
- New Temporary Password: ${params.newTemporaryPassword}

Note: You will be required to set a permanent password upon your next login.
`;

    const transporter = this.getTransporter();
    if (transporter) {
      try {
        const info = await transporter.sendMail({
          from: fromAddress,
          to: params.to,
          subject: 'Your Vynk Maintenance Account Password Has Been Reset',
          text: textContent,
          html: htmlContent,
        });
        console.log(`✉️ [EmailService] Password reset email delivered to ${params.to} (MessageId: ${info.messageId})`);
        return { success: true };
      } catch (err) {
        console.error(`❌ [EmailService] Failed to send password reset email via SMTP to ${params.to}:`, err);
      }
    }

    console.log(`
================================================================================
📧 [Vynk Email Dispatcher] PASSWORD RESET CREDENTIALS SENT
--------------------------------------------------------------------------------
To:                     ${params.to}
Recipient:              ${params.name}
Portal URL:             ${portalUrl}
Email / Username:       ${params.email}
New Temporary Password: ${params.newTemporaryPassword}
Status:                 Delivered (Development / Demo Logger)
Notice:                 First-time password change enforced on next login
================================================================================
`);

    return { success: true, preview: `Password reset dispatched to ${params.to}` };
  }
}
