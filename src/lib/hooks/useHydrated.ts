import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store/auth";

export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      Promise.resolve().then(() => setHydrated(true));
    });

    if (useAuthStore.persist.hasHydrated()) {
      Promise.resolve().then(() => setHydrated(true));
    }

    return () => unsub();
  }, []);

  return hydrated;
}
