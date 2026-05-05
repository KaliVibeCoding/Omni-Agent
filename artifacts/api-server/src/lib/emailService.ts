/**
 * Email service using Resend for transactional emails.
 * Falls back to console logging in development if RESEND_API_KEY is not set.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = "RJ Business Solutions <noreply@rjbusinesssolutions.org>";
const SUPPORT_EMAIL = "support@rjbusinesssolutions.org";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(payload: EmailPayload): Promise<void> {
  if (!RESEND_API_KEY) {
    console.log("[EmailService] RESEND_API_KEY not set — logging email instead:");
    console.log(`  TO: ${payload.to}`);
    console.log(`  SUBJECT: ${payload.subject}`);
    return;
  }

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    console.error("[EmailService] Failed to send email:", err);
  }
}

const BASE_HTML = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { margin: 0; padding: 0; background: #0f1623; font-family: 'Segoe UI', Arial, sans-serif; color: #e2e8f0; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { background: linear-gradient(135deg, #1a2332, #0f1623); border: 1px solid #1e2d42; border-radius: 12px 12px 0 0; padding: 32px; text-align: center; }
    .logo-badge { display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 10px; background: hsl(348,83%,47%); color: white; font-size: 18px; font-weight: 900; margin-bottom: 16px; }
    .brand { font-size: 20px; font-weight: 700; color: #f1f5f9; }
    .body { background: #131e2e; border: 1px solid #1e2d42; border-top: 0; padding: 32px; }
    .footer { background: #0f1623; border: 1px solid #1e2d42; border-top: 0; border-radius: 0 0 12px 12px; padding: 20px 32px; text-align: center; font-size: 12px; color: #64748b; }
    h1 { font-size: 24px; font-weight: 700; color: #f1f5f9; margin: 0 0 8px 0; }
    p { font-size: 15px; line-height: 1.6; color: #94a3b8; margin: 0 0 16px 0; }
    .highlight { color: #f1f5f9; font-weight: 600; }
    .plan-box { background: #1a2332; border: 1px solid #1e2d42; border-left: 3px solid hsl(348,83%,47%); border-radius: 8px; padding: 20px; margin: 20px 0; }
    .plan-name { font-size: 18px; font-weight: 700; color: hsl(348,83%,60%); }
    .plan-price { font-size: 28px; font-weight: 900; color: #f1f5f9; }
    .feature-list { list-style: none; padding: 0; margin: 16px 0 0 0; }
    .feature-list li { padding: 6px 0; color: #94a3b8; font-size: 14px; }
    .feature-list li::before { content: "✓ "; color: hsl(348,83%,60%); font-weight: 700; }
    .btn { display: inline-block; padding: 14px 28px; background: hsl(348,83%,47%); color: white !important; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; margin: 8px 4px; }
    .btn-outline { display: inline-block; padding: 12px 24px; border: 1px solid #334155; color: #94a3b8 !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 8px 4px; }
    .divider { border: 0; border-top: 1px solid #1e2d42; margin: 24px 0; }
    .tag { display: inline-block; padding: 3px 8px; background: rgba(220,38,38,0.15); color: hsl(348,83%,60%); border-radius: 4px; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; margin-right: 6px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo-badge">RJ</div>
      <div class="brand">RJ Business Solutions</div>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p style="margin:0 0 8px 0;">© 2026 RJ Business Solutions · HIPAA Compliant · Powered by Twilio</p>
      <p style="margin:0;">Questions? <a href="mailto:${SUPPORT_EMAIL}" style="color:hsl(348,83%,60%);">${SUPPORT_EMAIL}</a></p>
    </div>
  </div>
</body>
</html>
`;

const PLAN_FEATURES: Record<string, string[]> = {
  starter: ["Up to 1,000 SMS/month", "Basic call center", "Email campaigns", "Phone number management"],
  growth: ["Up to 10,000 SMS/month", "Advanced call center", "AI voice agents", "Multi-channel campaigns", "Telehealth module"],
  business: ["Unlimited SMS", "Multi-agent AGI framework", "Full call center suite", "Priority support", "Custom integrations", "White-label options"],
  enterprise: ["Everything in Business", "Dedicated infrastructure", "SLA guarantees", "Custom contracts", "24/7 dedicated support"],
};

export async function sendWelcomeEmail(opts: {
  to: string;
  name: string;
  planName: string;
  planPrice: string;
  dashboardUrl: string;
}): Promise<void> {
  const planKey = opts.planName.toLowerCase().replace(/\s+/g, "");
  const features = PLAN_FEATURES[planKey] || PLAN_FEATURES.starter;

  const html = BASE_HTML(`
    <h1>Welcome to RJ Business Solutions! 🎉</h1>
    <p>Hi <span class="highlight">${opts.name || "there"}</span>,</p>
    <p>Your subscription is now <strong style="color:#22c55e;">active</strong>. You're all set to unlock the full power of your communications platform.</p>

    <div class="plan-box">
      <div class="plan-name">${opts.planName} Plan</div>
      <div class="plan-price">${opts.planPrice}<span style="font-size:16px;font-weight:400;color:#64748b;">/mo</span></div>
      <ul class="feature-list">
        ${features.map((f) => `<li>${f}</li>`).join("")}
      </ul>
    </div>

    <p>Here's what to do next:</p>
    <p>
      <span class="tag">STEP 1</span>Connect your Twilio account in the dashboard<br/>
      <span class="tag" style="margin-top:8px;display:inline-block;">STEP 2</span>Set up your phone numbers<br/>
      <span class="tag" style="margin-top:8px;display:inline-block;">STEP 3</span>Start your first campaign
    </p>

    <hr class="divider" />

    <div style="text-align:center;margin-top:8px;">
      <a href="${opts.dashboardUrl}" class="btn">Go to Dashboard →</a>
      <a href="mailto:${SUPPORT_EMAIL}" class="btn-outline">Get Help</a>
    </div>
  `);

  await sendEmail({
    to: opts.to,
    subject: `Welcome to RJ Business Solutions — ${opts.planName} Plan Active`,
    html,
  });
}

export async function sendUpgradeEmail(opts: {
  to: string;
  name: string;
  oldPlan: string;
  newPlanName: string;
  newPlanPrice: string;
  dashboardUrl: string;
}): Promise<void> {
  const html = BASE_HTML(`
    <h1>Plan Upgraded Successfully</h1>
    <p>Hi <span class="highlight">${opts.name || "there"}</span>,</p>
    <p>Your plan has been upgraded from <span class="highlight">${opts.oldPlan}</span> to <span class="highlight">${opts.newPlanName}</span>. Your new features are available immediately.</p>

    <div class="plan-box">
      <div class="plan-name">${opts.newPlanName} Plan</div>
      <div class="plan-price">${opts.newPlanPrice}<span style="font-size:16px;font-weight:400;color:#64748b;">/mo</span></div>
    </div>

    <p>All your data and settings carry over — nothing to reconfigure.</p>
    <hr class="divider" />
    <div style="text-align:center;">
      <a href="${opts.dashboardUrl}" class="btn">Explore New Features →</a>
    </div>
  `);

  await sendEmail({
    to: opts.to,
    subject: `Plan Upgraded to ${opts.newPlanName} — RJ Business Solutions`,
    html,
  });
}

export async function sendCancellationEmail(opts: {
  to: string;
  name: string;
  planName: string;
  endDate: string;
  dashboardUrl: string;
}): Promise<void> {
  const html = BASE_HTML(`
    <h1>Subscription Cancellation Confirmed</h1>
    <p>Hi <span class="highlight">${opts.name || "there"}</span>,</p>
    <p>Your <span class="highlight">${opts.planName}</span> subscription has been cancelled. You'll continue to have access to all features until <span class="highlight">${opts.endDate}</span>.</p>

    <div class="plan-box" style="border-left-color:#f59e0b;">
      <p style="margin:0;color:#f59e0b;font-weight:700;">Access continues until ${opts.endDate}</p>
      <p style="margin:8px 0 0 0;font-size:13px;">After this date your account will revert to read-only mode.</p>
    </div>

    <p>Changed your mind? Reactivate anytime before your access ends — no setup fee, no hassle.</p>

    <hr class="divider" />
    <div style="text-align:center;">
      <a href="${opts.dashboardUrl}/billing" class="btn">Reactivate Subscription</a>
      <a href="mailto:${SUPPORT_EMAIL}" class="btn-outline">Give Feedback</a>
    </div>
  `);

  await sendEmail({
    to: opts.to,
    subject: `Subscription Cancelled — Access Until ${opts.endDate}`,
    html,
  });
}

export async function sendPaymentFailedEmail(opts: {
  to: string;
  name: string;
  planName: string;
  amount: string;
  dashboardUrl: string;
}): Promise<void> {
  const html = BASE_HTML(`
    <h1>Payment Failed</h1>
    <p>Hi <span class="highlight">${opts.name || "there"}</span>,</p>
    <p>We were unable to process your payment of <span class="highlight">${opts.amount}</span> for your <span class="highlight">${opts.planName}</span> subscription.</p>

    <div class="plan-box" style="border-left-color:#ef4444;">
      <p style="margin:0;color:#ef4444;font-weight:700;">Action Required</p>
      <p style="margin:8px 0 0 0;font-size:13px;">Please update your payment method to avoid service interruption. We'll retry automatically over the next few days.</p>
    </div>

    <hr class="divider" />
    <div style="text-align:center;">
      <a href="${opts.dashboardUrl}/billing" class="btn">Update Payment Method →</a>
    </div>
  `);

  await sendEmail({
    to: opts.to,
    subject: `Payment Failed — Action Required`,
    html,
  });
}

export async function sendReceiptEmail(opts: {
  to: string;
  name: string;
  planName: string;
  amount: string;
  invoiceUrl?: string;
  date: string;
}): Promise<void> {
  const html = BASE_HTML(`
    <h1>Payment Receipt</h1>
    <p>Hi <span class="highlight">${opts.name || "there"}</span>,</p>
    <p>Thank you for your payment. Here's your receipt.</p>

    <div class="plan-box">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div class="plan-name">${opts.planName} Plan</div>
          <div style="font-size:13px;color:#64748b;">${opts.date}</div>
        </div>
        <div class="plan-price">${opts.amount}</div>
      </div>
    </div>

    ${opts.invoiceUrl ? `<div style="text-align:center;margin-top:24px;"><a href="${opts.invoiceUrl}" class="btn">View Full Invoice →</a></div>` : ""}
  `);

  await sendEmail({
    to: opts.to,
    subject: `Receipt — ${opts.planName} Plan — ${opts.amount}`,
    html,
  });
}
