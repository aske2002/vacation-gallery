import {
  ImageMagick,
  IMagickImage,
  initializeImageMagick,
} from "@imagemagick/magick-wasm";

function replaceExtension(filename: string, newExt: string): string {
  return filename.replace(/\.[^/.]+$/, "") + "." + newExt.replace(/^\./, "");
}

export async function optimizeImages(files: File[]) {
  const wasmLocation = new URL(
    "@imagemagick/magick-wasm/magick.wasm",
    import.meta.url
  );
  await initializeImageMagick(wasmLocation);

  return await Promise.all(
    files.map(async (file) => {
      const bytes = new Uint8Array(await file.arrayBuffer());
      return ImageMagick.read(
        bytes,
        async (image: IMagickImage) => {
          image.quality = 80;
          return image.write("JPG", (data) => {
            return new File([data], replaceExtension(file.name, "jpg"), {
              type: "image/jpeg",
            });
          });
        }
      );
    })
  );
}
