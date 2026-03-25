import type { MetadataRoute } from 'next'

const BASE = 'https://www.schoolproai.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: [
          '/manage-panel/',
          '/staff-panel/',
          '/teacher/',
          '/student/',
          '/parent/',
          '/api/',
          '/_next/',
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  }
}
