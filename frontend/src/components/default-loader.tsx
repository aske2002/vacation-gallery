import { cn } from "@/lib/utils";
import { ComponentProps } from "react";
import { MoonLoader } from "react-spinners";

type DefaultLoaderProps = ComponentProps<"div"> & {
  size?: number;
  color?: string;
};

export function DefaultLoader({
  size = 50,
  className,
  color,
  ...rest
}: DefaultLoaderProps) {
  return (
    <div className={cn(className, "flex justify-center items-center h-full")}>
      <MoonLoader size={size} color={color} />
    </div>
  );
}
