/**
 * flow-sdk (adapter) — bản thay thế cho host SDK gốc, để app chạy độc lập (.exe).
 * Hiện thực lại 3 hàm Flow.* bằng Google Gemini API + API trình duyệt,
 * GIỮ NGUYÊN "hình dạng" API để App.tsx không phải sửa logic:
 *   - Flow.media.select   → mở hộp chọn file ảnh, trả {mediaId, base64, mimeType}
 *   - Flow.generate.image → gọi Gemini (Nano Banana Pro) sinh ảnh từ prompt + ảnh tham chiếu
 *   - Flow.download       → tải ảnh về máy
 */
import { GoogleGenAI, Modality } from '@google/genai';

// "🍌 Nano Banana Pro" = Gemini 3 Pro Image.
// Đổi sang 'gemini-2.5-flash-image' nếu muốn dùng Nano Banana thường (nhanh/rẻ hơn).
const IMAGE_MODEL = 'gemini-3-pro-image-preview';

type MediaResult = { mediaId: string; base64: string; mimeType: string };

// Registry: ánh xạ mediaId -> dữ liệu ảnh, để generate.image lấy lại ảnh tham chiếu.
const registry = new Map<string, { base64: string; mimeType: string }>();

const uid = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  `id-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;

/** Lấy API key: ưu tiên key nhúng lúc build (team nội bộ) -> key người dùng đã lưu (qua popup). */
function getApiKey(): string {
  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY as string | undefined;
  if (envKey && envKey.trim()) return envKey.trim();

  const key = (localStorage.getItem('GEMINI_API_KEY') || '').trim();
  if (!key) throw new Error("Chưa có Gemini API key — bấm 'Đổi API Key' ở góc dưới để nhập.");
  return key;
}

/** Mở hộp chọn file ảnh của hệ điều hành, đọc thành base64. */
function selectImageFile(): Promise<MediaResult> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return reject(new Error('Không có file nào được chọn'));
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = String(reader.result).split(',')[1] || '';
        const mediaId = uid();
        registry.set(mediaId, { base64, mimeType: file.type });
        resolve({ mediaId, base64, mimeType: file.type });
      };
      reader.onerror = () => reject(reader.error || new Error('Lỗi đọc file'));
      reader.readAsDataURL(file);
    };
    input.click();
  });
}

export const Flow = {
  media: {
    // filter giữ lại cho tương thích chữ ký gốc, hiện luôn lọc ảnh.
    select: (_opts?: { filter?: string }): Promise<MediaResult> => selectImageFile(),
  },

  generate: {
    image: async (opts: {
      prompt: string;
      modelDisplayName?: string;
      referenceImageMediaIds?: string[];
      aspectRatio?: string;
    }): Promise<MediaResult> => {
      const ai = new GoogleGenAI({ apiKey: getApiKey() });

      // Ghép prompt + các ảnh tham chiếu (sản phẩm/logo/nền) đã chọn trước đó.
      const parts: any[] = [{ text: opts.prompt }];
      for (const id of opts.referenceImageMediaIds ?? []) {
        const m = registry.get(id);
        if (m) parts.push({ inlineData: { data: m.base64, mimeType: m.mimeType } });
      }

      const response = await ai.models.generateContent({
        model: IMAGE_MODEL,
        contents: [{ role: 'user', parts }],
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
          ...(opts.aspectRatio ? { imageConfig: { aspectRatio: opts.aspectRatio } } : {}),
        } as any,
      });

      const resParts: any[] = response.candidates?.[0]?.content?.parts ?? [];
      for (const p of resParts) {
        if (p.inlineData?.data) {
          const mimeType = p.inlineData.mimeType || 'image/png';
          const base64 = p.inlineData.data as string;
          const mediaId = uid();
          registry.set(mediaId, { base64, mimeType });
          return { mediaId, base64, mimeType };
        }
      }

      // Không có ảnh -> lấy text (thường là lý do từ chối/an toàn) làm thông báo lỗi.
      const txt = resParts.find((p) => p.text)?.text;
      throw new Error(txt || 'Gemini không trả về ảnh. Thử lại hoặc đổi mô tả.');
    },
  },

  download: async (opts: {
    base64: string;
    mimeType: string;
    filename: string;
  }): Promise<void> => {
    const a = document.createElement('a');
    a.href = `data:${opts.mimeType};base64,${opts.base64}`;
    a.download = opts.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  },
};

export default Flow;
