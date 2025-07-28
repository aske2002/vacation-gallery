import * as Magick from "wasm-imagemagick/dist/src";

declare interface Window {
  Magick: Magick;
}

// Export noise-c types for convenience
export * from './libraw';
