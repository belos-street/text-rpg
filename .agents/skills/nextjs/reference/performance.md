# Performance

Learn how to optimize your Next.js application performance.

## Image Optimization

### Basic Usage

```tsx
import Image from 'next/image'

export default function Page() {
  return (
    <Image
      src="/hero.jpg"
      alt="Hero image"
      width={1200}
      height={600}
    />
  )
}
```

### Responsive Images

```tsx
<Image
  src="/hero.jpg"
  alt="Hero"
  sizes="100vw"
  style={{ width: '100%', height: 'auto' }}
  fill
/>
```

```tsx
<Image
  src="/product.jpg"
  alt="Product"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  fill
/>
```

### Priority Loading

```tsx
<Image
  src="/hero.jpg"
  alt="Hero"
  priority // Load immediately
  sizes="100vw"
  fill
/>
```

### Placeholders

```tsx
<Image
  src="/photo.jpg"
  alt="Photo"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..." // Base64 blur hash
  width={800}
  height={600}
/>
```

### Remote Images

```tsx
// next.config.js
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
}
```

## Font Optimization

### Google Fonts

```tsx
// app/layout.tsx
import { Inter, Merriweather } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const merriweather = Merriweather({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-merriweather',
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${merriweather.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

### Local Fonts

```tsx
// app/layout.tsx
import localFont from 'next/font/local'

const myFont = localFont({
  src: './fonts/my-font.woff2',
  display: 'swap',
  variable: '--font-my-font',
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={myFont.variable}>
      <body>{children}</body>
    </html>
  )
}
```

### Using Font Variables

```tsx
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)'],
        serif: ['var(--font-merriweather)'],
      },
    },
  },
}
```

## Code Splitting

### Automatic Splitting

Next.js automatically splits code per route:

```
app/
├── layout.tsx      → layout component
├── page.tsx        → page component  
├── about/
│   └── page.tsx   → about bundle
└── blog/
    └── page.tsx   → blog bundle
```

### Dynamic Imports

```tsx
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(
  () => import('./HeavyComponent'),
  {
    loading: () => <p>Loading...</p>,
    ssr: false, // Disable SSR for this component
  }
)

export default function Page() {
  return (
    <div>
      <h1>My Page</h1>
      <HeavyComponent />
    </div>
  )
}
```

### Named Exports

```tsx
const { HeavyComponent } = dynamic(
  () => import('./components').then(mod => mod),
  { ssr: false }
)
```

## Prefetching

### Link Prefetching

```tsx
import Link from 'next/link'

export default function Page() {
  return (
    <Link href="/about" prefetch>
      About
    </Link>
  )
}
```

### Disable Prefetching

```tsx
<Link href="/about" prefetch={false}>
  About
</Link>
```

### Programmatic Prefetch

```tsx
'use client'

import { useRouter } from 'next/navigation'

export function PrefetchExample() {
  const router = useRouter()
  
  const handleHover = () => {
    router.prefetch('/about')
  }
  
  return (
    <Link href="/about" onMouseEnter={handleHover}>
      About
    </Link>
  )
}
```

## Lazy Loading

### Lazy Load Components

```tsx
import dynamic from 'next/dynamic'

const Map = dynamic(() => import('../components/Map'), {
  loading: () => <MapSkeleton />,
})

export default function Page() {
  return (
    <div>
      <h1>Contact</h1>
      <Map />
    </div>
  )
}
```

### Lazy Load Libraries

```tsx
import { useState, useEffect } from 'react'

export function useIntersectionObserver() {
  const [intersectionObserver, setIntersectionObserver] = useState<any>()
  
  useEffect(() => {
    import('intersection-observer').then(mod => {
      setIntersectionObserver(mod)
    })
  }, [])
  
  return intersectionObserver
}
```

### Lazy Load Images (Below Fold)

```tsx
<Image
  src="/below-fold.jpg"
  alt="Below fold"
  loading="lazy"
  width={400}
  height={300}
/>
```

## Bundle Analysis

### Analyze Bundle

```bash
npm run build
ANALYZE=true npm run build
```

```js
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({})
```

## Caching

### Route Segment Cache

```tsx
export const dynamic = 'force-static' // Always static
export const revalidate = 60 // Revalidate every 60 seconds
export const dynamic = 'force-dynamic' // Always dynamic
```

### Fetch Cache

```tsx
fetch('url', { cache: 'force-cache' }) // Default, cached forever
fetch('url', { cache: 'no-store' }) // Never cache
fetch('url', { next: { revalidate: 60 } }) // ISR
fetch('url', { next: { tags: ['posts'] } }) // On-demand
```

## Measuring Performance

### Web Vitals

```tsx
// app/components/WebVitals.tsx
'use client'

import { useReportWebVitals } from 'next/web-vitals'

export function WebVitals() {
  useReportWebVitals((metric) => {
    console.log(metric)
  })
  
  return null
}
```

### Core Web Vitals

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | < 2.5s | 2.5s - 4s | > 4s |
| FID | < 100ms | 100ms - 300ms | > 300ms |
| CLS | < 0.1 | 0.1 - 0.25 | > 0.25 |

## Best Practices

1. **Use Image component**: Automatic optimization
2. **Use next/font**: Zero layout shift
3. **Lazy load heavy components**: Reduce initial bundle
4. **Use proper sizes**: Optimize images for viewport
5. **Preload critical resources**: Use Link prefetch
6. **Monitor Core Web Vitals**: Track performance

## Common Mistakes

❌ **Using img tag**

```tsx
<img src="/hero.jpg" alt="Hero" />
```

✅ **Use next/image**

```tsx
<Image src="/hero.jpg" alt="Hero" fill priority />
```

❌ **No font optimization**

```tsx
// In HTML head
<link href="https://fonts.googleapis.com/..." rel="stylesheet" />
```

✅ **Use next/font**

```tsx
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'] })
```

❌ **Large images**

```tsx
<Image src="/large.jpg" width={2000} height={2000} />
```

✅ **Proper sizes**

```tsx
<Image src="/large.jpg" width={800} height={600} sizes="50vw" />
```

❌ **Blocking render**

```tsx
// Heavy component blocking page render
import Heavy from './Heavy'

export default function Page() {
  return <Heavy />
}
```

✅ **Lazy load**

```tsx
const Heavy = dynamic(() => import('./Heavy'), {
  loading: () => <p>Loading...</p>,
})

export default function Page() {
  return <Heavy />
}
```
