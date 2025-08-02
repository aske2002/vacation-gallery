import React, { useState } from "react";
import { useAuth } from "../../hooks/useVacationAuth";
import { LoginForm } from "./login-component";
import { RegisterForm } from "./register-component";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

export function AuthComponent() {
  const [mode, setMode] = useState<"login" | "register">("login");
  
  return (
    <>
      <div className="bg-accent p-2 rounded-lg flex justify-center space-x-4">
        <Button
          onClick={() => setMode("login")}
          className={cn(
            mode === "login"
              ? "bg-blue-600 text-white grow"
              : "bg-gray-200 text-gray-700"
          )}
        >
          Login
        </Button>
        <Button
          onClick={() => setMode("register")}
          className={
            mode === "register"
              ? "bg-blue-600 text-white grow"
              : "bg-gray-200 text-gray-700"
          }
        >
          Register
        </Button>
      </div>

      {/* Login Form */}
      {mode === "login" && <LoginForm />}

      {/* Register Form */}
      {mode === "register" && <RegisterForm />}
    </>
  );
}
