/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['cdn.discordapp.com', 'politicsandwar.com'],
  },
  async rewrites() {
    return [
      {
        source: '/alliance/:path*',
        destination: '/alliance/:path*',
      },
    ];
  },
}

module.exports = nextConfig