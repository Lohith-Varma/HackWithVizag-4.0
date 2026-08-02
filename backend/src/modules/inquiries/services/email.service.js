import nodemailer from "nodemailer";

export const sendInquiryEmail = async ({ name, email, phone, subject, message }) => {
  const recipientEmail = process.env.INQUIRY_RECIPIENT_EMAIL || "hackwithvizag@nsrit.edu.in";
  const formattedDate = new Date().toLocaleString("en-IN", {
    dateStyle: "full",
    timeStyle: "medium",
    timeZone: "Asia/Kolkata",
  });

  const textContent = `
NEW GENERAL INQUIRY - HACK WITH VIZAG 4.0
-----------------------------------------
Submission Date & Time: ${formattedDate}

SENDER DETAILS:
Name: ${name}
Email: ${email}
Phone: ${phone || "Not provided"}

INQUIRY DETAILS:
Subject: ${subject}

Message:
${message}
-----------------------------------------
  `.trim();

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">New General Inquiry - Hack With Vizag 4.0</h2>
      <p style="font-size: 12px; color: #666;">Submitted on: <strong>${formattedDate}</strong></p>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
        <tr style="background-color: #f8fafc;">
          <td style="padding: 10px; font-weight: bold; width: 30%;">Full Name:</td>
          <td style="padding: 10px;">${name}</td>
        </tr>
        <tr>
          <td style="padding: 10px; font-weight: bold;">Email Address:</td>
          <td style="padding: 10px;"><a href="mailto:${email}">${email}</a></td>
        </tr>
        <tr style="background-color: #f8fafc;">
          <td style="padding: 10px; font-weight: bold;">Phone Number:</td>
          <td style="padding: 10px;">${phone || "<em>Not provided</em>"}</td>
        </tr>
        <tr>
          <td style="padding: 10px; font-weight: bold;">Subject:</td>
          <td style="padding: 10px; font-weight: bold; color: #1e293b;">${subject}</td>
        </tr>
      </table>

      <div style="margin-top: 20px; padding: 15px; background-color: #f1f5f9; border-radius: 6px;">
        <h4 style="margin-top: 0; color: #334155;">Message:</h4>
        <p style="white-space: pre-wrap; color: #334155; line-height: 1.6;">${message}</p>
      </div>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin-top: 25px;" />
      <p style="font-size: 11px; color: #94a3b8; text-align: center;">This message was generated automatically from the Hack With Vizag 4.0 Landing Page Contact Form.</p>
    </div>
  `;

  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();

  if (!smtpUser || !smtpPass) {
    console.log("--------------------------------------------------");
    console.log("[EMAIL SERVICE NOTICE] SMTP_USER/SMTP_PASS not fully configured.");
    console.log(`[INQUIRY EMAIL MOCK DISPATCH] Target: ${recipientEmail}`);
    console.log(`Subject: [Hack With Vizag Inquiry] ${subject}`);
    console.log(textContent);
    console.log("--------------------------------------------------");
    return true;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  await transporter.sendMail({
    from: `"Hack With Vizag Inquiry" <${smtpUser}>`,
    replyTo: `"${name}" <${email}>`,
    to: recipientEmail,
    subject: `[Hack With Vizag Inquiry] ${subject}`,
    text: textContent,
    html: htmlContent,
  });

  return true;
};
