import { useCallback, useState, type ReactNode } from "react";
import { Snackbar, Alert, type AlertColor } from "@mui/material";
import { AlertContext, type AlertOptions } from "./AlertContext";

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
        <Alert severity={severity} sx={{ width: "100%" }}>
          {message}
        </Alert>
      </Snackbar>
    </AlertContext.Provider>
  );
}
