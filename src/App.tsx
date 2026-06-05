import React, { useState, useEffect, useCallback } from 'react';
import { Flow } from './flow-sdk';
import { SectionLabel, PillButton, TextInput, SegmentedToggle, ZoomModal } from './components/Primitives';
import { UpdateButton } from './components/UpdateButton';
import { BannerInputState, GeneratedOption, AspectRatio, MediaItem } from './types';

export default function App() {
  const [inputs, setInputs] = useState<BannerInputState>({
    productImages: [null, null, null],
    bgImage: null,
    logoImage: null,
    productDescription: '',
    style: 'Modern commercial, professional studio lighting, clean minimal aesthetic',
    aspectRatio: '9:16',
    text1: '',
    text2: '',
    text3: '',
  });

  // Quản lý 3 slot banner cố định
  const [options, setOptions] = useState<(GeneratedOption | null)[]>([null, null, null]);
  const [loadingIndices, setLoadingIndices] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'banner-app-styles';
    style.textContent = `
      html, body, #root { margin: 0; padding: 0; width: 100%; height: 100%; background: #0e0e0e; font-family: 'Google Sans Text', sans-serif; overflow: hidden; }
      .dark-scrollbar::-webkit-scrollbar { width: 4px; }
      .dark-scrollbar::-webkit-scrollbar-track { background: transparent; }
      .dark-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
      @keyframes shimmer { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
      .animate-shimmer { animation: shimmer 1.5s infinite ease-in-out; }
    `;
    document.head.appendChild(style);
  }, []);

  const selectProductMedia = async (index: number) => {
    try {
      const media = await Flow.media.select({ filter: 'image' });
      const newImages = [...inputs.productImages];
      newImages[index] = { mediaId: media.mediaId, base64: media.base64, mimeType: media.mimeType };
      setInputs(prev => ({ ...prev, productImages: newImages }));
    } catch (e) {
      console.error("Selection cancelled");
    }
  };

  const selectBgMedia = async () => {
    try {
      const media = await Flow.media.select({ filter: 'image' });
      setInputs(prev => ({ ...prev, bgImage: { mediaId: media.mediaId, base64: media.base64, mimeType: media.mimeType } }));
    } catch (e) {
      console.error("Selection cancelled");
    }
  };

  const selectLogoMedia = async () => {
    try {
      const media = await Flow.media.select({ filter: 'image' });
      setInputs(prev => ({ ...prev, logoImage: { mediaId: media.mediaId, base64: media.base64, mimeType: media.mimeType } }));
    } catch (e) {
      console.error("Selection cancelled");
    }
  };

  const removeProductMedia = (index: number) => {
    const newImages = [...inputs.productImages];
    newImages[index] = null;
    setInputs(prev => ({ ...prev, productImages: newImages }));
  };

  const getPromptForIndex = (index: number) => {
    const productInfo = inputs.productDescription || "commercial product";
    const styleDesc = inputs.style || "professional commercial photography";
    const textContent = [inputs.text1, inputs.text2, inputs.text3].filter(t => t.trim() !== '').map(t => `"${t}"`).join(", ");

    const prompts = [
      // Option 1: Minimalist & Professional Studio
      `High-end minimalist studio advertisement for ${productInfo}. Style: ${styleDesc}. Clean, professional lighting with soft shadows. Minimalist background, high-resolution commercial photography, sharp focus. Marketing text: ${textContent}.`,

      // Option 2: Cinematic & Atmospheric
      `Cinematic lifestyle advertising poster for ${productInfo}. Style: ${styleDesc}. Dramatic lighting, atmospheric mood, shallow depth of field with beautiful bokeh background. Professional cinematic composition. Text: ${textContent}.`,

      // Option 3: Social Media Ad (Dynamic Speed & Contrast) - UPDATED
      `Premium social media advertising banner for ${productInfo}. Style: ${styleDesc}. Incorporate dynamic "speed racing shapes", slanted geometric lines, and motion energy elements in the design. Minimalist simple background with high color contrast against the product. Use a dark moody aesthetic or deep background blur (bokeh) to make the main product pop and stand out intensely. High-end professional advertising layout, sharp product focus, luxury commercial look. Marketing text: ${textContent}.`
    ];
    return prompts[index] || prompts[0];
  };

  const generateSingleOption = async (index: number) => {
    setError(null);
    setLoadingIndices(prev => new Set(prev).add(index));

    try {
      const productIds = inputs.productImages.filter(img => img !== null).map(img => img!.mediaId);
      const bgId = inputs.bgImage ? [inputs.bgImage.mediaId] : [];
      const logoId = inputs.logoImage ? [inputs.logoImage.mediaId] : [];
      const allRefs = [...productIds, ...bgId, ...logoId];

      const prompt = getPromptForIndex(index);
      const apiAspectRatio = inputs.aspectRatio === '4:5' ? '3:4' : inputs.aspectRatio;

      const result = await Flow.generate.image({
        prompt: prompt,
        modelDisplayName: '🍌 Nano Banana Pro',
        ...(allRefs.length > 0 ? { referenceImageMediaIds: allRefs.slice(0, 10) } : {}),
        aspectRatio: apiAspectRatio as any,
      });

      const option: GeneratedOption = {
        id: crypto.randomUUID(),
        mediaId: result.mediaId,
        base64: result.base64,
        mimeType: result.mimeType,
        prompt: prompt
      };

      setOptions(prev => {
        const next = [...prev];
        next[index] = option;
        return next;
      });
    } catch (err: any) {
      setError(`Lỗi slot ${index + 1}: ${err.message || "Không thể tạo banner"}`);
    } finally {
      setLoadingIndices(prev => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  };

  const generateAllBanners = async () => {
    // Chỉ tạo những cái chưa đang load
    const indicesToGenerate = [0, 1, 2].filter(i => !loadingIndices.has(i));
    indicesToGenerate.forEach(i => generateSingleOption(i));
  };

  const downloadImage = async (option: GeneratedOption) => {
    await Flow.download({
      base64: option.base64,
      mimeType: option.mimeType,
      filename: `banner_ai_${option.id.slice(0, 4)}.jpg`
    });
  };

  const optionLabels = ["Mẫu 1: Tối giản", "Mẫu 2: Điện ảnh", "Mẫu 3: Social & Dynamic Speed"];

  return (
    <div className="flex h-screen w-screen bg-[#0e0e0e] text-white overflow-hidden select-none">
      {/* Left Panel: Configuration */}
      <div className="w-[300px] h-full border-r border-white/10 flex flex-col justify-between p-[12px] shrink-0 bg-[#0e0e0e]">
        <div className="flex flex-col gap-6 overflow-y-auto dark-scrollbar pr-1 pb-4">

          {/* Media Section */}
          <div className="flex flex-col gap-2">
            <SectionLabel>Tải lên hình ảnh (Sản phẩm, Logo, Nền)</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              {inputs.productImages.map((img, idx) => (
                <div key={`prod-slot-${idx}`} className="relative group">
                  <button
                    onClick={() => selectProductMedia(idx)}
                    className={`w-full aspect-square rounded-xl border border-dashed transition-all flex flex-col items-center justify-center bg-white/5 ${img ? 'border-white/40' : 'border-[#595959] hover:border-white/30'}`}
                  >
                    {img ? (
                      <img src={`data:${img.mimeType};base64,${img.base64}`} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px] text-white/30">add_photo_alternate</span>
                        <span className="text-[8px] text-white/20 mt-1 uppercase font-bold tracking-widest">Sản phẩm {idx + 1}</span>
                      </>
                    )}
                  </button>
                  {img && (
                    <button
                      onClick={(e) => { e.stopPropagation(); removeProductMedia(idx); }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-black/80 border border-white/10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  )}
                </div>
              ))}

              {/* Logo slot */}
              <div className="relative group">
                <button
                  onClick={selectLogoMedia}
                  className={`w-full aspect-square rounded-xl border border-dashed transition-all flex flex-col items-center justify-center bg-white/5 ${inputs.logoImage ? 'border-white/40' : 'border-[#595959] hover:border-white/30'}`}
                >
                  {inputs.logoImage ? (
                    <img src={`data:${inputs.logoImage.mimeType};base64,${inputs.logoImage.base64}`} className="w-full h-full object-contain p-2 rounded-lg" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px] text-white/30">branding_watermark</span>
                      <span className="text-[8px] text-white/20 mt-1 uppercase font-bold tracking-widest">Logo Web</span>
                    </>
                  )}
                </button>
                {inputs.logoImage && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setInputs(prev => ({ ...prev, logoImage: null })); }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-black/80 border border-white/10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                )}
              </div>

              {/* Background slot */}
              <div className="relative group">
                <button
                  onClick={selectBgMedia}
                  className={`w-full aspect-square rounded-xl border border-dashed transition-all flex flex-col items-center justify-center bg-white/5 ${inputs.bgImage ? 'border-white/40' : 'border-[#595959] hover:border-white/30'}`}
                >
                  {inputs.bgImage ? (
                    <img src={`data:${inputs.bgImage.mimeType};base64,${inputs.bgImage.base64}`} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px] text-white/30">image</span>
                      <span className="text-[8px] text-white/20 mt-1 uppercase font-bold tracking-widest">Ảnh nền mẫu</span>
                    </>
                  )}
                </button>
                {inputs.bgImage && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setInputs(prev => ({ ...prev, bgImage: null })); }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-black/80 border border-white/10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Product Info Section */}
          <div className="flex flex-col gap-3">
            <SectionLabel>Thông tin thiết kế</SectionLabel>
            <TextInput
              label="Mô tả sản phẩm/nhân vật"
              value={inputs.productDescription}
              onChange={(val) => setInputs(prev => ({ ...prev, productDescription: val }))}
              placeholder="Ví dụ: Giày Nike Air Max, phong cách năng động, nhân vật anime..."
              rows={2}
            />
            <TextInput
              label="Phong cách & Thể loại"
              value={inputs.style}
              onChange={(val) => setInputs(prev => ({ ...prev, style: val }))}
              placeholder="Ví dụ: Cyberpunk, Luxury, Organic, Minimalism..."
              rows={2}
            />
            <SegmentedToggle
              label="Tỉ lệ khung hình"
              value={inputs.aspectRatio}
              onChange={(val) => setInputs(prev => ({ ...prev, aspectRatio: val }))}
              items={[
                { value: '1:1', label: '1:1' },
                { value: '9:16', label: '9:16' },
                { value: '4:5', label: '4:5' },
                { value: '16:9', label: '16:9' },
              ]}
            />
          </div>

          {/* Content Section */}
          <div className="flex flex-col gap-3">
            <SectionLabel>Nội dung văn bản</SectionLabel>
            <TextInput
              label="Tiêu đề chính"
              value={inputs.text1}
              onChange={(val) => setInputs(prev => ({ ...prev, text1: val }))}
              placeholder="Nhập thông điệp chính..."
            />
            <TextInput
              label="Mô tả phụ / Slogan"
              value={inputs.text2}
              onChange={(val) => setInputs(prev => ({ ...prev, text2: val }))}
              placeholder="Nhập thông tin bổ sung..."
            />
            <TextInput
              label="Nút bấm (CTA)"
              value={inputs.text3}
              onChange={(val) => setInputs(prev => ({ ...prev, text3: val }))}
              placeholder="Ví dụ: Mua ngay, Khám phá..."
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-medium leading-relaxed">
              <div className="flex gap-2 items-start">
                <span className="material-symbols-outlined text-[14px]">error</span>
                <span>{error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Generate Button */}
        <div className="pt-3">
          <PillButton
            variant="solid"
            icon={<span className="material-symbols-outlined text-[18px] animate-pulse">auto_awesome</span>}
            onClick={generateAllBanners}
            disabled={loadingIndices.size > 0}
            className="w-full py-3"
          >
            {loadingIndices.size > 0 ? `Đang tạo ${loadingIndices.size} mẫu...` : "Tạo tất cả các mẫu"}
          </PillButton>
          <UpdateButton />
        </div>
      </div>

      {/* Main Area: Gallery Slots */}
      <div className="flex-1 h-full overflow-y-auto dark-scrollbar p-6 md:p-10 bg-[#0a0a0a]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {options.map((opt, idx) => (
            <div key={`slot-${idx}`} className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.1em]">{optionLabels[idx]}</span>
                {opt && !loadingIndices.has(idx) && (
                  <button
                    onClick={() => generateSingleOption(idx)}
                    className="text-[10px] text-white/40 hover:text-white transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">refresh</span>
                    <span>Tạo lại</span>
                  </button>
                )}
              </div>

              <div className={`group relative bg-[#141414] border rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${opt ? 'border-white/5 hover:border-white/20' : 'border-dashed border-white/10'}`}>
                {loadingIndices.has(idx) ? (
                  /* Loading State */
                  <div className={`flex flex-col items-center justify-center gap-4 animate-shimmer ${
                    inputs.aspectRatio === '1:1' ? 'aspect-square' :
                    inputs.aspectRatio === '16:9' ? 'aspect-video' :
                    inputs.aspectRatio === '4:5' ? 'aspect-[4/5]' : 'aspect-[9/16]'
                  }`}>
                    <div className="w-8 h-8 border-2 border-white/10 border-t-white/70 rounded-full animate-spin" />
                    <p className="text-[9px] text-white/30 font-bold uppercase tracking-[0.2em]">AI đang thiết kế...</p>
                  </div>
                ) : opt ? (
                  /* Result State */
                  <div className="relative overflow-hidden">
                    <img
                      src={`data:${opt.mimeType};base64,${opt.base64}`}
                      className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                        inputs.aspectRatio === '1:1' ? 'aspect-square' :
                        inputs.aspectRatio === '16:9' ? 'aspect-video' :
                        inputs.aspectRatio === '4:5' ? 'aspect-[4/5]' : 'aspect-[9/16]'
                      }`}
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 px-6">
                      <PillButton
                        variant="solid"
                        icon={<span className="material-symbols-outlined text-[18px]">zoom_in</span>}
                        onClick={() => setZoomImage(`data:${opt.mimeType};base64,${opt.base64}`)}
                      >
                        Xem lớn
                      </PillButton>
                      <PillButton
                        variant="outline"
                        icon={<span className="material-symbols-outlined text-[18px]">download</span>}
                        onClick={() => downloadImage(opt)}
                      >
                        Tải về
                      </PillButton>
                    </div>
                  </div>
                ) : (
                  /* Empty State */
                  <div className={`flex flex-col items-center justify-center gap-4 p-8 text-center ${
                    inputs.aspectRatio === '1:1' ? 'aspect-square' :
                    inputs.aspectRatio === '16:9' ? 'aspect-video' :
                    inputs.aspectRatio === '4:5' ? 'aspect-[4/5]' : 'aspect-[9/16]'
                  }`}>
                    <span className="material-symbols-outlined text-[32px] text-white/10">auto_awesome</span>
                    <PillButton
                      variant="outline"
                      className="!h-[30px] !px-3 !text-[10px]"
                      onClick={() => generateSingleOption(idx)}
                    >
                      Thiết kế mẫu này
                    </PillButton>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {options.every(o => o === null) && !loadingIndices.size && (
          <div className="mt-12 text-center text-white/20">
            <p className="text-xs italic">Tải lên ảnh sản phẩm và nhấn nút để bắt đầu thiết kế banner.</p>
          </div>
        )}
      </div>

      <ZoomModal
        isOpen={!!zoomImage}
        onClose={() => setZoomImage(null)}
        imageSrc={zoomImage || ''}
      />
    </div>
  );
}
