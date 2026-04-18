const nodemailer = require("nodemailer");

function smtpEnv(name) {
  const v = process.env[name];
  return typeof v === "string" ? v.trim() : "";
}

function isSmtpConfigured() {
  const user = smtpEnv("SMTP_USER");
  const pass = smtpEnv("SMTP_PASS");
  if (!user || !pass) return false;
  return Boolean(smtpEnv("SMTP_HOST") || smtpEnv("SMTP_SERVICE"));
}

function passwordResetEmailBodies(otp) {
  const subject = "Your Unified password reset code";
  const text = `Your Unified password reset code is: ${otp}\n\nThis code expires in 15 minutes. If you did not request this, you can ignore this email.`;
  const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;">
<p>You asked to reset your Unified password.</p>
<p style="font-size:1.25rem;font-weight:700;letter-spacing:0.2em;">${otp}</p>
<p>Enter this 6-digit code in the app. It expires in <strong>15 minutes</strong>.</p>
<p style="color:#666;font-size:0.875rem;">If you did not request this, you can ignore this email.</p>
</body></html>`;
  return { subject, text, html };
}

function isResendConfigured() {
  return Boolean(smtpEnv("RESEND_API_KEY"));
}

/**
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @param {string} html
 */
async function sendViaResend(to, subject, text, html) {
  const key = smtpEnv("RESEND_API_KEY");
  const from = smtpEnv("EMAIL_FROM") || "Unified <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, text, html }),
  });
  const raw = await res.text();
  let json;
  try {
    json = JSON.parse(raw);
  } catch {
    json = { message: raw };
  }
  if (!res.ok) {
    const msg =
      json?.message ||
      (Array.isArray(json?.message) ? json.message.join(", ") : null) ||
      json?.error?.message ||
      raw ||
      res.statusText;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  // eslint-disable-next-line no-console
  console.log("[mail] Resend accepted", JSON.stringify({ to, id: json?.id }));
  return json;
}

function createTransporter() {
  if (!isSmtpConfigured()) return null;

  const user = smtpEnv("SMTP_USER");
  let pass = smtpEnv("SMTP_PASS");
  const service = smtpEnv("SMTP_SERVICE");
  if (service) {
    if (service.toLowerCase() === "gmail") {
      pass = pass.replace(/\s/g, "");
    }
    return nodemailer.createTransport({
      service,
      auth: { user, pass },
    });
  }

  const host = smtpEnv("SMTP_HOST");
  const port = Number(smtpEnv("SMTP_PORT") || 587);
  const secure = smtpEnv("SMTP_SECURE") === "true" || port === 465;
  const requireTLS =
    smtpEnv("SMTP_REQUIRE_TLS") !== "false" && port !== 465 && !secure;
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    ...(requireTLS ? { requireTLS: true } : {}),
  });
}

/**
 * @param {string} to
 * @param {string} otp
 * @returns {Promise<{ ok: boolean, devLogged?: boolean, error?: string }>}
 */
async function sendPasswordResetOtp(to, otp) {
  const { subject, text, html } = passwordResetEmailBodies(otp);

  if (isResendConfigured()) {
    try {
      await sendViaResend(to, subject, text, html);
      return { ok: true };
    } catch (err) {
      const msg = err?.message || String(err);
      // eslint-disable-next-line no-console
      console.error("[mail] Resend send failed:", msg);
      return { ok: false, error: msg };
    }
  }

  const transporter = createTransporter();
  if (transporter) {
    const from =
      smtpEnv("EMAIL_FROM") || smtpEnv("SMTP_USER") || "noreply@localhost";
    try {
      const info = await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
      });
      // eslint-disable-next-line no-console
      console.log(
        "[mail] Password reset sent",
        JSON.stringify({
          to,
          messageId: info.messageId,
          accepted: info.accepted,
        }),
      );
      return { ok: true };
    } catch (err) {
      const msg = err?.message || String(err);
      // eslint-disable-next-line no-console
      console.error(
        "[mail] Password reset send failed:",
        msg,
        err?.response || "",
      );
      return { ok: false, error: msg };
    }
  }

  // eslint-disable-next-line no-console
  console.log(`[dev] Password reset OTP for ${to}: ${otp}`);
  // eslint-disable-next-line no-console
  console.log(
    "[dev] No RESEND_API_KEY or SMTP in server/.env — code only prints here. Add one of them to send real email.",
  );
  return { ok: true, devLogged: true };
}

function logMailConfigOnStartup() {
  if (isResendConfigured()) {
    // eslint-disable-next-line no-console
    console.log("[mail] Resend enabled (password reset via API)");
  } else if (isSmtpConfigured()) {
    const svc = smtpEnv("SMTP_SERVICE");
    // eslint-disable-next-line no-console
    console.log(
      svc
        ? `[mail] SMTP enabled: service=${svc}`
        : `[mail] SMTP enabled: host=${smtpEnv("SMTP_HOST")} port=${smtpEnv("SMTP_PORT") || 587}`,
    );
  } else {
    // eslint-disable-next-line no-console
    console.log(
      "[mail] Dev: reset codes only in this terminal unless you set RESEND_API_KEY or SMTP_*",
    );
  }
}

module.exports = {
  sendPasswordResetOtp,
  isSmtpConfigured,
  logMailConfigOnStartup,
};
