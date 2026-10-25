import { useEffect, useRef, type RefObject } from 'react';

/** Focus containment, background isolation and focus restoration for existing dialogs. */
export function useModalFocus(ref: RefObject<HTMLElement>, open: boolean, onClose: () => void) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    const isolated: Array<[HTMLElement, boolean]> = [];
    let branch: HTMLElement = dialog;
    while (branch.parentElement && branch.parentElement !== document.documentElement) {
      for (const node of Array.from(branch.parentElement.children)) {
        if (node !== branch && node instanceof HTMLElement && !['SCRIPT', 'STYLE'].includes(node.tagName)) {
          isolated.push([node, node.inert]); node.inert = true;
        }
      }
      branch = branch.parentElement;
    }
    document.body.style.overflow = 'hidden';
    const controls = () => Array.from(dialog.querySelectorAll<HTMLElement>('a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')).filter(node => node.getClientRects().length && !node.closest('[inert]'));
    const timer = window.setTimeout(() => (dialog.querySelector<HTMLElement>('[data-autofocus]') || controls()[0] || dialog).focus(), 0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (dialog.closest('[inert]')) return;
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current(); }
      if (event.key !== 'Tab') return;
      const all = controls(); const first = all[0]; const last = all[all.length - 1];
      if (!first) { event.preventDefault(); dialog.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      isolated.forEach(([node, inert]) => { node.inert = inert; });
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [open, ref]);
}
