# Deployment

Learn how to deploy Next.js applications to various platforms.

## Vercel (Recommended)

### Deploy from Git

1. Push your code to GitHub/GitLab/Bitbucket
2. Import project in Vercel
3. Vercel auto-detects Next.js
4. Click Deploy

### Deploy from CLI

```bash
npm i -g vercel
vercel
```

### Environment Variables

In Vercel Dashboard:
- Project → Settings → Environment Variables
- Add variables:
  - `DATABASE_URL`
  - `NEXTAUTH_SECRET`
  - `API_KEY`

### Vercel Configuration

```js
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "npm install"
}
```

### Serverless Functions

Vercel automatically converts API routes to serverless functions:

```
API route          → Serverless function
app/api/users      → /api/users
```

### Edge Functions

```tsx
// app/api/route.ts
export const runtime = 'edge'

export async function GET(request: Request) {
  return new Response('Hello Edge!')
}
```

## Docker

### Basic Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

### Docker Compose

```yaml
# docker-compose.yml
services:
  nextjs:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/mydb
    depends_on:
      - db
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mydb
```

### Build Output

Enable standalone output:

```js
// next.config.js
module.exports = {
  output: 'standalone',
}
```

## Static Export

### Configuration

```js
// next.config.js
module.exports = {
  output: 'export',
  images: {
    unoptimized: true,
  },
}
```

### Export Settings

```js
// next.config.js
module.exports = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
}
```

### Upload to CDN

```bash
# Build
npm run build

# Output is in out/ directory
# Upload 'out' folder to any static host:
# - AWS S3 + CloudFront
# - GitHub Pages
# - Netlify
# - Cloudflare Pages
```

## AWS Amplify

```yaml
# amplify.yml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

## Cloudflare Pages

```bash
# Build command
npm run build

# Output directory
.next
```

### _headers file

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

/_next/static/*
  Cache-Control: public, max-age=31536000, immutable
```

## Self-Hosted

### Production Server

```bash
# Build
npm run build

# Start
NODE_ENV=production node server.js

# With PM2
pm2 start npm --name "nextjs" -- start
```

### PM2 Config

```js
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'nextjs',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/my-app',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
}
```

## Environment Variables

### Development

```env
# .env.local
DATABASE_URL=localhost:5432
API_KEY=dev-key
```

### Production

```env
# .env.production
DATABASE_URL=prod-db:5432
API_KEY=prod-key
```

### Build Time vs Runtime

```tsx
// Build time - must be available at build
const config = require('./config')[process.env.NODE_ENV]

// Runtime - available in serverless functions
const apiKey = process.env.API_KEY
```

## Troubleshooting

### Build Failures

```bash
# Check build output
npm run build

# Verbose output
DEBUG=* npm run build
```

### Memory Issues

```bash
# Increase Node memory
NODE_OPTIONS="--max_old_space_size=4096" npm run build
```

### Route Not Found

```
# Check your output
.build/
├── index.html        # → /
├── about/
│   └── index.html    # → /about
└── _next/
```

## Best Practices

1. **Use Vercel**: Best integration with Next.js
2. **Set environment variables**: Never commit secrets
3. **Use Docker**: For custom deployment
4. **Static export**: For purely static sites
5. **CDN**: Use for static assets

## Common Mistakes

❌ **Committing secrets**

```bash
# .env.local
API_KEY=secret123
```

✅ **Add to .gitignore**

```
.env.local
.env.production
```

❌ **Wrong base path**

```js
// next.config.js
module.exports = {
  basePath: '/my-app', // If deploying to /my-app
}
```

✅ **Set correct base path**

```tsx
// Links must include basePath
<Link href="/about"> → <Link href="/my-app/about">
```

❌ **Not handling 404**

```tsx
// pages/404.tsx - Pages Router
export default function Custom404() {
  return <h1>404 - Page Not Found</h1>
}
```

✅ **Use not-found.tsx**

```tsx
// app/not-found.tsx - App Router
export default function NotFound() {
  return (
    <div>
      <h2>Not Found</h2>
      <p>Could not find requested resource</p>
    </div>
  )
}
```
