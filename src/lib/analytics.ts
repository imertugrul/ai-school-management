/* Google Analytics 4 — utility functions */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export function pageview(url: string) {
  if (typeof window === 'undefined' || !window.gtag) return
  window.gtag('config', process.env.NEXT_PUBLIC_GA_ID!, { page_path: url })
}

export function trackEvent(
  action: string,
  category?: string,
  label?: string,
  value?: number,
) {
  if (typeof window === 'undefined' || !window.gtag) return
  window.gtag('event', action, {
    event_category: category,
    event_label:    label,
    value,
  })
}
