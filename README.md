# 🍌 Banner AI — Kozmoz Studio

App desktop tạo banner quảng cáo bằng AI (Google Gemini "Nano Banana Pro") cho 3 brand POD: **ECZ · Kozmoz · LO**.
Upload ảnh sản phẩm/logo/nền → nhập mô tả + text → tạo 3 mẫu banner (Tối giản / Điện ảnh / Social Dynamic).

> Stack: React + TypeScript + Vite + TailwindCSS, đóng gói desktop bằng **Electron**.

---

## 1. Cài đặt (chạy thử trên máy dev)

Cần **Node.js 18+**.

```bash
cd banner-ai
npm install
npm run electron:dev   # chạy app desktop (Vite + Electron), hot-reload
# hoặc:  npm run dev    # chỉ chạy trên trình duyệt http://localhost:5173
```

## 2. API key Gemini

App cần Gemini API key (lấy MIỄN PHÍ tại https://aistudio.google.com/apikey).

- **Mặc định:** lần đầu tạo banner, app sẽ hỏi key và lưu lại trên máy (mỗi người dùng tự nhập key của mình → an toàn khi chia sẻ).
- **Team nội bộ:** muốn nhúng sẵn key vào file .exe, copy `.env.example` thành `.env` rồi điền `VITE_GEMINI_API_KEY=...` trước khi build.
  ⚠️ KHÔNG nhúng key nếu chia sẻ rộng — ai cũng moi được key ra dùng → tốn quota của bạn.

## 3. Đóng gói ra file .exe

```bash
npm run electron:build
```

File cài đặt + bản portable xuất ra thư mục **`release/`**:
- `Banner AI Setup x.x.x.exe` — bản cài đặt (NSIS)
- `Banner AI x.x.x.exe` — bản portable (chạy thẳng, không cần cài)

## 4. Chia sẻ qua GitHub

**Cách A — tự build rồi up file (nhanh):**
1. Tạo repo trên GitHub, push code lên.
2. Vào tab **Releases → Draft a new release**, kéo thả file `.exe` trong `release/` vào, publish.
3. Gửi link release cho người khác tải.

**Cách B — để GitHub tự build (đã cấu hình sẵn):**
Repo đã có workflow [`.github/workflows/build.yml`](.github/workflows/build.yml).
Chỉ cần đẩy 1 tag phiên bản, GitHub Actions sẽ tự build .exe và đính kèm vào Release:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Vào tab **Actions** xem tiến trình; build xong file .exe nằm trong Release của tag đó.

---

## 5. Tự động cập nhật (auto-update)

App tự kiểm tra bản mới trên GitHub Releases mỗi lần mở, tải ngầm và cài khi người dùng thoát app → lần mở sau là bản mới. Không cần gửi lại file cho ai.

> ⚠️ Auto-update **chỉ chạy với bản cài đặt `Banner AI Setup x.x.x.exe`** (NSIS), KHÔNG chạy với bản portable. → Chia sẻ bản **Setup** cho mọi người.

**Cách ra bản mới (rất quan trọng — phải khớp version):**

1. Sửa code.
2. Tăng `"version"` trong [package.json](package.json), ví dụ `1.0.1` → `1.0.2`.
3. Commit, rồi đẩy tag **trùng version** đó:

```bash
git add -A && git commit -m "v1.0.2: ..."
git tag v1.0.2
git push origin main --tags
```

GitHub Actions tự build và publish (kèm `latest.yml`). Người dùng đang chạy bản cũ sẽ tự cập nhật lên `1.0.2` ở lần mở app kế tiếp.

> Tag và số version trong package.json **phải giống nhau**, nếu lệch app sẽ không nhận ra bản mới.

---

## Cấu trúc

```
banner-ai/
├── src/
│   ├── App.tsx              # Giao diện chính (logic tạo banner)
│   ├── flow-sdk.ts          # Adapter: thay flow-sdk gốc bằng Gemini API
│   ├── main.tsx             # Điểm khởi động React
│   ├── index.css            # Tailwind
│   ├── types.ts             # (Anh4 cung cấp) định nghĩa kiểu dữ liệu
│   └── components/
│       └── Primitives.tsx   # (Anh4 cung cấp) UI components
├── electron/main.cjs        # Tiến trình chính Electron
├── .github/workflows/build.yml
├── vite.config.ts · tailwind.config.js · tsconfig.json · package.json
```

> Đổi model AI: sửa hằng `IMAGE_MODEL` trong [src/flow-sdk.ts](src/flow-sdk.ts)
> (`gemini-3-pro-image-preview` = Nano Banana Pro, `gemini-2.5-flash-image` = bản thường).
