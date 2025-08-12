import { cn } from "@/lib/utils";
import { ComponentProps, useEffect, useMemo, useState } from "react";
import { DefaultLoader } from "./default-loader";
import { PhotoType } from "vacation-gallery-common";
import { api } from "@/api/api";
import { AnimatePresence } from "motion/react";
import { Photo } from "@/lib/photo-sorting";

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

  return (
    <div className={cn("relative overflow-hidden", className)} {...rest}>
      <img
        width={src.dimensions.width}
        height={src.dimensions.height}
        className="object-cover h-auto"
        src={src.originalUrl}
        onLoad={() => setLoaded(true)}
      />
      {!loaded && (
        <img
          src={src.thumbnailUrl}
          width={src.dimensions.width}
          height={src.dimensions.height}
          className="absolute top-0 left-0 object-cover h-auto"
          onLoad={() => setThumbLoaded(true)}
        />
      )}
      <AnimatePresence>
        {!loaded && (
          <div
            className={cn(
              "w-full absolute h-full top-0 left-0 flex justify-center items-center bg-gray-600 transition-all opacity-100",
              thumbLoaded && "opacity-30"
            )}
          >
            <DefaultLoader />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
