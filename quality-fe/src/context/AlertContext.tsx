// src/contexts/AlertContext.tsx
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { Snackbar, Alert, type AlertColor } from "@mui/material";

export type AlertOptions = {
  message: string;
  severity?: AlertColor;
  duration?: number;
};

type AlertContextValue = {
  showAlert: (options: AlertOptions | string) => void;
};

const AlertContext = createContext<AlertContextValue | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<AlertColor>("info");
  const [duration, setDuration] = useState(3000);

  const showAlert = useCallback((options: AlertOptions | string) => {
    if (typeof options === "string") {
      setMessage(options);
      setSeverity("info");
      setDuration(3000);
    } else {
      setMessage(options.message);
      setSeverity(options.severity ?? "info");
      setDuration(options.duration ?? 3000);
    }
    setOpen(true);
  }, []);

  // 🔹 Snackbar 자동 닫힘 핸들러
  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}

      <Snackbar
        open={open}
        autoHideDuration={duration}
        onClose={handleClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={severity} onClose={handleClose} sx={{ width: "100%" }}>
          {message}
        </Alert>
      </Snackbar>
    </AlertContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) {
    throw new Error("useAlert는 AlertProvider 하위에서만 사용할 수 있습니다.");
  }
  return ctx;
}
