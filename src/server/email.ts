/**
 * R1 — Gửi email giao dịch. Production dùng binding `send_email` (Cloudflare Email Sending, cần Workers Paid và
 * tên miền đã bật gửi email). Chưa có binding thì `available = false`: tính năng email báo "chưa bật",
 * không giả là đã gửi. Test dùng MemoryEmailSender.
 */
export interface OutgoingEmail {
  to: string;
  subject: string;
  text: string;
  html: string;
}
export interface EmailSender {
  readonly available: boolean;
  send(msg: OutgoingEmail): Promise<{ messageId: string | null }>;
}

export class NoEmailSender implements EmailSender {
  readonly available = false;
  async send(): Promise<{ messageId: string | null }> {
    throw Object.assign(new Error('Chưa bật dịch vụ gửi email.'), { code: 'EMAIL_NOT_CONFIGURED' });
  }
}

/** Bọc binding EMAIL của Worker. `from` dạng "Tà Xùa Trip <no-reply@taxuatrip.vn>" hoặc chỉ địa chỉ. */
export class CloudflareEmailSender implements EmailSender {
  readonly available = true;
  private from: { email: string; name?: string };
  constructor(private binding: { send(m: any): Promise<any> }, from: string) {
    const m = from.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
    this.from = m ? { name: m[1] || undefined, email: m[2] } : { email: from.trim() };
  }
  async send(msg: OutgoingEmail) {
    const r = await this.binding.send({ to: msg.to, from: this.from, subject: msg.subject, text: msg.text, html: msg.html });
    return { messageId: r?.messageId ?? null };
  }
}

export class MemoryEmailSender implements EmailSender {
  readonly available = true;
  sent: OutgoingEmail[] = [];
  failNext = false;
  async send(msg: OutgoingEmail) {
    if (this.failNext) {
      this.failNext = false;
      throw Object.assign(new Error('Lỗi gửi thử'), { code: 'TEST_FAILURE' });
    }
    this.sent.push(msg);
    return { messageId: `mem_${this.sent.length}` };
  }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Email chứa mã 6 số (xác minh email hoặc đặt lại mật khẩu). */
export function codeEmail(kind: 'verify_email' | 'reset_password', name: string, code: string, minutes: number): Omit<OutgoingEmail, 'to'> {
  const what = kind === 'verify_email' ? 'xác minh email' : 'đặt lại mật khẩu';
  const subject = `Mã ${what} Tà Xùa Trip: ${code}`;
  const tail =
    kind === 'reset_password'
      ? 'Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này; mật khẩu của bạn không đổi.'
      : 'Nếu bạn không đăng ký tài khoản Tà Xùa Trip, hãy bỏ qua email này.';
  const text = `Chào ${name},\n\nMã ${what} của bạn là: ${code}\nMã có hiệu lực trong ${minutes} phút và chỉ dùng được một lần. Không chia sẻ mã này cho ai, kể cả người tự xưng là Tà Xùa Trip.\n\n${tail}\n\nTà Xùa Trip`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#0f172a;line-height:1.5">
<p>Chào ${esc(name)},</p>
<p>Mã ${what} của bạn là:</p>
<p style="font-size:28px;font-weight:bold;letter-spacing:6px;color:#04244d">${esc(code)}</p>
<p>Mã có hiệu lực trong ${minutes} phút và chỉ dùng được một lần. Không chia sẻ mã này cho ai, kể cả người tự xưng là Tà Xùa Trip.</p>
<p style="color:#475569">${tail}</p>
<p>Tà Xùa Trip</p></div>`;
  return { subject, text, html };
}
