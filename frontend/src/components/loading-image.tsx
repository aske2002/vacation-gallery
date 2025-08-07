import { cn } from "@/lib/utils";
import { ComponentProps, useEffect, useMemo, useState } from "react";
import { DefaultLoader } from "./default-loader";
import { Photo } from "@common/types/photo";
import { api } from "@/api/api";
import { AnimatePresence } from "motion/react";

type LoadingImageProps = ComponentProps<"div"> & {
  src: Photo;
};

export default function LoadingImage({
  src,
  className,
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

  return (
    <div className={cn("relative overflow-hidden", className)} {...rest}>
      <img
        width={src.width}
        height={src.height}
        className="object-cover h-auto"
        src={fullSrc}
        onLoad={() => setLoaded(true)}
      />
      {!loaded && (
        <img
          src={thumbSrc}
          width={src.width}
          height={src.height}
          className="absolute top-0 left-0 object-cover h-auto"
          onLoad={() => setThumbLoaded(true)}
        />
      )}
      <AnimatePresence>
        {!loaded && (
          <div
            className={cn(
              "w-full absolute h-full top-0 left-0 flex justify-center items-center bg-gray-600 transition-all opacity-100",
              thumbLoaded && "opacity-30",
            )}
          >
            <DefaultLoader />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
