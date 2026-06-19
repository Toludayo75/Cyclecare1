import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import Toast from "@/components/Toast";

type ShowNotification = (message: string, duration?: number) => void;

const NotificationContext = createContext<{ show: ShowNotification } | null>(null);

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}

let nextId = 1;
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<{ id: number; message: string; duration?: number }[]>([]);

  const show: ShowNotification = useCallback((message: string, duration = 4000) => {
    const id = nextId++;
    setToasts((s) => [...s, { id, message, duration }]);
  }, []);

  const remove = useCallback((id: number) => {
    setToasts((s) => s.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {toasts.map((t) => (
        <Toast
          key={t.id}
          message={t.message}
          duration={t.duration}
          onClose={() => remove(t.id)}
        />
      ))}
    </NotificationContext.Provider>
  );
}
