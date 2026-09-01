/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://stagein.app',
  generateRobotsTxt: true,
  exclude: ['/kesfet', '/mesajlar', '/mesajlar/*'],
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/', disallow: ['/kesfet', '/mesajlar'] },
    ],
  },
}
