# TechTonic Heritage Room 3D

Không gian bảo tàng 3D tương tác Phòng Truyền Thống TechTonic Club, xây dựng bằng React, TypeScript, Three.js (`@react-three/fiber`, `@react-three/drei`), vật lý `@react-three/rapier`, Zustand, Tailwind CSS và Vercel Serverless Functions.

## Tính năng chính
- **Không gian 3D FPS & Vật lý Rapier:** Di chuyển bằng `W A S D` / phím mũi tên, `Shift` chạy nhanh, `Space` nhảy, xoay góc nhìn 360° bằng chuột (`PointerLockControls`), tương tác vật phẩm bằng chuột trái hoặc phím `E`.
- **Điều hướng nhanh & Trợ năng:** Thanh dịch chuyển nhanh tới 6 khu vực trưng bày, chỉ báo vị trí hiện tại theo thời gian thực, điều chỉnh độ nhạy chuột và phím tắt `H` mở bảng bản đồ/cài đặt.
- **5 Khu vực trưng bày tương tác:** Hành lang lối vào, Vách tâm điểm & Sứ mệnh, Đảo vinh danh 360° (4 cúp/bằng khen có điều hướng Trước/Sau), Dòng thời gian & Kỷ yếu hoạt động, Áo CLB 3D & danh sách Ban Chủ Nhiệm có tìm kiếm/lọc theo nhiệm kỳ & ban, Góc màn hình LED & Sổ lưu bút điện tử.
- **Backend API (`/api/*`) & Lưu trữ bền vững:**
  - `GET /api/health` — Kiểm tra trạng thái API và chế độ lưu trữ.
  - `GET /api/heritage` — Cung cấp dữ liệu Ban Chủ Nhiệm, hiện vật, dòng thời gian và hoạt động.
  - `GET / POST /api/guestbook` — Đọc và ghi lời chúc với kiểm tra hợp lệ phía server, giới hạn tần suất (rate-limit), hỗ trợ Upstash/Vercel KV (`KV_REST_API_URL` + `KV_REST_API_TOKEN`) trên Vercel, file `.data/guestbook.json` khi chạy local dev, và tự động fallback sang `localStorage` khi offline.

## Chạy ở máy local

```bash
npm install
npm run dev
```

Mở trình duyệt máy tính tại `http://localhost:3000`.

## Kiểm tra & Build Production

```bash
npm run build
npm run preview
```

## Cấu hình biến môi trường khi deploy Vercel (tùy chọn để lưu Sổ lưu bút lâu dài)
- `KV_REST_API_URL` (hoặc `UPSTASH_REDIS_REST_URL`)
- `KV_REST_API_TOKEN` (hoặc `UPSTASH_REDIS_REST_TOKEN`)
