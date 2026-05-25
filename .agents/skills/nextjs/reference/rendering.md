# Rendering

Learn about different rendering patterns in Next.js.

## Server Components

### Default Behavior

In App Router, all components are Server Components by default:

```tsx
// app/page.tsx - Server Component
export default async function Page() {
  const data = await fetchData()
  
  return <div>{data.content}</div>
}
```

### When to Use

- Fetching data
- Accessing backend resources directly
- Keeping sensitive information on server (API keys, tokens)
- Large dependencies that don't need client-side JS

### Cannot Use in Server Components

```tsx
// These don't work in Server Components:
- useState
- useEffect
- useRef
- onClick, onChange (event handlers)
- browser-only APIs
```

## Client Components

### Basic Usage

Add `'use client'` at the top of the file:

```tsx
'use client'

import { useState } from 'react'

export default function Counter() {
  const [count, setCount] = useState(0)
  
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  )
}
```

### When to Use

- Interactivity (onClick, onChange)
- State and lifecycle (useState, useEffect)
- Browser-only APIs
- Custom hooks that use state/effects

### Mixing Server and Client

```tsx
// Server Component (parent)
import ClientComponent from './ClientComponent'

export default function Page({ data }: { data: Data }) {
  return <ClientComponent initialData={data} />
}

// Client Component (child)
'use client'

import { useState } from 'react'

export default function ClientComponent({ initialData }: { initialData: Data }) {
  const [data, setData] = useState(initialData)
  
  return <div>{data.content}</div>
}
```

## Streaming

### Suspense Boundary

Wrap components with Suspense to enable streaming:

```tsx
import { Suspense } from 'react'

export default function Page() {
  return (
    <div>
      <Suspense fallback={<Loading />}>
        <SlowComponent />
      </Suspense>
      <FastComponent />
    </div>
  )
}
```

### Streaming with Data Fetching

```tsx
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense fallback={<PostListSkeleton />}>
      <PostList />
    </Suspense>
  )
}

async function PostList() {
  const posts = await fetchPosts() // This can stream
  return <ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>
}
```

### Loading.tsx

Automatically wraps pages in Suspense:

```tsx
// app/blog/loading.tsx
export default function Loading() {
  return (
    <div>
      <p>Loading...</p>
    </div>
  )
}
```

### Multiple Suspense

```tsx
// app/page.tsx
import { Suspense } from 'react'

export default function Page() {
  return (
    <main>
      <Suspense fallback={<HeaderSkeleton />}>
        <Header />
      </Suspense>
      
      <div className="flex">
        <Suspense fallback={<SidebarSkeleton />}>
          <Sidebar />
        </Suspense>
        
        <Suspense fallback={<ContentSkeleton />}>
          <Content />
        </Suspense>
      </div>
    </main>
  )
}
```

## Partial Prerendering (PPR)

Partial Prerendering combines static and dynamic content:

### Basic Usage

```tsx
// Enable in next.config.js
// experimental: { ppr: true }

import { Suspense } from 'react'

export default function Page() {
  return (
    <div>
      {/* Static shell rendered at build time */}
      <Header />
      <Navigation />
      
      {/* Dynamic content streamed */}
      <Suspense fallback={<FeedSkeleton />}>
        <Feed />
      </Suspense>
      
      <Suspense fallback={<SidebarSkeleton />}>
        <Sidebar />
      </Suspense>
    </div>
  )
}
```

### Static + Dynamic Mix

```tsx
// app/blog/[slug]/page.tsx
export default async function BlogPost({ params }: { params: { slug: string } }) {
  // This part can be static
  const post = await getPost(params.slug)
  
  // This part is dynamic (user-specific)
  const recommendations = await getRecommendations()
  
  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
      <Suspense fallback={<RecSkeleton />}>
        <Recommendations data={recommendations} />
      </Suspense>
    </article>
  )
}
```

## Dynamic Rendering

### Force Dynamic

```tsx
export const dynamic = 'force-dynamic'

export default async function Page() {
  const data = await fetchData() // Runs on every request
  return <div>{data}</div>
}
```

### Runtime

```tsx
export const dynamic = 'force-dynamic'

// or use runtime
export const runtime = 'nodejs' // or 'edge'
```

### Request-Based Data

```tsx
// Automatically dynamic when using:
- cookies()
- headers()
- searchParams

export default async function Page({ searchParams }: { searchParams: { q: string } }) {
  // This page is dynamic because it uses searchParams
  const results = await search(searchParams.q)
  return <div>{results}</div>
}
```

## Static Rendering

### Default Static

Pages without dynamic data are automatically static:

```tsx
// app/about/page.tsx
export default function AboutPage() {
  return (
    <div>
      <h1>About Us</h1>
      <p>This is a static page</p>
    </div>
  )
}
```

### Force Static

```tsx
export const dynamic = 'force-static'

// or
export const dynamic = 'error' // Error if dynamic data detected
```

### Static with ISR

```tsx
export const revalidate = 60 // Regenerate every 60 seconds
```

## Best Practices

1. **Default to Server Components**: Most components should be server components
2. **Minimize client bundle**: Only use client components when needed
3. **Use Suspense**: For progressive loading
4. **Consider PPR**: For mixed static/dynamic content

## Common Mistakes

❌ **Making entire page a client component**

```tsx
'use client'

export default function Page() {
  const data = useData() // Fetching on client
  return <div>{data}</div>
}
```

✅ **Use server components**

```tsx
export default async function Page() {
  const data = await fetchData() // Server-side fetch
  return <div>{data}</div>
}
```

❌ **Not using Suspense for slow data**

```tsx
export default async function Page() {
  const slowData = await fetchSlowData() // Blocks entire page
  return <div>{slowData}</div>
}
```

✅ **Use Suspense**

```tsx
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <SlowComponent />
    </Suspense>
  )
}
```
