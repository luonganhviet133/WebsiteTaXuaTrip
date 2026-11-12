import { useEffect, useRef } from 'react';

/**
 * Hành vi chung của hộp thoại: đóng bằng Esc, khóa cuộn trang, đưa tiêu điểm vào hộp thoại
 * và trả lại chỗ cũ khi đóng. Giữ tiêu điểm trong hộp thoại (focus trap) làm ở U6.
 */
export function useDialog(open: boolean, onClose: () => void) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      previous?.focus?.();
    };
  }, [open]);

  return panelRef;
}
