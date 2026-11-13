/**
 * R1 — Điều khoản sử dụng và Chính sách dữ liệu cá nhân (bản TERMS_VERSION).
 * Nội dung mô tả đúng cách hệ thống đang chạy; đổi nội dung thì đổi TERMS_VERSION để người dùng đồng ý lại.
 */
import React from 'react';
import { TERMS_VERSION } from '../server/accounts/rules.ts';

const viDate = (d: string) => d.split('-').reverse().join('/');

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="space-y-2">
    <h2 className="text-lg font-black text-brand-800">{title}</h2>
    <div className="space-y-2 text-sm leading-relaxed text-slate-800">{children}</div>
  </section>
);

const Terms: React.FC = () => (
  <>
    <Section title="1. Tà Xùa Trip là gì">
      <p>Tà Xùa Trip (đơn vị vận hành: Tà Xùa Trip) là nền tảng giúp khách tìm thông tin, lên kế hoạch và đặt dịch vụ của các cơ sở tại Tà Xùa. Hợp đồng lưu trú hoặc dịch vụ là giữa khách và cơ sở; Tà Xùa Trip kết nối, ghi nhận đơn và hỗ trợ khi có khiếu nại.</p>
    </Section>
    <Section title="2. Tài khoản">
      <ul className="list-disc pl-5 space-y-1">
        <li>Mỗi người dùng một tài khoản, đăng ký bằng email thật. Bạn giữ bí mật mật khẩu và chịu trách nhiệm với thao tác trên tài khoản của mình.</li>
        <li>Đăng nhập sai nhiều lần liên tiếp, tài khoản bị khóa tạm 15 phút. Bạn có thể xem và đăng xuất các thiết bị trong mục Tài khoản của tôi.</li>
        <li>Tà Xùa Trip có thể khóa tài khoản vi phạm điều khoản (gian lận, đánh giá giả, quấy rối). Khi bị khóa, mọi phiên đăng nhập hết hiệu lực; bạn liên hệ Tà Xùa Trip để được xem xét.</li>
      </ul>
    </Section>
    <Section title="3. Đặt chỗ và thanh toán">
      <ul className="list-disc pl-5 space-y-1">
        <li>Giá do máy chủ tính theo từng đêm tại thời điểm đặt. Giữ chỗ chờ cọc có hạn; hết hạn thì phòng được nhả.</li>
        <li>Tiền cọc 30% chuyển thẳng vào tài khoản của cơ sở; Tà Xùa Trip không giữ tiền của khách. Đơn chỉ tính là đã cọc khi cơ sở xác nhận đã nhận.</li>
        <li>Phần 70% còn lại trả cho cơ sở trước giờ nhận phòng 24 giờ. Quá hạn chưa trả đủ, cơ sở được nhả phòng và tiền cọc không hoàn.</li>
        <li>Khách hủy đơn: không hoàn tiền cọc. Điều khoản này hiện rõ và khách phải đồng ý trước khi thấy thông tin chuyển khoản.</li>
      </ul>
    </Section>
    <Section title="4. Đánh giá và Điểm Mây">
      <ul className="list-disc pl-5 space-y-1">
        <li>Chỉ khách của đơn đã hoàn tất được đánh giá, mỗi đơn một lần, trong 30 ngày. Đánh giá phải đúng trải nghiệm thật; nội dung quảng cáo, xúc phạm hoặc sai sự thật có thể bị ẩn.</li>
        <li>Điểm Mây ghi nhận đóng góp cho cộng đồng, không quy đổi ra tiền. Điểm của nội dung bị ẩn sẽ được thu hồi.</li>
      </ul>
    </Section>
    <Section title="5. Khiếu nại">
      <p>Khách mở khiếu nại từ khi cơ sở xác nhận cọc đến 7 ngày sau ngày trả phòng, kèm ảnh bằng chứng. Tà Xùa Trip xem bằng chứng hai bên và ghi kết luận. Nếu kết luận cần hoàn tiền, cơ sở hoàn trực tiếp cho khách và khách xác nhận đã nhận.</p>
    </Section>
    <Section title="6. Đối tác (chủ cơ sở)">
      <p>Đối tác cung cấp thông tin cơ sở đúng sự thật, cập nhật phòng trống và giá, xác nhận tiền đúng thực tế. Tà Xùa Trip liên hệ để xác minh trước khi mở đặt chỗ cho cơ sở. Mức phí nền tảng do hai bên thỏa thuận riêng.</p>
    </Section>
    <Section title="7. Thay đổi điều khoản">
      <p>Khi điều khoản thay đổi, ngày phiên bản ở đầu trang được cập nhật và bạn sẽ được đề nghị đọc và đồng ý lại.</p>
    </Section>
  </>
);

const Privacy: React.FC = () => (
  <>
    <Section title="1. Dữ liệu chúng tôi lưu">
      <ul className="list-disc pl-5 space-y-1">
        <li>Tài khoản: họ tên, email, số điện thoại, mật khẩu (chỉ lưu dạng mã hóa một chiều, không ai đọc được), vai trò, thời điểm đồng ý điều khoản.</li>
        <li>Đăng nhập: loại thiết bị và trình duyệt, thời điểm đăng nhập và dùng gần nhất, để bạn xem và đăng xuất thiết bị lạ.</li>
        <li>Đặt chỗ: thông tin đơn, người lưu trú, ảnh biên lai chuyển khoản; khiếu nại và ảnh bằng chứng; đánh giá và ảnh bạn đăng; Điểm Mây.</li>
        <li>Đối tác: tên cơ sở, số điện thoại, tài khoản nhận cọc.</li>
      </ul>
    </Section>
    <Section title="2. Mục đích sử dụng">
      <ul className="list-disc pl-5 space-y-1">
        <li>Tạo và bảo vệ tài khoản; gửi mã xác minh và mã đặt lại mật khẩu qua email.</li>
        <li>Thực hiện đơn: cơ sở bạn đặt nhận họ tên, số điện thoại và thông tin đơn để phục vụ bạn.</li>
        <li>Xử lý khiếu nại, đối soát tiền cọc, chống gian lận và lạm dụng.</li>
      </ul>
      <p>Chúng tôi không bán dữ liệu cá nhân và không dùng dữ liệu của bạn cho quảng cáo của bên thứ ba.</p>
    </Section>
    <Section title="3. Nơi lưu và ai được xem">
      <p>Dữ liệu lưu trên hạ tầng Cloudflare (cơ sở dữ liệu D1 và kho tệp R2). Ảnh biên lai và bằng chứng lưu ở kho riêng, chỉ khách, cơ sở của đơn và quản trị viên Tà Xùa Trip xem được qua tài khoản. Cloudflare Turnstile được dùng để chống bot khi đăng ký và đăng nhập. Mọi thao tác của quản trị viên trên dữ liệu được ghi nhật ký.</p>
    </Section>
    <Section title="4. Thời gian lưu">
      <p>Dữ liệu tài khoản lưu đến khi bạn yêu cầu xóa. Thông tin đơn, biên lai và bằng chứng khiếu nại được giữ để đối chiếu khi có tranh chấp và theo yêu cầu của pháp luật.</p>
    </Section>
    <Section title="5. Quyền của bạn">
      <p>Bạn xem và sửa thông tin trong mục Tài khoản của tôi. Bạn có quyền yêu cầu cung cấp bản sao, chỉnh sửa hoặc xóa dữ liệu cá nhân, và rút lại sự đồng ý, theo quy định pháp luật Việt Nam về bảo vệ dữ liệu cá nhân. Gửi yêu cầu qua mục Liên hệ trên website; chúng tôi phản hồi trong thời hạn luật định.</p>
    </Section>
  </>
);

export const LegalPage: React.FC<{ kind: 'terms' | 'privacy' }> = ({ kind }) => (
  <main className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-6 bg-white">
    <header className="space-y-1">
      <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{kind === 'terms' ? 'Điều khoản sử dụng' : 'Chính sách dữ liệu cá nhân'}</h1>
      <p className="text-sm text-slate-600">Phiên bản ngày {viDate(TERMS_VERSION)} · Đơn vị vận hành: Tà Xùa Trip</p>
    </header>
    {kind === 'terms' ? <Terms /> : <Privacy />}
    <p className="text-sm text-slate-600">
      Xem thêm: {kind === 'terms' ? <a href="/chinh-sach-du-lieu" className="underline font-bold">Chính sách dữ liệu cá nhân</a> : <a href="/dieu-khoan" className="underline font-bold">Điều khoản sử dụng</a>}
    </p>
  </main>
);
