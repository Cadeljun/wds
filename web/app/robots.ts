import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/admin',
          '/account',
          '/account/',
          '/dashboard',
          '/dashboard/',
          '/rider/',
          '/rider',
          '/order/',
          '/api/',
          '/auth/callback',
        ],
      },
    ],
    sitemap: 'https://wds.com.gh/sitemap.xml',
  }
}
