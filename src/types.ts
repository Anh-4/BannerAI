export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '4:5';

export interface MediaItem {
  mediaId: string;
  base64: string;
  mimeType: string;
}

export interface BannerInputState {
  productImages: (MediaItem | null)[];
  bgImage: MediaItem | null;
  logoImage: MediaItem | null;
  productDescription: string;
  style: string;
  aspectRatio: AspectRatio;
  text1: string;
  text2: string;
  text3: string;
}

export interface GeneratedOption {
  id: string;
  mediaId: string;
  base64: string;
  mimeType: string;
  prompt: string;
}
