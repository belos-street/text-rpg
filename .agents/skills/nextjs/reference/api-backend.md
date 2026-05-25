# API & Backend

Learn how to build APIs in Next.js.

## Route Handlers

### Basic GET

```tsx
// app/api/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ message: 'Hello World' })
}
```

### POST Request

```tsx
// app/api/users/route.ts
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  
  const user = await db.user.create({
    data: body,
  })
  
  return NextResponse.json(user, { status: 201 })
}
```

### Multiple Methods

```tsx
// app/api/users/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const users = await db.user.findMany()
  return NextResponse.json(users)
}

export async function POST(request: Request) {
  const body = await request.json()
  const user = await db.user.create({ data: body })
  return NextResponse.json(user, { status: 201 })
}
```

### Dynamic Route

```tsx
// app/api/users/[id]/route.ts
interface Props {
  params: { id: string }
}

export async function GET(request: Request, { params }: Props) {
  const user = await db.user.findUnique({
    where: { id: params.id },
  })
  
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  
  return NextResponse.json(user)
}

export async function PUT(request: Request, { params }: Props) {
  const body = await request.json()
  
  const user = await db.user.update({
    where: { id: params.id },
    data: body,
  })
  
  return NextResponse.json(user)
}

export async function DELETE(request: Request, { params }: Props) {
  await db.user.delete({
    where: { id: params.id },
  })
  
  return NextResponse.json({ success: true })
}
```

### Query Parameters

```tsx
// app/api/search/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const page = searchParams.get('page') || '1'
  
  const results = await searchProducts(query, { page: Number(page) })
  
  return NextResponse.json(results)
}
```

## Headers

### Reading Headers

```tsx
// app/api/route.ts
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const referer = request.headers.get('referer')
  
  return NextResponse.json({ authHeader, referer })
}
```

### Setting Headers

```tsx
// app/api/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const response = NextResponse.json({ message: 'Hello' })
  
  response.headers.set('X-Custom-Header', 'value')
  response.headers.set('Cache-Control', 's-maxage=3600')
  
  return response
}
```

### Response Headers

```tsx
// app/api/route.ts
export async function GET() {
  return NextResponse.json(
    { data: 'example' },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=3600',
      },
    }
  )
}
```

## Cookies

### Reading Cookies

```tsx
// app/api/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const token = request.cookies.get('token')
  const allCookies = request.cookies.getAll()
  
  if (!token) {
    return NextResponse.json({ error: 'No token' }, { status: 401 })
  }
  
  return NextResponse.json({ token: token.value })
}
```

### Setting Cookies

```tsx
// app/api/login/route.ts
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  
  const response = NextResponse.json({ success: true })
  
  response.cookies.set('token', 'abc123', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  })
  
  return response
}
```

### Deleting Cookies

```tsx
// app/api/logout/route.ts
import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ success: true })
  
  response.cookies.set('token', '', {
    expires: new Date(0),
  })
  
  return response
}
```

## Server Actions

### Basic Action

```tsx
// app/actions.ts
'use server'

export async function createPost(formData: FormData) {
  const title = formData.get('title')
  const content = formData.get('content')
  
  await db.post.create({
    data: { title: String(title), content: String(content) },
  })
  
  revalidatePath('/posts')
  
  return { success: true }
}
```

### Action with Validation

```tsx
// app/actions.ts
'use server'

import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  age: z.number().min(18),
})

export async function registerUser(prevState: any, formData: FormData) {
  const validated = schema.safeParse({
    email: formData.get('email'),
    name: formData.get('name'),
    age: Number(formData.get('age')),
  })
  
  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors,
    }
  }
  
  await db.user.create({ data: validated.data })
  
  return { success: true }
}
```

### Action with Auth Check

```tsx
// app/actions.ts
'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

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
  
  revalidatePath('/posts')
}
```

### Action Returning Data

```tsx
// app/actions.ts
'use server'

export async function getUserData(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { posts: true },
  })
  
  return user
}
```

```tsx
// app/page.tsx
import { getUserData } from './actions'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

export default async function Page() {
  const session = await getServerSession(authOptions)
  const userData = await getUserData(session.user.id)
  
  return <div>{userData.name}</div>
}
```

## Request Body Types

### JSON

```tsx
export async function POST(request: Request) {
  const body = await request.json()
  const { name, email } = body
  
  // ...
}
```

### Form Data

```tsx
export async function POST(request: Request) {
  const formData = await request.formData()
  const name = formData.get('name')
  const email = formData.get('email')
  
  // ...
}
```

### Type-Safe Request

```tsx
import { z } from 'zod'

const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
})

export async function POST(request: Request) {
  const body = await request.json()
  const user = UserSchema.parse(body)
  
  // user is type-safe now
}
```

## Error Handling

### API Errors

```tsx
// app/api/users/[id]/route.ts
export async function GET(request: Request, { params }: Props) {
  try {
    const user = await db.user.findUnique({
      where: { id: params.id },
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Validation Errors

```tsx
export async function POST(request: Request) {
  const body = await request.json()
  
  if (!body.email || !body.name) {
    return NextResponse.json(
      { error: 'Missing required fields', fields: ['email', 'name'] },
      { status: 400 }
    )
  }
  
  // ...
}
```

## CORS

### Basic CORS

```tsx
// app/api/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ message: 'Hello' }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
```

## Streaming

### Streaming Response

```tsx
// app/api/stream/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < 10; i++) {
        controller.enqueue(encoder.encode(`data: ${i}\n\n`))
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      controller.close()
    },
  })
  
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  })
}
```

## Best Practices

1. **Validate input**: Always validate incoming data
2. **Use proper status codes**: 200, 201, 400, 401, 404, 500
3. **Handle errors**: Try-catch and return proper errors
4. **Use Server Actions**: For form submissions
5. **Secure endpoints**: Check authentication

## Common Mistakes

❌ **Not validating input**

```tsx
export async function POST(request: Request) {
  const { email } = await request.json()
  await db.user.create({ email }) // No validation!
}
```

✅ **Validate with Zod**

```tsx
const schema = z.object({
  email: z.string().email(),
})

export async function POST(request: Request) {
  const { email } = schema.parse(await request.json())
  await db.user.create({ email })
}
```

❌ **Exposing sensitive data**

```tsx
export async function GET() {
  const users = await db.user.findMany()
  return NextResponse.json(users) // Passwords exposed!
}
```

✅ **Select specific fields**

```tsx
export async function GET() {
  const users = await db.user.findMany({
    select: { id: true, email: true, name: true },
  })
  return NextResponse.json(users)
}
```
