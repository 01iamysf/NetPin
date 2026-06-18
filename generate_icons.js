import sharp from 'sharp';
import fs from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const svgPath = join(__dirname, 'icons', 'gemini-svg.svg');
const sizes = [16, 48, 128];

async function generateIcons() {
  try {
    const svgBuffer = fs.readFileSync(svgPath);
    for (const size of sizes) {
      const outputPath = join(__dirname, 'icons', `icon-${size}.png`);
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      console.log(`Successfully generated icons/icon-${size}.png (${size}x{size})`);
    }
    console.log("Icon generation completed successfully using Sharp!");
  } catch (error) {
    console.error("Error generating icons:", error);
    process.exit(1);
  }
}

generateIcons();
