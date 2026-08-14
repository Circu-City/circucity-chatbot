const fs = require("fs");
const nodemailer = require("nodemailer");

const env = {};
fs.readFileSync("/opt/circuitcity-ai/.env", "utf8").split("\n").forEach(l => {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2];
});

const cfg = {
  host: env.SMTP_HOST || "(none)",
  port: parseInt(env.SMTP_PORT || "587", 10),
  user: env.SMTP_USER || "(none)",
  hasPass: !!(env.SMTP_PASS),
  from: env.EMAIL_FROM || "(none)",
};
console.log("CONFIG host=%s port=%s user=%s passSet=%s from=%s", cfg.host, cfg.port, cfg.user, cfg.hasPass, cfg.from);

const t = nodemailer.createTransport({
  host: cfg.host === "(none)" ? undefined : cfg.host,
  port: cfg.port,
  secure: cfg.port === 465,
  auth: cfg.user === "(none)" ? undefined : { user: cfg.user, pass: env.SMTP_PASS },
  tls: { rejectUnauthorized: false },
  logger: true,
  debug: true,
});

(async () => {
  try {
    const ok = await t.verify();
    console.log("VERIFY OK:", ok);
  } catch (e) {
    console.error("VERIFY FAILED:", e.message);
    process.exit(1);
  }
  try {
    const info = await t.sendMail({
      from: cfg.from === "(none)" ? "CircuCity AI <noreply@circucity.com>" : cfg.from,
      to: "temitopealome@gmail.com",
      subject: "SMTP direct test " + Date.now(),
      text: "Direct SMTP test from the CircuCity AI server.",
    });
    console.log("SENT:", JSON.stringify(info));
  } catch (e) {
    console.error("SEND FAILED:", e.message);
    process.exit(1);
  }
  t.close();
})();
