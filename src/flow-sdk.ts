/**
 * flow-sdk (adapter) — bản thay thế cho host SDK gốc, để app chạy độc lập (.exe).
 * Sinh ảnh QUA OPENROUTER (chọn model ở dropdown), GIỮ NGUYÊN "hình dạng" API Flow.*
 * để App.tsx không phải sửa logic:
 *   - Flow.media.select   → mở hộp chọn file ảnh, trả {mediaId, base64, mimeType}
 *   - Flow.generate.image → gọi OpenRouter sinh ảnh từ prompt + ảnh tham chiếu + model đã chọn
 *   - Flow.download       → tải ảnh về máy
 */

// Các model ảnh dùng trong dropdown — TẤT CẢ chạy qua OpenRouter (slug đúng theo openrouter.ai).
export interface ImageModel { id: string; label: string }
export const CUSTOM_MODEL_ID = '__custom__';
export const IMAGE_MODELS: ImageModel[] = [
  { id: 'google/gemini-3-pro-image-preview', label: '🍌 Nano Banana Pro' },
  { id: 'google/gemini-2.5-flash-image',     label: '🍌 Nano Banana / Flash' },
  { id: 'openai/gpt-5.4-image-2',            label: 'GPT Image (OpenAI)' },
  { id: 'bytedance-seed/seedream-4.5',       label: 'Seedream 4.5 (ByteDance)' },
];

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

type MediaResult = { mediaId: string; base64: string; mimeType: string };

// Registry: ánh xạ mediaId -> dữ liệu ảnh, để generate.image lấy lại ảnh tham chiếu.
const registry = new Map<string, { base64: string; mimeType: string }>();

const uid = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  `id-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;

/** Lấy API key OpenRouter: ưu tiên key nhúng lúc build (team nội bộ) -> key người dùng đã lưu (qua popup). */
function getApiKey(): string {
  const envKey = (import.meta as any).env?.VITE_OPENROUTER_API_KEY as string | undefined;
  if (envKey && envKey.trim()) return envKey.trim();

  const key = (localStorage.getItem('OPENROUTER_API_KEY') || '').trim();
  if (!key) throw new Error("Chưa có OpenRouter API key — bấm 'Đổi API Key' ở góc dưới để nhập.");
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
      model: string;
      referenceImageMediaIds?: string[];
      aspectRatio?: string;
    }): Promise<MediaResult> => {
      // Ghép prompt (text) + các ảnh tham chiếu (sản phẩm/logo/nền) đã chọn trước đó.
      const content: any[] = [{ type: 'text', text: opts.prompt }];
      for (const id of opts.referenceImageMediaIds ?? []) {
        const m = registry.get(id);
        if (m) content.push({ type: 'image_url', image_url: { url: `data:${m.mimeType};base64,${m.base64}` } });
      }

      const res = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getApiKey()}`,
          'Content-Type': 'application/json',
          'X-Title': 'Banner AI',
        },
        body: JSON.stringify({
          model: opts.model,
          messages: [{ role: 'user', content }],
          modalities: ['image', 'text'],
          ...(opts.aspectRatio ? { image_config: { aspect_ratio: opts.aspectRatio } } : {}),
        }),
      });

      if (!res.ok) {
        let msg = `OpenRouter lỗi ${res.status}`;
        try { const j = await res.json(); msg = j?.error?.message || msg; } catch {}
        throw new Error(msg);
      }

      const data = await res.json();
      const message = data?.choices?.[0]?.message;
      const url: string | undefined = message?.images?.[0]?.image_url?.url;
      const parsed = url ? /^data:([^;]+);base64,(.*)$/.exec(url) : null;
      if (parsed) {
        const mimeType = parsed[1];
        const base64 = parsed[2];
        const mediaId = uid();
        registry.set(mediaId, { base64, mimeType });
        return { mediaId, base64, mimeType };
      }

      // Không có ảnh -> lấy text (thường là lý do từ chối/an toàn) làm thông báo lỗi.
      const txt = typeof message?.content === 'string' ? message.content : '';
      throw new Error(txt || 'OpenRouter không trả về ảnh. Thử lại, đổi mô tả hoặc đổi model.');
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
