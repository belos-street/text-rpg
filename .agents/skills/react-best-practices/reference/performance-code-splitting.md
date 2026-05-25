---
name: performance-code-splitting
description: Use code splitting to reduce initial bundle size and improve load time.
---

# Code Splitting

Use code splitting to reduce initial bundle size and improve load time.

## The Problem

```tsx
// DON'T - All code loaded at once
import HeavyComponent from './HeavyComponent'
import AnotherHeavyComponent from './AnotherHeavyComponent'

function App() {
  return (
    <div>
      <HeavyComponent />
      <AnotherHeavyComponent />
    </div>
  )
}
// Large initial bundle!
```

## The Solution

```tsx
// DO - Lazy load components
import { lazy, Suspense } from 'react'

const HeavyComponent = lazy(() => import('./HeavyComponent'))
const AnotherHeavyComponent = lazy(() => import('./AnotherHeavyComponent'))

function App() {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <HeavyComponent />
        <AnotherHeavyComponent />
      </Suspense>
    </div>
  )
}
// Smaller initial bundle!
```

## Common Patterns

### 1. Lazy Loading Components

```tsx
import { lazy, Suspense } from 'react'

const Dashboard = lazy(() => import('./Dashboard'))
const Settings = lazy(() => import('./Settings'))
const Profile = lazy(() => import('./Profile'))

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Dashboard />
      <Settings />
      <Profile />
    </Suspense>
  )
}
```

### 2. Route-Based Code Splitting

```tsx
import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

const Home = lazy(() => import('./pages/Home'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
```

### 3. Conditional Loading

```tsx
import { lazy, Suspense, useState } from 'react'

const Modal = lazy(() => import('./Modal'))

function App() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>Open Modal</button>
      {isOpen && (
        <Suspense fallback={<div>Loading modal...</div>}>
          <Modal onClose={() => setIsOpen(false)} />
        </Suspense>
      )}
    </div>
  )
}
```

### 4. Named Exports

```tsx
// Component.tsx
export const ComponentA = () => <div>Component A</div>
export const ComponentB = () => <div>Component B</div>

// App.tsx
import { lazy, Suspense } from 'react'

const ComponentA = lazy(() =>
  import('./Component').then(module => ({ default: module.ComponentA }))
)
const ComponentB = lazy(() =>
  import('./Component').then(module => ({ default: module.ComponentB }))
)

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ComponentA />
      <ComponentB />
    </Suspense>
  )
}
```

### 5. Error Boundaries with Lazy Loading

```tsx
import { lazy, Suspense } from 'react'

const LazyComponent = lazy(() => import('./LazyComponent'))

class ErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong.</div>
    }

    return this.props.children
  }
}

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading...</div>}>
        <LazyComponent />
      </Suspense>
    </ErrorBoundary>
  )
}
```

### 6. Preloading Components

```tsx
import { lazy, Suspense, useEffect } from 'react'

const LazyComponent = lazy(() => import('./LazyComponent'))

function App() {
  useEffect(() => {
    const preload = () => import('./LazyComponent')
    window.addEventListener('mouseover', preload, { once: true })
    return () => window.removeEventListener('mouseover', preload)
  }, [])

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyComponent />
    </Suspense>
  )
}
```

### 7. Dynamic Imports with Loading States

```tsx
import { lazy, Suspense, useState } from 'react'

const LazyComponent = lazy(() => import('./LazyComponent'))

function LoadingSpinner() {
  return <div className="spinner">Loading...</div>
}

function App() {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div>
      <button onClick={() => setIsLoading(true)}>Load Component</button>
      {isLoading && (
        <Suspense fallback={<LoadingSpinner />}>
          <LazyComponent />
        </Suspense>
      )}
    </div>
  )
}
```

### 8. Webpack Magic Comments

```tsx
import { lazy, Suspense } from 'react'

const Home = lazy(() =>
  import(
    /* webpackChunkName: "home" */ './pages/Home'
  )
)
const About = lazy(() =>
  import(
    /* webpackChunkName: "about" */ './pages/About'
  )
)
const Contact = lazy(() =>
  import(
    /* webpackChunkName: "contact" */ './pages/Contact'
  )
)

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Home />
      <About />
      <Contact />
    </Suspense>
  )
}
```

## Common Mistakes

### Mistake 1. Not Using Suspense

```tsx
// DON'T - Not using Suspense
const LazyComponent = lazy(() => import('./LazyComponent'))

function App() {
  return <LazyComponent />
}
// Error: Lazy component must be wrapped in Suspense!

// DO - Using Suspense
const LazyComponent = lazy(() => import('./LazyComponent'))

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyComponent />
    </Suspense>
  )
}
```

### Mistake 2. Splitting Everything

```tsx
// DON'T - Splitting small components
const SmallComponent = lazy(() => import('./SmallComponent'))

// DO - Only split large components
import SmallComponent from './SmallComponent'
const LargeComponent = lazy(() => import('./LargeComponent'))
```

### Mistake 3. Not Handling Errors

```tsx
// DON'T - Not handling errors
const LazyComponent = lazy(() => import('./LazyComponent'))

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyComponent />
    </Suspense>
  )
}

// DO - Using Error Boundary
const LazyComponent = lazy(() => import('./LazyComponent'))

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading...</div>}>
        <LazyComponent />
      </Suspense>
    </ErrorBoundary>
  )
}
```

## Performance Tips

### 1. Measure Bundle Size

```tsx
// Use webpack-bundle-analyzer
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // Next.js config
})
```

### 2. Prioritize Critical Code

```tsx
// DO - Load critical code immediately
import Header from './Header'
import Footer from './Footer'

// DO - Lazy load non-critical code
const LazyComponent = lazy(() => import('./LazyComponent'))

function App() {
  return (
    <div>
      <Header />
      <Suspense fallback={<div>Loading...</div>}>
        <LazyComponent />
      </Suspense>
      <Footer />
    </div>
  )
}
```

### 3. Use Prefetching

```tsx
import { lazy, Suspense } from 'react'

const LazyComponent = lazy(() => import('./LazyComponent'))

function App() {
  useEffect(() => {
    import('./LazyComponent')
  }, [])

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyComponent />
    </Suspense>
  )
}
```

## Key Takeaways

- Use lazy for code splitting
- Wrap lazy components in Suspense
- Use route-based splitting
- Split large components only
- Handle errors with Error Boundary
- Use webpack magic comments
- Preload components when needed
- Measure bundle size
- Prioritize critical code
