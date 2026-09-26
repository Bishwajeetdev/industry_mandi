import { validationResult } from "express-validator";
import { Resend } from "resend";

// Resend test mode permits delivery only to the account owner's email. Set
// CONTACT_RECIPIENT to rohitraj202434@gmail.com after verifying a sender domain.
const SUPPORT_RECIPIENT = process.env.CONTACT_RECIPIENT || "bishwajeetsingh355@gmail.com";
const escapeHtml = (value) => String(value || "").replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
}[character]));

export async function submit(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error("[contact] RESEND_API_KEY is not configured");
    return res.status(503).json({ success: false, message: "Contact email is not configured yet. Please try again later." });
  }

  const { name, email, topic, message } = req.body;
  const resend = new Resend(process.env.RESEND_API_KEY);
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeTopic = escapeHtml(topic);
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");
  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM || "Industry Mandi <onboarding@resend.dev>",
      to: [SUPPORT_RECIPIENT],
      replyTo: email,
      subject: `[Industry Mandi] ${topic} — ${name}`,
      text: `New contact enquiry\n\nName: ${name}\nEmail: ${email}\nTopic: ${topic}\n\nMessage:\n${message}`,
      html: `<h2>New contact enquiry</h2><p><strong>Name:</strong> ${safeName}<br /><strong>Email:</strong> ${safeEmail}<br /><strong>Topic:</strong> ${safeTopic}</p><p><strong>Message</strong><br />${safeMessage}</p>`,
    });

    if (error) {
      console.error("[contact] Resend delivery failed", error);
      const detail = error.message || "Resend rejected the email request.";
      return res.status(502).json({ success: false, message: process.env.NODE_ENV === "production" ? "We could not send your message. Please try again shortly." : `Resend: ${detail}` });
    }
  } catch (error) {
    console.error("[contact] Resend request threw an error", error);
    const detail = error?.message || "Unable to contact Resend.";
    return res.status(502).json({ success: false, message: process.env.NODE_ENV === "production" ? "We could not send your message. Please try again shortly." : `Resend: ${detail}` });
  }

  return res.status(201).json({ success: true, message: "Message received. Our team will reply within one business day." });
}
