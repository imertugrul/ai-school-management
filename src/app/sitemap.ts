import type { MetadataRoute } from 'next'

const BASE = 'https://www.schoolproai.com'

const MODULES = [
  'teacher', 'student', 'parent',
  'ai-planner', 'test-system', 'gradebook',
  'attendance', 'analytics', 'communication',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,                  lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE}/login`,       lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/signup`,      lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/privacy`,     lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ]

  const featurePages: MetadataRoute.Sitemap = MODULES.map(module => ({
    url: `${BASE}/features/${module}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.9,
  }))

  return [...staticPages, ...featurePages]
}
