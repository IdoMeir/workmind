import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'WorkMind',
    short_name: 'WorkMind',
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
        src: '/api/icons/192',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/api/icons/512',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/api/icons/512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
