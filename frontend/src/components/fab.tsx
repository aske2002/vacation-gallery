import { ComponentProps } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

type FABProps = ComponentProps<typeof Button> & {
  Icon?: LucideIcon;
  wiggle?: boolean;
};

export default function FAB({ Icon, wiggle, ...props }: FABProps) {
  return (
    <Button
      {...props}
      className={cn(
        "fixed bottom-4 right-4 z-50 rounded-full p-6 icon  flex items-center justify-center group",
        props.className
      )}
      variant={"default"}
      size={"icon"}
    >
      {Icon && <Icon className={cn(wiggle && "group-hover:animate-wiggle")} />}
    </Button>
  );
}
