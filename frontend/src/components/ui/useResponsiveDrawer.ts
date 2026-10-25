import { useEffect, useState, type RefObject } from 'react';
import { useModalFocus } from './useModalFocus';

export function useResponsiveDrawer(ref: RefObject<HTMLElement>, open: boolean, onClose: () => void, breakpoint = 900) {
  const [mobile, setMobile] = useState(() => window.matchMedia(`(max-width: ${breakpoint}px)`).matches);
  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const sync = () => setMobile(media.matches);
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, [breakpoint]);
  useEffect(() => { if (ref.current) ref.current.inert = mobile && !open; }, [ref, mobile, open]);
  useModalFocus(ref, mobile && open, onClose);
  return mobile && open;
}
