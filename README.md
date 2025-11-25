# Pickleball Booking (Demo)

Demo full-stack nhỏ gồm giao diện người chơi, quản trị và backend Node.js tối giản để nhận/gửi trạng thái đặt sân.

> Vì sao cần backend? Bản đầu tiên chỉ là static prototype để phác thảo UI và quy trình, nên không thể thật sự xác thực hay lưu đặt sân. Bản hiện tại đã bổ sung server Node để lưu file, check đăng nhập demo và gửi/nhận trạng thái qua API.

## Chạy nhanh
1. Cài Node.js 18+. Không cần cài package ngoài.
2. Chạy backend và phục vụ static:
   ```bash
   node server.js
   ```
3. Mở http://localhost:3000 (trang user) hoặc http://localhost:3000/admin (trang quản trị).

## Tài khoản mẫu
- Người chơi: `user@pickle.com` / `play123`
- Admin: `admin@pickle.com` / `verify123`

## Quy trình
1. Người chơi đăng nhập, nhập lịch, thông tin chuyển khoản và gửi lên API `/api/bookings`.
2. Backend lưu vào file `data/bookings.json` và trả trạng thái mới nhất cho trang người chơi.
3. Admin đăng nhập, tải danh sách qua API và bấm **Xác nhận** hoặc **Từ chối / cần bổ sung** để đổi trạng thái.
