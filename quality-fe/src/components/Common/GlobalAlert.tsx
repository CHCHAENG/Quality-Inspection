import { Snackbar, Alert } from "@mui/material";

export interface GlobalAlertProps {
  open: boolean;
  message: string;
  severity?: "success" | "info" | "warning" | "error";
  onClose: () => void;
  duration?: number;
  vertical?: "top" | "bottom";
  horizontal?: "center" | "left" | "right";
}

export default function GlobalAlert({
  open,
  message,
  severity = "info",
  onClose,
  duration = 3000,
  vertical = "top",
  horizontal = "center",
}: GlobalAlertProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={onClose}
      anchorOrigin={{ vertical, horizontal }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        sx={{ width: "100%" }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
