import fs from "fs";
import nodemailer from "nodemailer";

const config = {
  host: process.env.SMTP_HOST || "",
  port: parseInt(process.env.SMTP_PORT || "587"),
  user: process.env.SMTP_USER || "",
  pass: process.env.SMTP_PASS || "",
  from: process.env.EMAIL_FROM || "CircuCity AI <noreply@circucity.com>",
};

let transporter: nodemailer.Transporter | null = null;
let warned = false;

function getTransporter(): nodemailer.Transporter {
  if (!config.host && !fs.existsSync("/usr/sbin/sendmail")) {
    if (!warned) {
      warned = true;
      console.error("[Email] SMTP not configured and sendmail missing - email sending disabled");
    }
    throw new Error("SMTP not configured");
  }
  if (!transporter) {
    transporter = nodemailer.createTransport(
      config.host
        ? {
            host: config.host,
            port: config.port,
            secure: config.port === 465,
            auth: config.user ? { user: config.user, pass: config.pass } : undefined,
            tls: { rejectUnauthorized: false },
          }
        : {
            sendmail: true,
            newline: "unix",
            path: "/usr/sbin/sendmail",
          }
    );
  }
  return transporter;
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<boolean> {
  try {
    await getTransporter().sendMail({
      from: config.from,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html || params.text.replace(/\n/g, "<br>"),
    });
    return true;
  } catch (e) {
    console.error("Email send error:", e);
    return false;
  }
}

export function newConversationEmail(opts: { email: string; storeName: string; customerName: string; message: string; dashboardUrl: string }) {
  return sendEmail({
    to: opts.email,
    subject: `New conversation on ${opts.storeName}`,
    text: `Hi,\n\nA new customer conversation has started on ${opts.storeName}.\n\nCustomer: ${opts.customerName}\nMessage: ${opts.message.substring(0, 200)}\n\nView it: ${opts.dashboardUrl}\n\n- CircuCity AI`,
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto"><h2 style="color:#0A1428">New Conversation</h2><p style="color:#475569">A customer just started a chat on <strong>${opts.storeName}</strong>.</p><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr><td style="padding:8px 12px;background:#f8fafc;font-size:13px;color:#64748b">Customer</td><td style="padding:8px 12px;font-size:13px;color:#0f172a">${opts.customerName}</td></tr><tr><td style="padding:8px 12px;background:#f8fafc;font-size:13px;color:#64748b">Message</td><td style="padding:8px 12px;font-size:13px;color:#0f172a">${opts.message.substring(0, 200)}</td></tr></table><a href="${opts.dashboardUrl}" style="display:inline-block;padding:10px 20px;background:#A3E635;color:#0A1428;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px">View Conversation</a><p style="margin-top:20px;font-size:12px;color:#94a3b8">- CircuCity AI</p></div>`,
  });
}

export function escalationEmail(opts: { email: string; storeName: string; customerName: string; reason: string; dashboardUrl: string }) {
  return sendEmail({
    to: opts.email,
    subject: `⚠ Escalation: ${opts.storeName}`,
    text: `Hi,\n\nA conversation has been escalated on ${opts.storeName}.\n\nCustomer: ${opts.customerName}\nReason: ${opts.reason}\n\nRespond: ${opts.dashboardUrl}\n\n- CircuCity AI`,
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto"><h2 style="color:#0A1428">⚠ Conversation Escalated</h2><p style="color:#475569">A customer on <strong>${opts.storeName}</strong> needs human assistance.</p><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr><td style="padding:8px 12px;background:#f8fafc;font-size:13px;color:#64748b">Customer</td><td style="padding:8px 12px;font-size:13px;color:#0f172a">${opts.customerName}</td></tr><tr><td style="padding:8px 12px;background:#f8fafc;font-size:13px;color:#64748b">Reason</td><td style="padding:8px 12px;font-size:13px;color:#0f172a">${opts.reason}</td></tr></table><a href="${opts.dashboardUrl}" style="display:inline-block;padding:10px 20px;background:#f59e0b;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px">Respond Now</a><p style="margin-top:20px;font-size:12px;color:#94a3b8">- CircuCity AI</p></div>`,
  });
}

export function teamInviteEmail(opts: { email: string; inviterName: string; storeName: string; dashboardUrl: string }) {
  return sendEmail({
    to: opts.email,
    subject: `You've been invited to join ${opts.storeName} on CircuCity AI`,
    text: `Hi,\n\n${opts.inviterName} has invited you to join ${opts.storeName} on CircuCity AI.\n\nClick the link below to accept the invitation:\n${opts.dashboardUrl}\n\n- CircuCity AI`,
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto"><h2 style="color:#0A1428">You're Invited!</h2><p style="color:#475569"><strong>${opts.inviterName}</strong> has invited you to join <strong>${opts.storeName}</strong> on CircuCity AI.</p><a href="${opts.dashboardUrl}" style="display:inline-block;padding:12px 24px;background:#A3E635;color:#0A1428;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;margin:16px 0">Accept Invitation</a><p style="font-size:12px;color:#94a3b8">If you don't have an account, you'll be able to create one when you click the link.</p><p style="margin-top:20px;font-size:12px;color:#94a3b8">- CircuCity AI</p></div>`,
  });
}

export function securityAlertEmail(opts: { email: string; alertType: string; details: string; ip?: string; time: string }) {
  const titles: Record<string, string> = {
    new_login: "New sign-in to your account",
    password_change: "Your password was changed",
    suspicious_activity: "Suspicious activity detected",
    api_key_used: "API key used from new location",
  };
  const title = titles[opts.alertType] || opts.alertType;
  const ipLine = opts.ip ? "\nIP: " + opts.ip : "";
  const body = "Security alert\n\n" + title + "\n\n" + opts.details + ipLine + "\nTime: " + opts.time + "\n\n- CircuCity AI";
  const ipHtml = opts.ip ? "<p style='font-size:13px;color:#64748b;margin-top:12px'>IP: <code style='background:#f1f5f9;padding:2px 6px;border-radius:4px'>" + opts.ip + "</code></p>" : "";
  const htmlContent = "<div style='font-family:sans-serif;max-width:480px;margin:0 auto'><div style='background:#fef2f2;border-radius:12px;padding:24px;text-align:center;margin-bottom:20px'><div style='font-size:36px;margin-bottom:8px'>\uD83D\uDD12</div><h2 style='color:#dc2626;margin:0'>" + title + "</h2></div><p style='color:#475569;font-size:14px'>" + opts.details + "</p>" + ipHtml + "<p style='font-size:12px;color:#94a3b8;margin-top:8px'>" + opts.time + "</p><p style='margin-top:20px;font-size:12px;color:#94a3b8'>- CircuCity AI</p></div>";
  return sendEmail({ to: opts.email, subject: "Security alert - " + title, text: body, html: htmlContent });
}


export function trialEndingEmail(opts: { email: string; storeName: string; daysLeft: number; dashboardUrl: string }) {
  const days = opts.daysLeft;
  const subject = days <= 0
    ? `Your trial has ended - ${opts.storeName}`
    : days === 1
    ? `Your trial ends tomorrow - ${opts.storeName}`
    : `${days} days left on your trial - ${opts.storeName}`;
  const message = days <= 0
    ? `Your free trial for ${opts.storeName} has ended. Upgrade to keep your chatbot running.`
    : `Your free trial for ${opts.storeName} ends in ${days} day${days === 1 ? "" : "s"}. Upgrade to keep your chatbot running without interruption.`;
  return sendEmail({
    to: opts.email,
    subject,
    text: `Hi,\n\n${message}\n\nUpgrade here:\n${opts.dashboardUrl}/dashboard?tab=billing\n\n- CircuCity AI`,
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <div style="background:${days <= 0 ? "#fef2f2" : "#fffbeb"};border-radius:12px;padding:24px;text-align:center;margin-bottom:20px">
        <div style="font-size:36px;margin-bottom:8px">${days <= 0 ? "⏰" : "⏳"}</div>
        <h2 style="color:#0A1428;margin:0 0 4px">${days <= 0 ? "Trial Ended" : "Trial Ending Soon"}</h2>
        <p style="color:#475569;font-size:14px;margin:0">${message}</p>
      </div>
      <a href="${opts.dashboardUrl}/dashboard?tab=billing" style="display:inline-block;padding:12px 24px;background:#A3E635;color:#0A1428;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px">${days <= 0 ? "Reactivate Now" : "Upgrade Now"}</a>
      <p style="margin-top:20px;font-size:12px;color:#94a3b8">- CircuCity AI</p>
    </div>`,
  });
}

export function weeklyDigestEmail(opts: { email: string; storeName: string; stats: { conversations: number; resolved: number; escalated: number; unanswered: number } }) {
  const { stats } = opts;
  return sendEmail({
    to: opts.email,
    subject: `Your weekly report - ${opts.storeName}`,
    text: `Hi,\n\nHere's your weekly AI performance for ${opts.storeName}:\n\n- Conversations: ${stats.conversations}\n- Resolved: ${stats.resolved}\n- Escalated: ${stats.escalated}\n- Unanswered: ${stats.unanswered}\n\n- CircuCity AI`,
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto"><h2 style="color:#0A1428">Weekly Report</h2><p style="color:#475569">Your AI performance for <strong>${opts.storeName}</strong> this week.</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:16px 0">${[
      ["Conversations", stats.conversations, "#A3E635"],
      ["Resolved", stats.resolved, "#34d399"],
      ["Escalated", stats.escalated, "#f59e0b"],
      ["Unanswered", stats.unanswered, "#ef4444"],
    ].map(([label, val, color]) =>
      `<div style="background:#f8fafc;border-radius:8px;padding:12px;text-align:center"><div style="font-size:24px;font-weight:700;color:${color}">${val}</div><div style="font-size:11px;color:#64748b;margin-top:4px">${label}</div></div>`
    ).join("")}</div><p style="margin-top:20px;font-size:12px;color:#94a3b8">- CircuCity AI</p></div>`,
  });
}
