import React from "react";
import { useAuth } from "../../hooks/useVacationAuth";
import { Navigate, useNavigate } from "@tanstack/react-router";
import { Button } from "../ui/button";
import { Card, CardContent, CardTitle } from "../ui/card";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({
  children,
  requireAdmin = false,
}: ProtectedRouteProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="grow w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    throw navigate({ to: "/auth", replace: true });
  }

  // Authenticated but need admin access
  if (requireAdmin && user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="text-center">
            <h2 className="text-2xl font-bold text-destructive mb-4">
              Access Denied
            </h2>
            <p className="mb-6">
              You need administrator privileges to access this page.
            </p>
            <Button
              onClick={() => navigate({ to: "/" })}
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Go Back to Gallery
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
