import { createContext, useContext } from "react";
import type { AlertColor } from "@mui/material";

export type AlertOptions = {
  message: string;
  severity?: AlertColor;
  duration?: number;
};

export type AlertContextValue = {
  showAlert: (options: AlertOptions | string) => void;
};

export const AlertContext = createContext<AlertContextValue | undefined>(
  undefined
);

export function useAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) {
    throw new Error("useAlert는 AlertProvider 하위에서만 사용할 수 있습니다.");
  }
  return ctx;
}
