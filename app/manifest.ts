import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'בשתי ידיי',
    short_name: 'בשתי ידיי',
    description: 'שכר ועסק: רישום, חודש, מס ופעולות',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#12201F',
    theme_color: '#12201F',
    lang: 'he',
    dir: 'rtl',
    categories: ['productivity', 'finance'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
