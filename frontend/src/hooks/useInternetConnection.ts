import { useEffect, useState } from "react";

export default function useInternetConnection() {
  const [online, setIsOnline] = useState<boolean>(window.navigator.onLine);

  useEffect(() => {
    const isOnlineCB = () => {
      setIsOnline(true);
    };
    const isOfflineCB = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", isOnlineCB);
    window.addEventListener("offline", isOfflineCB);
    return () => {
      window.removeEventListener("online", isOnlineCB);
      window.removeEventListener("offline", isOfflineCB);
    };
  }, []);

  return online;
}
