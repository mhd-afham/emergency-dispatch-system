// Email configuration for development and testing
const nodemailer = require("nodemailer");

// Create test account configuration for development
const createTestEmailConfig = async () => {
  try {
    // Create a test account with Ethereal Email for development
    const testAccount = await nodemailer.createTestAccount();

    return {
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    };
  } catch (error) {
    console.error("Error creating test email account:", error);
    // Fallback configuration for development
    return {
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USERNAME || "your-email@gmail.com",
        pass: process.env.EMAIL_PASSWORD || "your-app-password",
      },
    };
  }
};

// Production email configuration
const productionEmailConfig = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
};

// Email configuration based on environment
const getEmailConfig = async () => {
  if (process.env.NODE_ENV === "production") {
    return productionEmailConfig;
  } else {
    return await createTestEmailConfig();
  }
};

// Create email transporter
const createEmailTransporter = async () => {
  const config = await getEmailConfig();
  const transporter = nodemailer.createTransporter(config);

  // Log the test email preview URL for development
  if (process.env.NODE_ENV !== "production") {
    console.log(
      "📧 Email Preview URL will be shown in console for each email sent"
    );
    console.log("📧 Test Email Config:", {
      host: config.host,
      port: config.port,
      user: config.auth.user,
    });
  }

  return transporter;
};

// Send email utility function
const sendEmail = async (options) => {
  try {
    const transporter = await createEmailTransporter();

    const mailOptions = {
      from:
        process.env.FROM_EMAIL ||
        `"Respondr Emergency Dispatch" <${
          options.from || "noreply@respondr.lk"
        }>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);

    // Log preview URL for development
    if (process.env.NODE_ENV !== "production") {
      console.log("📧 Email sent successfully!");
      console.log("📧 Preview URL:", nodemailer.getTestMessageUrl(info));
      console.log("📧 Message ID:", info.messageId);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info),
    };
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Email templates
const emailTemplates = {
  passwordReset: (resetUrl, userName) => ({
    subject: "Respondr - Password Reset Request",
    text: `
Hello ${userName || "User"},

You have requested to reset your password for your Respondr Emergency Dispatch System account.

Please click on the following link to reset your password:
${resetUrl}

This link will expire in 10 minutes for security reasons.

If you did not request this password reset, please ignore this email and your password will remain unchanged.

For security reasons, please do not share this link with anyone.

Best regards,
Respondr Emergency Dispatch System
    `,
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-flex; align-items: center; gap: 10px;">
            <div style="width: 40px; height: 40px; background-color: #dc2626; border-radius: 4px; display: flex; align-items: center; justify-content: center;">
              <span style="color: white; font-weight: bold; font-size: 20px;">R</span>
            </div>
            <span style="font-size: 24px; font-weight: bold; color: #1f2937;">Respondr</span>
          </div>
          <p style="color: #6b7280; margin: 5px 0;">Emergency Dispatch System</p>
        </div>
        
        <div style="background-color: #f9fafb; border-radius: 8px; padding: 30px; border-left: 4px solid #dc2626;">
          <h2 style="color: #1f2937; margin-top: 0;">Password Reset Request</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Hello <strong>${userName || "User"}</strong>,
          </p>
          <p style="color: #4b5563; line-height: 1.6;">
            You have requested to reset your password for your Respondr Emergency Dispatch System account.
          </p>
          <p style="color: #4b5563; line-height: 1.6;">
            Please click on the button below to reset your password:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
              Reset My Password
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            <strong>Security Notice:</strong><br>
            • This link will expire in <strong>10 minutes</strong> for security reasons<br>
            • If you did not request this reset, please ignore this email<br>
            • Do not share this link with anyone<br>
            • If the button doesn't work, copy and paste this URL: <br>
            <span style="word-break: break-all; color: #dc2626;">${resetUrl}</span>
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            This email was sent from the Respondr Emergency Dispatch System<br>
            If you need assistance, please contact your system administrator
          </p>
        </div>
      </div>
    `,
  }),
};

module.exports = {
  sendEmail,
  emailTemplates,
  getEmailConfig,
  createEmailTransporter,
};
