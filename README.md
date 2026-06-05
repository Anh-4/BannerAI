# 🍌 Banner AI — Kozmoz Studio

App desktop tạo banner quảng cáo bằng AI **qua OpenRouter** (đổi model linh hoạt: Nano Banana Pro, Nano Banana/Flash, GPT Image, Seedream 4.5…) cho 3 brand POD: **ECZ · Kozmoz · LO**.
Upload ảnh sản phẩm/logo/nền → chọn model → nhập mô tả + text → tạo 3 mẫu banner (Tối giản / Điện ảnh / Social Dynamic).

> Stack: React + TypeScript + Vite + TailwindCSS. Đóng gói desktop bằng **Electron "thin shell"**:
> file .exe portable chỉ là vỏ mỏng, mở lên **tải giao diện từ GitHub Pages** → luôn là bản mới nhất.

---

## 1. Mô hình hoạt động (quan trọng)

```
Anh4 sửa code ──push main──► GitHub Actions build & deploy ──► GitHub Pages
                                                                    │
                          File .exe portable (vỏ mỏng) ──mở app──► tải web mới nhất
                                                          (offline → fallback bản bundled)
```

- **Người dùng chỉ cần 1 file portable .exe**: nhấp đúp là chạy, **không cần cài**.
- Anh4 cập nhật → push lên `main` → **lần mở app kế tiếp người dùng tự có bản mới**, KHÔNG cần tải lại .exe.
- Không cần internet vẫn mở được (dùng bản giao diện đóng gói sẵn trong .exe lúc build).

## 2. Chạy thử trên máy dev

Cần **Node.js 18+**.

```bash
cd banner-ai
npm install
npm run electron:dev   # app desktop (vỏ Electron tải vite localhost), hot-reload
# hoặc:  npm run dev    # chỉ chạy web http://localhost:5173
```

## 3. API key OpenRouter

App cần **OpenRouter API key** (lấy tại https://openrouter.ai/keys) — 1 key dùng cho mọi model.

- App **tự hiện popup nhập key mỗi khi mở**; key chỉ **lưu trên máy người dùng** (localStorage), chỉ gửi tới OpenRouter khi tạo ảnh. Mỗi người tự nhập key của mình → an toàn khi chia sẻ.
- Nút **"Đổi API Key"** ở góc dưới panel trái để đổi key bất cứ lúc nào.
- Chọn model ở **dropdown "Model AI (OpenRouter)"** ngay trên nút tạo; chọn "Khác" để tự nhập model ID bất kỳ trên OpenRouter.
- (Tùy chọn) Nhúng sẵn key cho team nội bộ: copy `.env.example` → `.env`, điền `VITE_OPENROUTER_API_KEY=...`. ⚠️ KHÔNG nhúng nếu chia sẻ rộng.

## 4. Build file .exe portable để chia sẻ

```bash
npm run dist:win
```

Ra file **`release/Banner-AI-x.x.x-portable.exe`** — gửi thẳng file này cho người khác.

> Chỉ cần build lại .exe khi sửa **phần vỏ Electron** (`electron/main.cjs`) — việc rất hiếm.
> Còn sửa giao diện/logic (thư mục `src/`) thì KHÔNG cần build lại .exe, chỉ push code (mục 5).

## 5. Cập nhật cho mọi người (chỉ cần push code)

```bash
git add -A
git commit -m "..."
git push origin main
```

GitHub Actions ([deploy-pages.yml](.github/workflows/deploy-pages.yml)) tự build và deploy lên GitHub Pages
(`https://anh-4.github.io/BannerAI/`). Người dùng mở app lần kế tiếp là thấy bản mới.

> Lần đầu: vào repo → **Settings → Pages → Source = GitHub Actions** (workflow đã bật sẵn `enablement: true`).

---

## Cấu trúc

```
banner-ai/
├── src/
│   ├── App.tsx                  # Giao diện chính (logic tạo banner)
│   ├── flow-sdk.ts              # Adapter: gọi OpenRouter + danh sách model (IMAGE_MODELS)
│   ├── main.tsx · index.css     # Khởi động React + Tailwind
│   ├── types.ts                 # Định nghĩa kiểu dữ liệu
│   └── components/
│       ├── Primitives.tsx       # UI components
│       └── ApiKeyModal.tsx      # Popup nhập/đổi API key
├── electron/main.cjs            # Vỏ Electron (thin shell) — tải web từ GitHub Pages
├── build/icon.svg|.ico|.png     # Icon app (sửa icon.svg rồi `npm run make-icon`)
├── .github/workflows/deploy-pages.yml
├── vite.config.ts · tailwind.config.js · tsconfig.json · package.json
```

> Thêm/bớt model trong dropdown: sửa mảng `IMAGE_MODELS` trong [src/flow-sdk.ts](src/flow-sdk.ts)
> (dùng đúng slug OpenRouter, vd `google/gemini-3-pro-image-preview`, `openai/gpt-5.4-image-2`).
> Đổi URL Pages: sửa `APP_URL` trong [electron/main.cjs](electron/main.cjs).
