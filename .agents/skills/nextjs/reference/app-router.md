# App Router

Learn how to use the Next.js App Router for building modern React applications.

## Layouts

### Root Layout

The root layout is defined in `app/layout.tsx`:

```tsx
// app/layout.tsx
import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My App',
  description: 'Description of my app',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

### Nested Layouts

Layouts can be nested to share UI:

```tsx
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="dashboard">
      <Sidebar />
      <main>{children}</main>
    </div>
  )
}

// app/dashboard/page.tsx
export default function DashboardPage() {
  return <h1>Dashboard</h1>
}
```

### Route Groups

Use parentheses to group routes without affecting URLs:

```tsx
// app/(marketing)/layout.tsx
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <div className="marketing">{children}</div>
}

// app/(marketing)/about/page.tsx → /about
export default function About() {
  return <h1>About</h1>
}
```

## Pages

### Basic Page

```tsx
// app/page.tsx
export default function HomePage() {
  return <h1>Welcome to My App</h1>
}
```

### Page with Dynamic Data

```tsx
// app/blog/[slug]/page.tsx
interface Props {
  params: { slug: string }
}

export default async function BlogPost({ params }: Props) {
  const post = await getPost(params.slug)
  
  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  )
}
```

### Static Page (SSG)

```tsx
// app/about/page.tsx
// Automatically static if no dynamic data fetching

export default function AboutPage() {
  return <h1>About Us</h1>
}
```

## Loading States

### loading.tsx

Show loading UI while page is rendering:

```tsx
// app/blog/loading.tsx
export default function Loading() {
  return <div>Loading posts...</div>
}
```

### Suspense Boundary

Wrap components with Suspense:

```tsx
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PostList />
    </Suspense>
  )
}
```

## Error Handling

### error.tsx

Handle errors in a route segment:

```tsx
'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])
  
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
```

### not-found.tsx

Custom 404 page:

```tsx
// app/not-found.tsx
import Link from 'next/link'

export default function NotFound() {
  return (
    <div>
      <h2>Not Found</h2>
      <p>Could not find requested resource</p>
      <Link href="/">Return Home</Link>
    </div>
  )
}
```

### global-error.tsx

Global error boundary:

```tsx
'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  )
}
```

## Server vs Client Components

### Server Components (Default)

Server components run on the server:

```tsx
// app/page.tsx - Server Component by default
async function getData() {
  const res = await fetch('https://api.example.com/data')
  return res.json()
}

export default async function Page() {
  const data = await getData()
  
  return <div>{data.title}</div>
}
```

**When to use**:
- Fetch data
- Access backend resources
- Keep sensitive info on server
- Large dependencies on server

### Client Components

Use `'use client'` for interactive UI:

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

**When to use**:
- Interactivity (onClick, onChange)
- State and lifecycle (useState, useEffect)
- Browser-only APIs
- Custom hooks that depend on state/effects

### Passing Props to Client Components

```tsx
// Server Component
import ClientComponent from './ClientComponent'

export default function ServerComponent() {
  return <ClientComponent initialData={data} />
}

// Client Component
'use client'

export default function ClientComponent({ initialData }: { initialData: Data }) {
  const [data, setData] = useState(initialData)
  // ...
}
```

## Route Handlers

### Basic API Route

```tsx
// app/api/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ message: 'Hello' })
}

export async function POST(request: Request) {
  const body = await request.json()
  return NextResponse.json({ received: body })
}
```

### Dynamic Route Handler

```tsx
// app/api/users/[id]/route.ts
interface Props {
  params: { id: string }
}

export async function GET(request: Request, { params }: Props) {
  const user = await getUser(params.id)
  return NextResponse.json(user)
}

export async function DELETE(request: Request, { params }: Props) {
  await deleteUser(params.id)
  return NextResponse.json({ success: true })
}
```

### Query Parameters

```tsx
// app/api/search/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  
  const results = await search(query)
  return NextResponse.json(results)
}
```

## Middleware

### Basic Middleware

```tsx
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: '/admin/:path*',
}
```

### Conditional Middleware

```tsx
export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')
  
  if (!token && !isPublicRoute(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return NextResponse.next()
}
```

### Matcher

```tsx
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

## Data Fetching

### Fetch with Cache

```tsx
// Cache by default
async function getData() {
  const res = await fetch('https://api.example.com/data', {
    cache: 'force-cache', // default
  })
  return res.json()
}
```

### No Cache (SSR)

```tsx
async function getData() {
  const res = await fetch('https://api.example.com/data', {
    cache: 'no-store',
  })
  return res.json()
}
```

### ISR (Revalidate)

```tsx
async function getData() {
  const res = await fetch('https://api.example.com/data', {
    next: { revalidate: 60 }, // Revalidate every 60 seconds
  })
  return res.json()
}
```

### Parallel Data Fetching

```tsx
export default async function Page() {
  const data = await Promise.all([
    getUser(),
    getPosts(),
    getComments(),
  ])
  
  return (
    <div>
      <User user={data[0]} />
      <Posts posts={data[1]} />
    </div>
  )
}
```

## Server Actions

### Basic Server Action

```tsx
// app/actions.ts
'use server'

export async function createPost(formData: FormData) {
  const title = formData.get('title')
  
  await db.post.create({ title })
  revalidatePath('/blog')
}
```

```tsx
// app/page.tsx
import { createPost } from './actions'

export default function Page() {
  return (
    <form action={createPost}>
      <input name="title" />
      <button type="submit">Create</button>
    </form>
  )
}
```

### Server Action with Validation

```tsx
'use server'

import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export async function login(prevState: any, formData: FormData) {
  const validated = schema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }
  
  await authenticate(validated.data)
}
```

## Best Practices

1. **Use Server Components**: Default to server components
2. **Minimize Client Components**: Only use `'use client'` when needed
3. **Use loading/error states**: Improve UX
4. **Organize routes**: Use route groups
5. **Handle errors**: Implement error boundaries

## Common Mistakes

❌ **Using client components unnecessarily**

```tsx
// Unnecessary client component
'use client'

export default function Header() {
  return <header>My App</header>
}
```

✅ **Use server component**

```tsx
// Server component (default)
export default function Header() {
  return <header>My App</header>
}
```

❌ **Not handling loading states**

```tsx
// No loading state
export default async function Page() {
  const data = await fetchData()
  return <div>{data.content}</div>
}
```

✅ **Add loading.tsx**

```tsx
// app/loading.tsx
export default function Loading() {
  return <div>Loading...</div>
}
```

❌ **Fetching data in client components**

```tsx
'use client'

export default function Component() {
  const [data, setData] = useState([])
  
  useEffect(() => {
    fetch('/api/data').then(res => res.json()).then(setData)
  }, [])
  
  return <div>{data}</div>
}
```

✅ **Fetch in server component**

```tsx
export default async function Component() {
  const res = await fetch('/api/data')
  const data = await res.json()
  
  return <div>{data}</div>
}
```
