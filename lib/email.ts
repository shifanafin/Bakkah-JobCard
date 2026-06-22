import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "Bakkah Auto <mohammed>";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "";

interface QuotationEmailParams {
  to: string;
  customerName: string;
  jobNumber: string;
  quotationNumber: string;
  items: Array<{
    item_type: string;
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  subtotal: number;
  discount: number;
  vat_amount: number;
  total: number;
  validDays?: number;
  notes?: string;
}

export async function sendQuotationEmail(params: QuotationEmailParams) {
  const {
    to,
    customerName,
    jobNumber,
    quotationNumber,
    items,
    subtotal,
    discount,
    vat_amount,
    total,
    validDays,
    notes,
  } = params;

  const trackUrl = `${BASE_URL}/track?q=${encodeURIComponent(jobNumber)}`;

  const formatAED = (n: number) =>
    `AED ${n.toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const itemRows = items
    .map(
      (item) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">
        <span style="font-size:11px;color:#888;text-transform:uppercase;">${item.item_type}</span><br/>
        <span style="font-size:14px;color:#1a1a1a;">${item.description}</span>
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center;font-size:14px;color:#555;">${item.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-size:14px;color:#555;">${formatAED(item.unit_price)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-size:14px;font-weight:600;color:#1a1a1a;">${formatAED(item.total_price)}</td>
    </tr>
  `,
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#566020,#6b7a28);padding:32px 36px;text-align:center;">
            <div style="width:64px;height:64px;border-radius:50%;background:#C9A845;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:900;color:#566020;line-height:64px;">B</div>
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:0.5px;">Bakkah Premium Auto Care</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">Al Qusais, Dubai — UAE</p>
          </td>
        </tr>

        <!-- Greeting -->
        <tr>
          <td style="padding:32px 36px 20px;">
            <p style="margin:0 0 8px;font-size:16px;color:#1a1a1a;">Dear <strong>${customerName}</strong>,</p>
            <p style="margin:0;font-size:14px;color:#555;line-height:1.6;">
              We have prepared a quotation for your vehicle. Please review the details below and approve or decline at your convenience.
            </p>
            ${validDays ? `<p style="margin:12px 0 0;font-size:13px;color:#888;">This quotation is valid for <strong>${validDays} days</strong>.</p>` : ""}
          </td>
        </tr>

        <!-- Quotation info strip -->
        <tr>
          <td style="padding:0 36px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8f8;border-radius:8px;overflow:hidden;">
              <tr>
                <td style="padding:14px 20px;">
                  <span style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Job Number</span><br/>
                  <span style="font-size:16px;font-weight:700;color:#1a1a1a;font-family:monospace;">${jobNumber}</span>
                </td>
                <td style="padding:14px 20px;border-left:1px solid #eee;">
                  <span style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Quotation</span><br/>
                  <span style="font-size:16px;font-weight:700;color:#566020;font-family:monospace;">${quotationNumber}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Items table -->
        <tr>
          <td style="padding:0 36px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0f0f0;border-radius:8px;overflow:hidden;">
              <thead>
                <tr style="background:#f8f8f8;">
                  <th style="padding:10px 12px;text-align:left;font-size:11px;color:#888;text-transform:uppercase;font-weight:600;">Description</th>
                  <th style="padding:10px 12px;text-align:center;font-size:11px;color:#888;text-transform:uppercase;font-weight:600;">Qty</th>
                  <th style="padding:10px 12px;text-align:right;font-size:11px;color:#888;text-transform:uppercase;font-weight:600;">Unit Price</th>
                  <th style="padding:10px 12px;text-align:right;font-size:11px;color:#888;text-transform:uppercase;font-weight:600;">Total</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>
          </td>
        </tr>

        <!-- Totals -->
        <tr>
          <td style="padding:0 36px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              ${
                discount > 0
                  ? `
              <tr>
                <td style="padding:4px 0;font-size:14px;color:#555;">Subtotal</td>
                <td style="padding:4px 0;text-align:right;font-size:14px;color:#555;">${formatAED(subtotal)}</td>
              </tr>
              <tr>
                <td style="padding:4px 0;font-size:14px;color:#e05a2b;">Discount</td>
                <td style="padding:4px 0;text-align:right;font-size:14px;color:#e05a2b;">−${formatAED(discount)}</td>
              </tr>
              `
                  : ""
              }
              <tr>
                <td style="padding:4px 0;font-size:14px;color:#555;">VAT (5%)</td>
                <td style="padding:4px 0;text-align:right;font-size:14px;color:#555;">${formatAED(vat_amount)}</td>
              </tr>
              <tr>
                <td style="padding:10px 0 0;font-size:17px;font-weight:700;color:#1a1a1a;border-top:2px solid #f0f0f0;">Total (incl. VAT)</td>
                <td style="padding:10px 0 0;text-align:right;font-size:17px;font-weight:700;color:#566020;border-top:2px solid #f0f0f0;">${formatAED(total)}</td>
              </tr>
            </table>
          </td>
        </tr>

        ${
          notes
            ? `
        <!-- Notes -->
        <tr>
          <td style="padding:0 36px 24px;">
            <div style="background:#fffbea;border:1px solid #f0d060;border-radius:8px;padding:14px 16px;">
              <p style="margin:0 0 4px;font-size:11px;color:#888;text-transform:uppercase;font-weight:600;">Notes from Workshop</p>
              <p style="margin:0;font-size:14px;color:#555;line-height:1.5;">${notes}</p>
            </div>
          </td>
        </tr>
        `
            : ""
        }

        <!-- CTA buttons -->
        <tr>
          <td style="padding:0 36px 36px;text-align:center;">
            <a href="${trackUrl}" style="display:inline-block;background:#566020;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;margin-right:12px;">View &amp; Approve Online</a>
            <p style="margin:16px 0 0;font-size:12px;color:#aaa;">Or visit: <a href="${trackUrl}" style="color:#566020;">${trackUrl}</a></p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8f8f8;padding:20px 36px;text-align:center;border-top:1px solid #f0f0f0;">
            <p style="margin:0;font-size:12px;color:#aaa;">Bakkah Premium Auto Care · Al Qusais, Dubai, UAE</p>
            <p style="margin:4px 0 0;font-size:11px;color:#ccc;">This is an automated message. Please do not reply to this email.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
  `;

  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `Quotation ${quotationNumber} — Bakkah Premium Auto Care`,
    html,
  });

  if (error) throw new Error(`Email failed: ${error.message}`);
  return data;
}

// ── Status update email ───────────────────────────────────────────────────────

interface StatusUpdateEmailParams {
  to: string;
  customerName: string;
  jobNumber: string;
  jobId: string;
  vehiclePlate: string;
  vehicleName: string;
  statusLabel: string;
  message?: string;
}

export async function sendStatusUpdateEmail(params: StatusUpdateEmailParams) {
  const { to, customerName, jobNumber, jobId, vehiclePlate, vehicleName, statusLabel, message } = params;
  const trackUrl = `${BASE_URL}/track?q=${encodeURIComponent(jobNumber)}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#566020,#6b7a28);padding:28px 36px;text-align:center;">
            <div style="width:56px;height:56px;border-radius:50%;background:#C9A845;margin:0 auto 12px;font-size:26px;font-weight:900;color:#566020;line-height:56px;">B</div>
            <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">Bakkah Premium Auto Care</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:12px;">Al Qusais, Dubai — UAE</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 36px 24px;">
            <p style="margin:0 0 12px;font-size:16px;color:#1a1a1a;">Dear <strong>${customerName}</strong>,</p>
            <p style="margin:0 0 20px;font-size:14px;color:#555;line-height:1.7;">
              Your vehicle <strong>${vehicleName}</strong> (<span style="font-family:monospace;">${vehiclePlate}</span>) — Job <span style="font-family:monospace;font-weight:700;color:#566020;">${jobNumber}</span> — status has been updated.
            </p>
            <div style="background:#f0f4e0;border:1px solid #c9d470;border-radius:10px;padding:16px 20px;text-align:center;margin-bottom:20px;">
              <p style="margin:0 0 4px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Current Status</p>
              <p style="margin:0;font-size:20px;font-weight:800;color:#566020;">${statusLabel}</p>
            </div>
            ${message ? `<p style="margin:0 0 20px;font-size:14px;color:#555;line-height:1.6;background:#fffbea;border:1px solid #f0d060;border-radius:8px;padding:12px 16px;">${message}</p>` : ""}
            <div style="text-align:center;">
              <a href="${trackUrl}" style="display:inline-block;background:#566020;color:#fff;text-decoration:none;padding:13px 28px;border-radius:8px;font-size:14px;font-weight:600;">Track Your Vehicle</a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#f8f8f8;padding:16px 36px;text-align:center;border-top:1px solid #f0f0f0;">
            <p style="margin:0;font-size:11px;color:#aaa;">Bakkah Premium Auto Care · Al Qusais, Dubai, UAE · +971 54 588 6999</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `Job ${jobNumber} — ${statusLabel} | Bakkah Auto`,
    html,
  });
  if (error) throw new Error(`Email failed: ${error.message}`);
  return data;
}
