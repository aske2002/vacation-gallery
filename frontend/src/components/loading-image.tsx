import { cn } from "@/lib/utils";
import { ComponentProps, useEffect, useMemo, useState } from "react";
import { DefaultLoader } from "./default-loader";
import { Photo } from "@common/types/photo";
import { api } from "@/api/api";
import { AnimatePresence, motion } from "motion/react";

type LoadingImageProps = Omit<
  ComponentProps<"img">,
  "onLoadStart" | "onLoad" | "onLoadStartCapture" | "onLoadCapture" | "src"
> & {
  onLoaded?: () => void;
  src: Photo;
  onLoadStarted?: () => void;
};

export default function LoadingImage({
  onLoadStarted,
  onLoaded,
  src,
  ...rest
}: LoadingImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [thumbLoaded, setThumbLoaded] = useState(false);
  const thumbSrc = useMemo(() => {
    return api.getThumbnailUrl(src.filename);
  }, [src.filename]);

  const fullSrc = useMemo(() => {
    return api.getImageUrl(src.filename);
  }, [src.filename]);

  useEffect(() => {
    loaded && onLoaded?.();
  }, [loaded, onLoaded]);

  return (
    <div className="relative">
      <img {...rest} src={fullSrc} onLoad={() => setLoaded(true)} />
      <img
        src={thumbSrc}
        className="absolute object-cover"
        onLoad={() => setThumbLoaded(true)}
      />
      <AnimatePresence>
        {!thumbLoaded && (
          <div className="w-full absolute h-full top-0 left-0 flex justify-center items-center bg-gray-600 opacity-70">
            <DefaultLoader />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
