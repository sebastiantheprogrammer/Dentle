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
    ? details.differentials.map((item) => `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #d7e4df;">
            <span style="display: inline-block; width: 8px; height: 8px; margin-right: 10px; border-radius: 999px; background: #078978;"></span>
            <span style="color: #10211f; font-size: 15px; font-weight: 700;">${escapeHtml(item)}</span>
          </td>
        </tr>
      `).join("")
    : `
        <tr>
          <td style="padding: 10px 0; color: #596864; font-size: 15px;">No differentials listed.</td>
        </tr>
      `;

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
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Story+Script&display=swap');
        </style>
        <div style="margin: 0; padding: 0; background: #f7f5ef;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f7f5ef; margin: 0; padding: 28px 12px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width: 100%; max-width: 640px; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 0 0 18px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="vertical-align: middle;">
                            <table role="presentation" cellspacing="0" cellpadding="0">
                              <tr>
                                <td style="width: 48px; height: 48px; border-radius: 14px; background: #078978; color: #ffffff; text-align: center; font-size: 28px; font-weight: 900; line-height: 48px;">D</td>
                                <td style="padding-left: 12px; color: #10211f; font-family: 'Story Script', Arial, Helvetica, sans-serif; font-size: 30px; font-weight: 900; letter-spacing: 0;">Dentle</td>
                              </tr>
                            </table>
                          </td>
                          <td align="right" style="vertical-align: middle; color: #596864; font-family: 'Story Script', Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 700;">Daily diagnosis case</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #d7e4df; border-radius: 18px; background: #fffefa; overflow: hidden;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="padding: 34px 30px 26px; font-family: 'Story Script', Arial, Helvetica, sans-serif;">
                            <p style="margin: 0 0 10px; color: #078978; font-size: 13px; font-weight: 900; letter-spacing: 0.14em; text-transform: uppercase;">Dentle.org</p>
                            <h1 style="margin: 0; color: #10211f; font-family: 'Story Script', Arial, Helvetica, sans-serif; font-size: 36px; line-height: 1.05; font-weight: 900; letter-spacing: 0;">${escapeHtml(details.caseTitle)}</h1>
                            <p style="margin: 18px 0 0; color: #596864; font-size: 18px; line-height: 1.5;">Here is the full clinical explanation from today&apos;s case.</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 0 30px 30px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: separate; border-spacing: 0; font-family: Arial, Helvetica, sans-serif;">
                              <tr>
                                <td style="padding: 22px; border: 1px solid #d7e4df; border-radius: 14px; background: #f8fbfa;">
                                  <p style="margin: 0 0 8px; color: #078978; font-size: 12px; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase;">The case</p>
                                  <p style="margin: 0; color: #10211f; font-size: 18px; line-height: 1.55; font-weight: 700;">${escapeHtml(details.prompt)}</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 0 30px 30px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-family: Arial, Helvetica, sans-serif;">
                              <tr>
                                <td style="padding: 22px; border-radius: 14px; background: #078978;">
                                  <p style="margin: 0 0 8px; color: #dff5ef; font-size: 12px; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase;">Correct diagnosis</p>
                                  <p style="margin: 0; color: #ffffff; font-size: 28px; line-height: 1.15; font-weight: 900;">${escapeHtml(details.answer)}</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 0 30px 30px; font-family: Arial, Helvetica, sans-serif;">
                            <h2 style="margin: 0 0 10px; color: #10211f; font-size: 22px; line-height: 1.2; font-weight: 900;">Why it fits</h2>
                            <p style="margin: 0; color: #596864; font-size: 17px; line-height: 1.65;">${escapeHtml(details.explanation)}</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 0 30px 34px; font-family: Arial, Helvetica, sans-serif;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding: 18px 22px; border: 1px solid #d7e4df; border-radius: 14px; background: #fffefa;">
                              <tr>
                                <td>
                                  <h2 style="margin: 0 0 8px; color: #10211f; font-size: 20px; font-weight: 900;">Differentials to rule out</h2>
                                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                    ${differentials}
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 0 30px 34px; font-family: Arial, Helvetica, sans-serif;">
                            <a href="https://dentle.sebrium.com" style="display: block; padding: 17px 22px; border-radius: 14px; background: #078978; color: #ffffff; font-size: 18px; font-weight: 900; text-align: center; text-decoration: none;">Play tomorrow&apos;s Dentle</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 18px 8px 0; color: #596864; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 1.5; text-align: center;">
                      You received this because you asked Dentle to email the case explanation. © 2026 Sebrium Industries
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
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
