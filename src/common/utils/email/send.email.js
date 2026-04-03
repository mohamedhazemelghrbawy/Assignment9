import nodemailer from "nodemailer";
import { EMAIL, PASSWORD } from "../../../../config/config.service.js";
import fs from "node:fs";
import { emailTemplate } from "./email.template.js";
// import nodemailer from "nodemailer";
// import { EMAIL, PASSWORD } from "../../../../config/config.service.js";

export const sendEmail = async ({
  to,
  subject,
  html,
  attachments = [],
} = {}) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    tls: {
      rejectUnauthorized: false,
    },
    auth: {
      user: EMAIL,
      pass: PASSWORD,
    },
  });

  const info = await transporter.sendMail({
    from: `"Mohamed" <${EMAIL}>`,
    to,
    subject: subject || "Hello ✔",
    html,
    attachments,
  });

  console.log("Message sent:", info.messageId);
};

export const generateOTP = async () => {
  return Math.floor(Math.random() * 900000 + 100000);
};
