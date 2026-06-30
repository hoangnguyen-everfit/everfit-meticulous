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
pnpm test         # chạy unit test (Vitest + RTL)
pnpm build        # build production
docker build -t meticulous-demo .                          # build image (cần Docker)
docker run -p 3000:3000 -e PORT=3000 meticulous-demo       # chạy thử image
```

---

## Meticulous integration (developer-side)

Toàn bộ logic Meticulous nằm trong `lib/meticulous/` (port sang repo khác = copy 1 thư mục):

- `isReplay()` / `isMeticulousBuild()` — phát hiện ngữ cảnh replay / test-build.
- `injectAuthForReplay()` — (#7) inject một token cố định khi replay để trang protected
  render được dù auth của session gốc khác/expired. Gọi qua `components/MeticulousBootstrap.tsx`.
- `capturePerformance()` — (#8) đọc metric perf **thật** qua
  `window.Meticulous.replay.native.performance`, chỉ khi `window.Meticulous.replay.isBenchmarkableReplay === true`
  (khi replay thường, `window.performance` bị stub deterministic). Kết quả đẩy vào
  `window.__perfMetrics` (xem trong DevTools console).
- `nextDeterministicId()` — (#9) Dashboard dùng để id của item thêm vào **ổn định** khi
  replay thay vì `Date.now()` (tránh flaky visual diff).

### Auth token-gate (#7)

`lib/auth.ts` lưu token vào `localStorage['demo_auth_token']`. `/dashboard` là protected —
chưa login sẽ redirect về `/login`. Đây là demo-grade; app thật nên gate ở server.

### Network mocking (#3)

`GET /api/items` và `POST /api/items` được Meticulous **mock tự động** khi replay —
phát lại response đã ghi, nên không có side-effect thật và không flaky.

### Testing pool — chọn session nào chạy (#10)

Cấu hình trong Meticulous UI (project settings → session selection / testing pool).
Meticulous tự chọn session phủ các loại user, biến thể dữ liệu, tổ hợp feature flag khác nhau;
bạn tinh chỉnh pool tại đó. Docs: https://app.meticulous.ai/docs/how-to/testing-pool

### Unit tests

`pnpm test` (Vitest + React Testing Library). Bản thân Meticulous là tầng visual e2e.
