export type ToastTone = 'success' | 'info' | 'warning' | 'danger';

export interface ToastItem {
  id: string;
  tone: ToastTone;
  message: string;
}

export type ToastAction = { type: 'add'; toast: ToastItem } | { type: 'remove'; id: string };

export const MAX_TOASTS = 3;

/** Danh sách thông báo nổi: giữ tối đa MAX_TOASTS cái mới nhất. */
export function toastReducer(state: ToastItem[], action: ToastAction): ToastItem[] {
  switch (action.type) {
    case 'add':
      return [...state, action.toast].slice(-MAX_TOASTS);
    case 'remove':
      return state.filter((t) => t.id !== action.id);
  }
}
