import {
  createRootRouteWithContext,
  ErrorComponentProps,
  Outlet,
  useNavigate,
} from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useVacationAuth";
import { UserMenu } from "@/components/auth/user-menu";
import { useLocation } from "react-router";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    component: RootComponent,
    errorComponent: RootErrorComponent,
  }
);

function RootComponent() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="bg-muted flex h-screen flex-col items-center justify-start p-6 md:p-10 overflow-y-auto">
      {isAuthenticated && (
        <div className="flex justify-start w-full mb-4 bg-neutral-700 rounded-2xl p-4">
          <UserMenu />
          <Button variant={"link"} onClick={() => navigate({ to: "/" })}>
            Home
          </Button>
          {user?.role == "admin" && (
            <Button variant={"link"} onClick={() => navigate({ to: "/admin" })}>
              Admin
            </Button>
          )}
          <Button variant={"link"} onClick={() => navigate({ to: "/flight" })}>
            Flight Data
          </Button>
        </div>
      )}
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
