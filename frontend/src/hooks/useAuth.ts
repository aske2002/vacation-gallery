import { Api } from "@/api/synoApi";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

export type CredentialsResponse = {
  did: string;
  sid: string;
};

export type TokenResponse = {
  is_portal_port: boolean;
  synotoken: string;
};

export function useAuth() {
  const getUserFromLocalStorage = (): CredentialsResponse | null => {
    const user = localStorage.getItem("user");

    return user ? JSON.parse(user) : null;
  };

  const setUserInLocalStorage = (user: CredentialsResponse | null) => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  };

  const [user, setUser] = useState<CredentialsResponse | null>(
    getUserFromLocalStorage()
  );

  const { mutateAsync: login, isPending: isLoggingIn } = useMutation({
    mutationFn: async ({
      username,
      password,
    }: {
      username: string;
      password: string;
    }) => {
      const response = await Api.login(username, password);
      if (response.data.success) {
        setUser(response.data.data);
        setUserInLocalStorage(response.data.data);
        return response.data.data;
      } else {
        throw new Error("Login failed");
      }
    },
    onError: (error) => {
      console.error("Login error:", error);
      setUser(null);
      setUserInLocalStorage(null);
    },
  });

  const isLoading = useMemo(() => {
    return isLoggingIn
  }, [isLoggingIn]);

  const isAuthenticated = useMemo(() => {
    return !!user;
  }, [user]);

  const logout = () => {
    setUser(null);
    setUserInLocalStorage(null);
  };

  return { isAuthenticated, isLoading, token: user?.sid, login, logout };
}
