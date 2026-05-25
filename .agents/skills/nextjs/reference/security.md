# Security

Learn how to secure your Next.js applications.

## Authentication

### NextAuth.js Setup

```tsx
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GitHubProvider from 'next-auth/providers/github'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const user = await verifyUser(credentials.email, credentials.password)
        if (user) return user
        return null
      }
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

### Using Session in Server Components

```tsx
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

export default async function ServerComponent() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }
  
  return <div>Welcome, {session.user.email}</div>
}
```

### Using Session in Client Components

```tsx
'use client'

import { useSession, signIn, signOut } from 'next-auth/react'

export function AuthButton() {
  const { data: session } = useSession()
  
  if (session) {
    return (
      <button onClick={() => signOut()}>
        Sign out
      </button>
    )
  }
  
  return (
    <button onClick={() => signIn()}>
      Sign in
    </button>
  )
}
```

## Authorization (RBAC)

### Role-Based Access

```tsx
// lib/auth.ts
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

export type Role = 'admin' | 'user' | 'guest'

export async function getCurrentRole(): Promise<Role> {
  const session = await getServerSession(authOptions)
  return session?.user?.role || 'guest'
}

export async function requireRole(allowedRoles: Role[]) {
  const role = await getCurrentRole()
  
  if (!allowedRoles.includes(role)) {
    throw new Error('Unauthorized')
  }
  
  return role
}
```

### Protecting Routes

```tsx
// app/admin/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  
  if (session?.user?.role !== 'admin') {
    redirect('/unauthorized')
  }
  
  return <h1>Admin Dashboard</h1>
}
```

### Component-Level Protection

```tsx
// components/AdminOnly.tsx
'use client'

import { useSession } from 'next-auth/react'

export function AdminOnly({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  
  if (session?.user?.role !== 'admin') {
    return null
  }
  
  return <>{children}</>
}
```

## XSS Prevention

### Sanitize HTML

```tsx
import DOMPurify from 'isomorphic-dompurify'

// In Server Component
export default async function BlogPost({ content }: { content: string }) {
  const sanitized = DOMPurify.sanitize(content)
  
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />
}
```

### Avoid dangerouslySetInnerHTML

```tsx
// ❌ Dangerous - can lead to XSS
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ Safe - render as text
<div>{userInput}</div>

// ✅ Safe - sanitize first
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
```

### Content Security Policy

```tsx
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' blob: data: https:",
              "font-src 'self'",
              "connect-src 'self' https://api.example.com",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

## CSRF Protection

### NextAuth CSRF

NextAuth.js automatically handles CSRF tokens:

```tsx
// Automatic CSRF protection
<form action={serverAction}>
  {/* NextAuth generates and validates CSRF token */}
  <button type="submit">Submit</button>
</form>
```

### Custom CSRF for API Routes

```tsx
// app/api/protected/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function POST(request: NextRequest) {
  const csrfToken = request.headers.get('x-csrf-token')
  const session = await getServerSession()
  
  if (!csrfToken || !session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Process request
  return NextResponse.json({ success: true })
}
```

## Server Actions Security

### Validate Input

```tsx
'use server'

import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  age: z.number().min(13).max(120),
})

export async function updateUser(prevState: any, formData: FormData) {
  const validated = schema.safeParse({
    email: formData.get('email'),
    name: formData.get('name'),
    age: Number(formData.get('age')),
  })
  
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }
  
  await db.user.update({
    where: { email: validated.data.email },
    data: validated.data,
  })
  
  return { success: true }
}
```

### Check Authentication

```tsx
'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function deletePost(postId: string) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    throw new Error('Unauthorized')
  }
  
  const post = await db.post.findUnique({ where: { id: postId } })
  
  if (post.authorId !== session.user.id && session.user.role !== 'admin') {
    throw new Error('Forbidden')
  }
  
  await db.post.delete({ where: { id: postId } })
}
```

### Use Server Only

```tsx
// ❌ Don't Actions expose API endpoints unnecessarily
<button onClick={() => fetch('/api/delete', { method: 'DELETE' })}>Delete</button>

// ✅ Use Server Actions
<button formAction={deleteItem}>Delete</button>
```

## API Route Security

### Validate Request Method

```tsx
// app/api/users/route.ts
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const session = await getServerSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const users = await db.user.findMany()
  return NextResponse.json(users)
}

export async function POST(request: Request) {
  const session = await getServerSession()
  
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  const body = await request.json()
  const user = await db.user.create({ data: body })
  return NextResponse.json(user)
}
```

### Rate Limiting

```tsx
// lib/rate-limit.ts
import { LRUCache } from 'least-recent'

const cache = new LRUCache<string, number>({ max: 100 })

export function rateLimit(key: string, limit: number = 10, window: number = 60) {
  const now = Date.now()
  const windowStart = now - window * 1000
  
  const timestamps = cache.get(key) || []
  const recentTimestamps = timestamps.filter(ts => ts > windowStart)
  
  if (recentTimestamps.length >= limit) {
    throw new Error('Rate limit exceeded')
  }
  
  cache.set(key, [...recentTimestamps, now])
}

// Usage in API route
export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  
  try {
    rateLimit(`api:${ip}`, 10, 60)
  } catch {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  
  // Process request...
}
```

### Validate Headers

```tsx
// app/api/webhook/route.ts
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: Request) {
  const signature = request.headers.get('x-hub-signature-256')
  const body = await request.text()
  
  const expectedSignature = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET!)
    .update(body)
    .digest('hex')
  
  if (signature !== `sha256=${expectedSignature}`) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }
  
  const event = request.headers.get('x-github-event')
  // Process webhook...
  return NextResponse.json({ received: true })
}
```

## Environment Variables Security

### Never Expose Secrets

```env
# .env.local - Add to .gitignore
DATABASE_URL=postgres://user:password@localhost:5432/mydb
API_SECRET=your-secret-key
NEXTAUTH_SECRET=your-nextauth-secret
```

```tsx
// Access in code
const secret = process.env.NEXTAUTH_SECRET!
const dbUrl = process.env.DATABASE_URL!
```

### Validate Environment Variables

```tsx
// lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url().optional(),
  API_KEY: z.string().min(1),
})

export const env = envSchema.parse(process.env)
```

## Best Practices

1. **Use HTTPS**: Always use HTTPS in production
2. **Validate input**: Always validate user input
3. **Sanitize output**: Prevent XSS attacks
4. **Use Authentication**: NextAuth.js recommended
5. **Implement RBAC**: Role-based access control
6. **Secure headers**: Add security headers
7. **Rate limiting**: Prevent abuse
8. **Environment variables**: Never commit secrets

## Common Mistakes

❌ **Storing secrets in client-side code**

```tsx
// ❌ Exposed to client
const API_KEY = 'sk-1234567890'

export default function Page() {
  fetch('https://api.com', { headers: { Authorization: API_KEY } })
}
```

✅ **Use environment variables**

```tsx
// ✅ Server-side only
const API_KEY = process.env.API_KEY!

export async function POST() {
  fetch('https://api.com', { headers: { Authorization: API_KEY } })
}
```

❌ **Not validating user input**

```tsx
// ❌ Vulnerable to injection
export async function POST(request: Request) {
  const { username } = await request.json()
  await db.query(`SELECT * FROM users WHERE name = '${username}'`)
}
```

✅ **Validate input**

```tsx
// ✅ Using Zod
const schema = z.object({
  username: z.string().min(1).max(100),
})

export async function POST(request: Request) {
  const { username } = schema.parse(await request.json())
  await db.user.findMany({ where: { name: username } })
}
```

❌ **Exposing sensitive data in API responses**

```tsx
// ❌ Password hash exposed
export async function GET() {
  const users = await db.user.findMany()
  return NextResponse.json(users) // Includes passwordHash!
}
```

✅ **Select specific fields**

```tsx
// ✅ Only return safe fields
export async function GET() {
  const users = await db.user.findMany({
    select: { id: true, email: true, name: true }
  })
  return NextResponse.json(users)
}
```
