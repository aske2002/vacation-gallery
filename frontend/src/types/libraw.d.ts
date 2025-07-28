declare module 'libraw-wasm' {
  export interface LibRawSettings {
    bright?: number;
    threshold?: number;
    autoBrightThr?: number;
    adjustMaximumThr?: number;
    expShift?: number;
    expPreser?: number;

    halfSize?: boolean;
    fourColorRgb?: boolean;
    highlight?: number;
    useAutoWb?: boolean;
    useCameraWb?: boolean;
    useCameraMatrix?: 0 | 1 | 3;
    outputColor?: number;
    outputBps?: 8 | 16;
    outputTiff?: boolean;
    outputFlags?: number;
    userFlip?: number;
    userQual?: number;
    userBlack?: number;
    userCblack?: [number, number, number, number];
    userSat?: number;
    medPasses?: number;
    noAutoBright?: boolean;
    useFujiRotate?: -1 | 0 | 1;
    greenMatching?: boolean;
    dcbIterations?: number;
    dcbEnhanceFl?: boolean;
    fbddNoiserd?: 0 | 1 | 2;
    expCorrec?: boolean;
    noAutoScale?: boolean;
    noInterpolation?: boolean;

    greybox?: [number, number, number, number] | null;
    cropbox?: [number, number, number, number] | null;
    aber?: [number, number, number] | null;
    gamm?: [number, number] | null;
    userMul?: [number, number, number, number] | null;

    outputProfile?: string | null;
    cameraProfile?: string | 'embed' | null;
    badPixels?: string | null;
    darkFrame?: string | null;
  }

  export interface LibRawMetadata {
    [key: string]: any; // Can be expanded with specific fields if desired
  }

  export interface LibrawImageData {
    bits: number;
    colors: number;
    data: Uint8Array;
    dataSize: number;
    height: number;
    width: number;
  }

  export default class LibRaw {
    constructor();
    open(buffer: Uint8Array, settings?: LibRawSettings): Promise<void>;
    metadata(fullOutput?: boolean): Promise<LibRawMetadata>;
    imageData(): Promise<LibrawImageData>;
    // Optional: Add dispose() if the instance needs to be cleaned up
    dispose?(): void;
  }
}
