# Data Fetching

Learn how to fetch data in Next.js App Router.

## fetch API

Next.js extends the native fetch API for data caching:

### Basic Fetch

```tsx
// Cache by default (SSG equivalent)
async function getData() {
  const res = await fetch('https://api.example.com/data')
  return res.json()
}

export default async function Page() {
  const data = await getData()
  return <div>{data.title}</div>
}
```

### No Store (SSR)

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

### Static with On-Demand Revalidation

```tsx
async function getData() {
  const res = await fetch('https://api.example.com/data', {
    next: { tags: ['posts'] }, // Tag for on-demand revalidation
  })
  return res.json()
}

// Revalidate with:
// revalidateTag('posts')
```

## Server Components

### Basic Data Fetching

```tsx
// app/blog/page.tsx
export default async function BlogPage() {
  const posts = await fetchPosts()
  
  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}

async function fetchPosts() {
  const res = await fetch('https://api.example.com/posts')
  if (!res.ok) throw new Error('Failed to fetch posts')
  return res.json()
}
```

### With Error Handling

```tsx
// app/blog/page.tsx
import { notFound } from 'next/navigation'

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug)
  
  if (!post) {
    notFound()
  }
  
  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  )
}
```

### With Loading State

```tsx
// app/blog/page.tsx
export default async function BlogPage() {
  const posts = await fetchPosts()
  
  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}

// app/blog/loading.tsx
export default function Loading() {
  return <div>Loading posts...</div>
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
  return { success: true }
}
```

```tsx
// app/page.tsx
import { createPost } from './actions'

export default function Page() {
  return (
    <form action={createPost}>
      <input name="title" placeholder="Post title" />
      <button type="submit">Create</button>
    </form>
  )
}
```

### Server Action with Return

```tsx
// app/actions.ts
'use server'

export async function submitForm(prevState: any, formData: FormData) {
  const email = formData.get('email')
  
  if (!email || !email.includes('@')) {
    return { error: 'Invalid email' }
  }
  
  await sendEmail(email)
  
  return { success: true, message: 'Email sent!' }
}
```

```tsx
// app/page.tsx
'use client'

import { useFormState } from 'react-dom'
import { submitForm } from './actions'

const initialState = { error: '', success: false }

export default function Form() {
  const [state, formAction] = useFormState(submitForm, initialState)
  
  return (
    <form action={formState}>
      <input name="email" type="email" />
      <button type="submit">Submit</button>
      {state.error && <p>{state.error}</p>}
      {state.success && <p>{state.message}</p>}
    </form>
  )
}
```

## Parallel & Sequential Fetching

### Sequential Fetching

```tsx
// Fetch one after another
export default async function Page({ params }: { params: { id: string } }) {
  const user = await fetchUser(params.id)
  const posts = await fetchUserPosts(params.id)
  
  return (
    <div>
      <h1>{user.name}</h1>
      <PostsList posts={posts} />
    </div>
  )
}
```

### Parallel Fetching

```tsx
// Fetch simultaneously
export default async function Page({ params }: { params: { id: string } }) {
  const userData = fetchUser(params.id)
  const postsData = fetchUserPosts(params.id)
  
  const [user, posts] = await Promise.all([userData, postsData])
  
  return (
    <div>
      <h1>{user.name}</h1>
      <PostsList posts={posts} />
    </div>
  )
}
```

### Suspense with Parallel

```tsx
import { Suspense } from 'react'

export default async function Page({ params }: { params: { id: string } }) {
  const userData = fetchUser(params.id)
  const postsData = fetchUserPosts(params.id)
  
  return (
    <div>
      <Suspense fallback={<UserSkeleton />}>
        <UserProfile userPromise={userData} />
      </Suspense>
      <Suspense fallback={<PostsSkeleton />}>
        <PostsList postsPromise={postsData} />
      </Suspense>
    </div>
  )
}

async function UserProfile({ userPromise }: { userPromise: Promise<User> }) {
  const user = await userPromise
  return <h1>{user.name}</h1>
}

async function PostsList({ postsPromise }: { postsPromise: Promise<Post[]> }) {
  const posts = await postsPromise
  return <ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>
}
```

## Revalidation

### Time-Based Revalidation

```tsx
export const revalidate = 60 // Revalidate every 60 seconds
// or
fetch('url', { next: { revalidate: 60 } })
```

### On-Demand Revalidation

```tsx
// By path
revalidatePath('/blog')
revalidatePath('/blog/[slug]', 'page')

// By tag
fetch('url', { next: { tags: ['posts'] } })
revalidateTag('posts')
```

## Best Practices

1. **Fetch in Server Components**: Default to fetching in server components
2. **Use parallel fetching**: Fetch independent data simultaneously
3. **Add loading states**: Use loading.tsx for better UX
4. **Handle errors**: Use error.tsx for error states
5. **Use revalidate wisely**: Balance between fresh data and performance

## Common Mistakes

❌ **Fetching in client components**

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

✅ **Fetching in server components**

```tsx
export default async function Component() {
  const res = await fetch('/api/data')
  const data = await res.json()
  
  return <div>{data}</div>
}
```

❌ **Not handling errors**

```tsx
export default async function Page() {
  const data = await fetch('url').then(res => res.json())
  return <div>{data}</div>
}
```

✅ **Error handling**

```tsx
export default async function Page() {
  try {
    const res = await fetch('url')
    if (!res.ok) throw new Error('Failed')
    const data = await res.json()
    return <div>{data}</div>
  } catch (e) {
    return <div>Error loading data</div>
  }
}
```
