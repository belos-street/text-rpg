---
name: suspense-lazy-loading
description: Use Suspense with lazy for code splitting and loading states.
---

# Suspense Lazy Loading

Use Suspense with lazy for code splitting and loading states.

## The Problem

```tsx
// DON'T - All components loaded at once
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
// DO - Use lazy with Suspense
import { lazy, Suspense } from 'react'

const HeavyComponent = lazy(() => import('./HeavyComponent'))
const AnotherHeavyComponent = lazy(() => import('./AnotherHeavyComponent'))

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HeavyComponent />
      <AnotherHeavyComponent />
    </Suspense>
  )
}
// Smaller initial bundle!
```

## Common Patterns

### 1. Basic Lazy Loading

```tsx
import { lazy, Suspense } from 'react'

const LazyComponent = lazy(() => import('./LazyComponent'))

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyComponent />
    </Suspense>
  )
}
```

### 2. Multiple Lazy Components

```tsx
import { lazy, Suspense } from 'react'

const ComponentA = lazy(() => import('./ComponentA'))
const ComponentB = lazy(() => import('./ComponentB'))
const ComponentC = lazy(() => import('./ComponentC'))

function App() {
  return (
    <Suspense fallback={<div>Loading components...</div>}>
      <ComponentA />
      <ComponentB />
      <ComponentC />
    </Suspense>
  )
}
```

### 3. Nested Suspense

```tsx
import { lazy, Suspense } from 'react'

const ParentComponent = lazy(() => import('./ParentComponent'))
const ChildComponent = lazy(() => import('./ChildComponent'))

function App() {
  return (
    <Suspense fallback={<div>Loading parent...</div>}>
      <ParentComponent>
        <Suspense fallback={<div>Loading child...</div>}>
          <ChildComponent />
        </Suspense>
      </ParentComponent>
    </Suspense>
  )
}
```

### 4. Conditional Lazy Loading

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

### 5. Route-Based Lazy Loading

```tsx
import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

const Home = lazy(() => import('./pages/Home'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading page...</div>}>
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

### 6. Custom Loading Component

```tsx
import { lazy, Suspense } from 'react'

const LazyComponent = lazy(() => import('./LazyComponent'))

function LoadingSpinner() {
  return (
    <div className="loading-spinner">
      <div className="spinner"></div>
      <p>Loading...</p>
    </div>
  )
}

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LazyComponent />
    </Suspense>
  )
}
```

### 7. Error Boundary with Lazy Loading

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
      return <div>Something went wrong loading this component.</div>
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

### 8. Preloading Lazy Components

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

### Mistake 2. Not Handling Errors

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

### Mistake 3. Lazy Loading Small Components

```tsx
// DON'T - Lazy loading small components
const SmallComponent = lazy(() => import('./SmallComponent'))

// DO - Only lazy load large components
import SmallComponent from './SmallComponent'
const LargeComponent = lazy(() => import('./LargeComponent'))
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

### 3. Use Webpack Magic Comments

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

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Home />
      <About />
    </Suspense>
  )
}
```

## Key Takeaways

- Use lazy for code splitting
- Wrap lazy components in Suspense
- Use nested Suspense for complex UI
- Handle errors with Error Boundary
- Only lazy load large components
- Use custom loading components
- Preload components when needed
- Use webpack magic comments
- Measure bundle size
- Prioritize critical code
