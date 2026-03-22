import nodemailer from "nodemailer";

export class MailService {
  // Create the transporter once (Singleton)
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.ethereal.email",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  /**
   * Send Email Verification Link
   */
  static async sendVerificationEmail(to: string, token: string) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const mailOptions = {
      from: `"Auth Service Support" <${process.env.SMTP_USER}>`,
      to,
      subject: "Verify Your Email - Auth Service",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
          <h2>Welcome to FinFlow!</h2>
          <p>Thank you for registering. Please click the button below to verify your email address:</p>
          <a href="${verificationUrl}" style="background: #4F46E5; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
          <p>If the button doesn't work, copy and paste this link:</p>
          <p>${verificationUrl}</p>
          <hr />
          <p style="font-size: 0.8em; color: gray;">This link will expire in 24 hours.</p>
        </div>
      `,
    };

    return await this.transporter.sendMail(mailOptions);
  }

  /**
   * Send Password Reset Link
   */
  static async sendPasswordResetEmail(to: string, token: string) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const mailOptions = {
      from: `"Auth Service Security" <${process.env.SMTP_USER}>`,
      to,
      subject: "Reset Your Password - Auth Service",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
          <h2>Password Reset Request</h2>
          <p>We received a request to reset your password. Click the link below to proceed:</p>
          <a href="${resetUrl}" style="background: #EF4444; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `,
    };

    return await this.transporter.sendMail(mailOptions);
  }
}