# Meticulous Demo

Sandbox Next.js (App Router + TypeScript, pnpm) đã gắn sẵn **Meticulous recorder** và
pipeline **Docker + GitHub Actions** để thử quy trình Meticulous đầu-cuối.

- **Phase A** — ghi session ở local (recorder).
- **Phase B** — chạy test trên CI qua Docker image.

## Cấu trúc

| File | Vai trò |
|------|---------|
| `app/layout.tsx` | Gắn recorder (gated `NODE_ENV=development` + có Project ID) |
| `app/login`, `app/dashboard` | Luồng demo: form input, gọi API, thêm/xóa item |
| `app/api/items` | API giả lập (network request để Meticulous ghi & mock) |
| `app/api/health` | Health check cho container (`/api/health`) |
| `next.config.js` | Bật `output: "standalone"` cho Docker |
| `Dockerfile` | Multi-stage build pnpm → standalone runtime |
| `.github/workflows/meticulous.yaml` | CI: build image + `upload-container` |

---

## 🟢 Việc TÔI (Claude) đã làm

- [x] Scaffold toàn bộ app + 3 file cấu hình Meticulous.
- [x] `pnpm install` → sinh `pnpm-lock.yaml`.
- [x] Verify `pnpm build` ra `.next/standalone/server.js`.
- [x] Verify `node server.js` chạy, tất cả route trả `200`, `/api/health` OK.

> ⚠️ Docker daemon trên máy chưa bật nên chưa build được image local. Hãy chạy
> `docker build -t test . && docker run -p 3000:3000 -e PORT=3000 test` sau khi mở
> Docker Desktop để xác nhận lần cuối (không bắt buộc — CI vẫn build trên Ubuntu).

---

## 🔴 Việc BẠN cần làm (kèm thông tin cần cung cấp)

### Phase 0 — Tạo tài khoản
1. Đăng ký tại https://app.meticulous.ai/signup, tạo organization + project.
2. Lấy **Project ID** và **API Token** (để riêng, đừng nhầm).

> Báo lại cho tôi **Project ID** nếu muốn tôi điền sẵn, hoặc tự làm bước A1 dưới.

### Phase A — Recorder (local)
1. Copy env: `cp .env.local.example .env.local`
2. Điền `NEXT_PUBLIC_METICULOUS_PROJECT_ID=<project-id>` vào `.env.local`.
3. Chạy: `pnpm dev` → mở http://localhost:3000
4. Mở DevTools → Network, xác nhận `meticulous.js` được load, không lỗi console.
5. Bấm qua các luồng: Login (nhập email/password, submit), Dashboard (thêm/xóa item).
6. Vào Meticulous UI kiểm tra session đã xuất hiện.
7. Dùng app 2–3 ngày để tích lũy ≥ 20–30 session.

### Phase B — CI (Docker)
1. Cài Meticulous GitHub App: https://github.com/apps/alwaysmeticulous → cấp quyền repo.
2. Thêm secret repo `METICULOUS_API_TOKEN` (Settings → Secrets and variables → Actions).
3. Đảm bảo repo có branch `main` (workflow cần baseline trên main).
4. Push code → workflow chạy trên `main` tạo baseline.
5. Mở **PR mới** (sửa nhỏ UI) để test thật.
   - ⚠️ PR đầu tiên (thêm workflow) **chưa** hiện diff — đúng, vì baseline chưa có. Cứ merge.
6. Xem kết quả: Meticulous UI → tab **Test runs** → review visual diff.

### Phase C — Siết chặt (sau khi B ổn)
- Bật check **blocking** để chặn merge khi còn diff chưa duyệt.
- (Tùy chọn) Bật PR comment.
- Định kỳ rà thành viên organization (session có thể chứa token nhạy cảm).

---

## Lệnh nhanh

```bash
pnpm install      # cài deps
pnpm dev          # chạy local (Phase A)
pnpm build        # build production
docker build -t meticulous-demo .                          # build image (cần Docker)
docker run -p 3000:3000 -e PORT=3000 meticulous-demo       # chạy thử image
```
