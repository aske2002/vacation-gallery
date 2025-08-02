import { createFileRoute } from "@tanstack/react-router";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { useAuth } from "@/hooks/useVacationAuth";
import { AuthComponent } from "@/components/auth/auth-component";

export const Route = createFileRoute("/auth")({
  component: RouteComponent,
});

function RouteComponent() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-4">
          <p className="text-center">You are already logged in.</p>
          <Button
            onClick={() => (window.location.href = "/")}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Go to Gallery
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-10">
      <CardHeader>
        <CardTitle>Vacation Gallery Authentication</CardTitle>
        <CardDescription>
          Please login or register to access your vacation photos.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <AuthComponent /> 
      </CardContent>
    </Card>
  );
}
