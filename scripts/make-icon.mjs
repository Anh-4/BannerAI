// Tạo build/icon.ico + build/icon.png từ build/icon.svg.
// Chạy: npm run make-icon  (cần sharp + png-to-ico). Icon.ico đã được commit sẵn,
// chỉ chạy lại script này khi sửa icon.svg.
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const svgPath = fileURLToPath(new URL('../build/icon.svg', import.meta.url));
const icoPath = fileURLToPath(new URL('../build/icon.ico', import.meta.url));
const pngPath = fileURLToPath(new URL('../build/icon.png', import.meta.url));

const svg = readFileSync(svgPath);
const sizes = [256, 128, 64, 48, 32, 16];

const pngs = await Promise.all(sizes.map((s) => sharp(svg).resize(s, s).png().toBuffer()));
writeFileSync(icoPath, await pngToIco(pngs));
writeFileSync(pngPath, await sharp(svg).resize(512, 512).png().toBuffer());

console.log('OK -> build/icon.ico (multi-size) + build/icon.png (512)');
