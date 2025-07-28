import {
  createRootRouteWithContext,
  ErrorComponentProps,
  Outlet,
} from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { Api } from "@/api/synoApi";
import { Button } from "@/components/ui/button";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    component: RootComponent,
    errorComponent: RootErrorComponent,
  }
);

function RootComponent() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <Outlet />
    </div>
  );
}

function RootErrorComponent({ error, info, reset }: ErrorComponentProps) {
  return (
    <div>
      <h1>{error.name}</h1>
      <p>{error.message}</p>
      <Button>Retry</Button>
    </div>
  );
}
