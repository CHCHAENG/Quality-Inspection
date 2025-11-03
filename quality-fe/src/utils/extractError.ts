import axios from "axios";

interface ServerErrorPayload {
  message?: string;
  detail?: string;
}

export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ServerErrorPayload>(error)) {
    const status = error.response?.status;
    const data = error.response?.data;

    // 서버에서 내려주는 메시지
    const msg = data?.detail || data?.message;

    if (msg) return msg;

    // HTTP 상태 코드 기반 기본 메시지
    if (status) return `요청 실패 (HTTP ${status})`;
  }

  // AxiosError가 아니거나 message가 없는 경우
  return (error as any)?.message || "알 수 없는 오류가 발생했습니다.";
}
