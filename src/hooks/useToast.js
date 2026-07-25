import { useCallback, useEffect, useRef, useState } from "react";

export default function useToast(autoHideMs = 3000) {
  const [toast, setToast] = useState({ show: false, type: "info", message: "" });
  const timerRef = useRef(null);

  const notify = useCallback(
    (type, message) => {
      setToast({ show: true, type, message });
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, autoHideMs);
    },
    [autoHideMs]
  );

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast((prev) => ({ ...prev, show: false }));
  }, []);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  return { toast, notify, dismiss };
}
