type CaseExplanationEmail = {
  to: string;
  caseTitle: string;
  prompt: string;
  answer: string;
  explanation: string;
  differentials: string[];
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fromAddress() {
  return process.env.RESEND_FROM_EMAIL || "Dentle <dentle@updates.sebrium.com>";
}

export function resendConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendCaseExplanationEmail(details: CaseExplanationEmail) {
  if (!resendConfigured()) return { sent: false };

  const differentials = details.differentials.length
    ? details.differentials.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
    : "<li>No differentials listed.</li>";

  const text = [
    details.caseTitle,
    "",
    `Case: ${details.prompt}`,
    `Answer: ${details.answer}`,
    `Why: ${details.explanation}`,
    "",
    `Differentials: ${details.differentials.join(", ") || "No differentials listed."}`,
    "",
    "Play tomorrow's case: https://dentle.sebrium.com"
  ].join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: fromAddress(),
      to: [details.to],
      subject: `Dentle explanation: ${details.answer}`,
      text,
      html: `
        <div style="font-family: Arial, sans-serif; color: #10211f; line-height: 1.55; max-width: 640px;">
          <p style="color: #078978; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">Dentle case explanation</p>
          <h1 style="font-size: 28px; margin: 0 0 16px;">${escapeHtml(details.caseTitle)}</h1>
          <p><strong>Case:</strong> ${escapeHtml(details.prompt)}</p>
          <p><strong>Answer:</strong> ${escapeHtml(details.answer)}</p>
          <p><strong>Why it fits:</strong> ${escapeHtml(details.explanation)}</p>
          <p><strong>Differentials:</strong></p>
          <ul>${differentials}</ul>
          <p><a href="https://dentle.sebrium.com" style="color: #078978; font-weight: 700;">Play tomorrow's case</a></p>
        </div>
      `
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Resend failed: ${response.status} ${message}`);
  }

  return { sent: true };
}
