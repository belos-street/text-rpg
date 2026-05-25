# Basics

Learn the fundamental concepts of Next.js.

## Rendering Strategies

### SSR (Server-Side Rendering)

Server-Side Rendering renders pages on the server for each request:

```tsx
// This page is rendered on each request
export const dynamic = 'force-dynamic'

export default async function Page() {
  const data = await fetchData() // Runs on server
  return <div>{data.content}</div>
}
```

**Use cases**: Personalized content, real-time data, SEO-critical pages

### SSG (Static Site Generation)

Static Site Generation renders pages at build time:

```tsx
// This page is built once and served as static HTML
export default async function Page() {
  const data = await fetchData()
  return <div>{data.content}</div>
}

// Force static generation
export const dynamic = 'force-static'
```

**Use cases**: Marketing pages, blog posts, documentation

### ISR (Incremental Static Regeneration)

ISR updates static pages in the background:

```tsx
// Revalidate this page every 60 seconds
export const revalidate = 60

export default async function Page() {
  const data = await fetchData()
  return <div>{data.content}</div>
}
```

**Use cases**: E-commerce product pages, CMS content

## App Router vs Pages Router

### App Router (Recommended)

- Uses React Server Components
- Layouts are nested by default
- Data fetching with async/await
- Route groups with parentheses
- Server Components by default

```tsx
// app/page.tsx
export default function Page() {
  return <h1>Welcome</h1>
}
```

### Pages Router (Legacy)

- Uses getServerSideProps, getStaticProps
- Single layout for all pages
- Data fetching with special functions
- API routes in /pages/api

```tsx
// pages/index.tsx
export async function getStaticProps() {
  const data = await fetchData()
  return { props: { data } }
}

export default function Page({ data }) {
  return <h1>{data.title}</h1>
}
```

### Comparison

| Feature | App Router | Pages Router |
|---------|-----------|--------------|
| Rendering | Server Components | SSR/SSG |
| Data Fetching | async/await | getStaticProps |
| Layouts | Nested layouts | Single _app.js |
| Routing | File-based | File-based |
| Server Actions | Supported | Not supported |

## Directory Structure

```
my-app/
├── app/                    # App Router
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   ├── globals.css         # Global styles
│   ├── (marketing)/        # Route group
│   │   ├── about/
│   │   │   └── page.tsx
│   │   └── contact/
│   │       └── page.tsx
│   ├── blog/
│   │   ├── page.tsx        # /blog
│   │   └── [slug]/
│   │       └── page.tsx    # /blog/:slug
│   └── api/
│       └── route.ts        # /api/* API routes
├── public/                 # Static files
├── src/                   # Optional src directory
├── pages/                 # Pages Router (optional)
│   ├── _app.tsx
│   ├── _document.tsx
│   └── index.tsx
├── components/            # React components
├── lib/                   # Utility functions
├── styles/                # CSS files
├── package.json
├── next.config.js
└── tsconfig.json
```

## Routing Fundamentals

### Basic Routes

```tsx
// app/page.tsx → /
export default function Home() {
  return <h1>Home Page</h1>
}

// app/about/page.tsx → /about
export default function About() {
  return <h1>About Page</h1>
}

// app/contact/page.tsx → /contact
export default function Contact() {
  return <h1>Contact Page</h1>
}
```

### Dynamic Routes

```tsx
// app/blog/[slug]/page.tsx → /blog/:slug
interface Props {
  params: { slug: string }
}

export default async function BlogPost({ params }: Props) {
  const { slug } = params
  const post = await getPost(slug)
  
  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  )
}
```

### Optional Parameters

```tsx
// app/blog/[[...slug]]/page.tsx → /blog, /blog/a, /blog/a/b
interface Props {
  params: { slug?: string[] }
}

export default async function Blog({ params }: Props) {
  const slug = params.slug
  if (!slug) return <h1>Blog Home</h1>
  
  return <h1>Post: {slug.join('/')}</h1>
}
```

### Route Groups

```tsx
// (marketing)/layout.tsx → Doesn't affect URL
// (marketing)/about/page.tsx → /about
// (marketing)/contact/page.tsx → /contact

// (dashboard)/layout.tsx
// (dashboard)/analytics/page.tsx → /analytics
// (dashboard)/settings/page.tsx → /settings
```

### Dynamic Segments

```tsx
// app/users/[id]/page.tsx → /users/1, /users/2
interface Props {
  params: { id: string }
}

export default async function UserProfile({ params }: Props) {
  const user = await fetchUser(params.id)
  return <div>{user.name}</div>
}

// app/products/[category]/[id]/page.tsx → /products/electronics/123
interface Props {
  params: { category: string; id: string }
}

export default async function Product({ params }: Props) {
  const { category, id } = params
  // ...
}
```

## Best Practices

1. **Use App Router**: For new projects
2. **Choose right rendering**: SSG for static, SSR for dynamic
3. **Use ISR**: For frequently updated static content
4. **Organize routes**: Use route groups for related pages
5. **Keep layouts simple**: Only share necessary UI

## Common Mistakes

❌ **Using SSR when not needed**

```tsx
// Unnecessarily using SSR for static content
export default async function About() {
  const data = await fetch('/api/about') // ❌ Unnecessary
  return <div>{data.content}</div>
}
```

✅ **Using SSG for static content**

```tsx
// Static content - built at build time
export default function About() {
  return <div>About Us</div> // ✅ Automatically SSG
}
```

❌ **Not handling loading states**

```tsx
// No loading state
export default async function Blog() {
  const posts = await fetchPosts()
  return <PostList posts={posts} />
}
```

✅ **Using loading.tsx**

```tsx
// app/blog/loading.tsx
export default function Loading() {
  return <div>Loading posts...</div>
}
```
