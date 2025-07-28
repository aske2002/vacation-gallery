import { cn } from "@/lib/utils";
import { ComponentProps, useEffect, useState } from "react";

type LoadingImageProps = Omit<
  ComponentProps<"img">,
  "onLoadStart" | "onLoad" | "onLoadStartCapture" | "onLoadCapture"
> & {
  onLoaded?: () => void;
  onLoadStarted?: () => void;
};

export default function LoadingImage({
  onLoadStarted,
  onLoaded,
  ...rest
}: LoadingImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [loadStarted, setLoadStarted] = useState(false);

  useEffect(() => {
    loadStarted && onLoadStarted?.();
  }, [loadStarted, onLoadStarted]);

  useEffect(() => {
    loaded && onLoaded?.();
  }, [loaded, onLoaded]);

  return (
    <img
      {...rest}
      onLoadStart={() => setLoadStarted(true)}
      onLoad={() => setLoaded(true)}
      className={cn(rest.className, !loaded && "animate-pulse bg-gray-600")}
    />
  );
}
