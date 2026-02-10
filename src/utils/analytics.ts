export const trackEvent = (name: string, props?: Record<string, any>) => {
  if (typeof window === 'undefined') return;
  const win = window as any;

  if (typeof win.gtag === 'function') {
    win.gtag('event', name, props || {});
  }

  if (typeof win.plausible === 'function') {
    win.plausible(name, { props });
  }

  if (Array.isArray(win.dataLayer)) {
    win.dataLayer.push({ event: name, ...(props || {}) });
  }
};
