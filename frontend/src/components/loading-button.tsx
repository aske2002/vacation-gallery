import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { ComponentProps, forwardRef } from "react";

type LoadingButtonProps = ComponentProps<typeof Button> & {
  loading?: boolean;
};

const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  function LoadingButton({ loading, children, ...props }, ref) {
    const { pending } = useFormStatus();

    const isLoading = loading ?? pending;

    return (
      <Button ref={ref} disabled={isLoading} {...props}>
        <>
          {children}
          {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
        </>
      </Button>
    );
  },
);

LoadingButton.displayName = "LoadingButton";

export { LoadingButton };