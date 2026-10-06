import { useEffect } from 'react'

/** Sets document title / meta description (and canonical URL) for SPA routes. */
export function usePageMeta(title: string, description: string): void {
  useEffect(() => {
    const prevTitle = document.title
    document.title = title
    const ensure = (selector: string, create: () => HTMLElement) => document.head.querySelector(selector) ?? document.head.appendChild(create())
    const desc = ensure('meta[name="description"]', () => Object.assign(document.createElement('meta'), { name: 'description' }))
    const prevDesc = desc.getAttribute('content') ?? ''
    desc.setAttribute('content', description)
    const og = ensure('meta[property="og:title"]', () => {
      const m = document.createElement('meta')
      m.setAttribute('property', 'og:title')
      return m
    })
    og.setAttribute('content', title)
    const canonical = ensure('link[rel="canonical"]', () => Object.assign(document.createElement('link'), { rel: 'canonical' })) as HTMLLinkElement
    canonical.href = window.location.origin + window.location.pathname
    return () => {
      document.title = prevTitle
      desc.setAttribute('content', prevDesc)
    }
  }, [title, description])
}
