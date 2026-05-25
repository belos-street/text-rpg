---
name: suspense-error-boundaries
description: Use Error Boundaries to handle errors in Suspense boundaries.
---

# Suspense Error Boundaries

Use Error Boundaries to handle errors in Suspense boundaries.

## The Problem

```tsx
// DON'T - Not handling errors
function UserProfile({ userId }: { userId: string }) {
  const user = useData(fetchUser(userId))
  return <div>{user.name}</div>
}

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserProfile userId="1" />
    </Suspense>
  )
}
// Errors crash the entire app!
```

## The Solution

```tsx
// DO - Use Error Boundary
function UserProfile({ userId }: { userId: string }) {
  const user = useData(fetchUser(userId))
  return <div>{user.name}</div>
}

class ErrorBoundary extends React.Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

function App() {
  return (
    <ErrorBoundary fallback={<div>Error loading user</div>}>
      <Suspense fallback={<div>Loading...</div>}>
        <UserProfile userId="1" />
      </Suspense>
    </ErrorBoundary>
  )
}
```

## Common Patterns

### 1. Basic Error Boundary

```tsx
class ErrorBoundary extends React.Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

function App() {
  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <Suspense fallback={<div>Loading...</div>}>
        <UserProfile userId="1" />
      </Suspense>
    </ErrorBoundary>
  )
}
```

### 2. Error Boundary with Error Info

```tsx
class ErrorBoundary extends React.Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
        </div>
      )
    }
    return this.props.children
  }
}

function App() {
  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <Suspense fallback={<div>Loading...</div>}>
        <UserProfile userId="1" />
      </Suspense>
    </ErrorBoundary>
  )
}
```

### 3. Error Boundary with Retry

```tsx
class ErrorBoundary extends React.Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={this.handleRetry}>Retry</button>
        </div>
      )
    }
    return this.props.children
  }
}

function App() {
  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <Suspense fallback={<div>Loading...</div>}>
        <UserProfile userId="1" />
      </Suspense>
    </ErrorBoundary>
  )
}
```

### 4. Multiple Error Boundaries

```tsx
function App() {
  return (
    <div>
      <ErrorBoundary fallback={<div>Error loading user</div>}>
        <Suspense fallback={<div>Loading user...</div>}>
          <UserProfile userId="1" />
        </Suspense>
      </ErrorBoundary>

      <ErrorBoundary fallback={<div>Error loading posts</div>}>
        <Suspense fallback={<div>Loading posts...</div>}>
          <UserPosts userId="1" />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
```

### 5. Nested Error Boundaries

```tsx
function App() {
  return (
    <ErrorBoundary fallback={<div>App error</div>}>
      <Suspense fallback={<div>Loading...</div>}>
        <ErrorBoundary fallback={<div>User error</div>}>
          <UserProfile userId="1" />
        </ErrorBoundary>
        <ErrorBoundary fallback={<div>Posts error</div>}>
          <UserPosts userId="1" />
        </ErrorBoundary>
      </Suspense>
    </ErrorBoundary>
  )
}
```

### 6. Error Boundary with Logging

```tsx
class ErrorBoundary extends React.Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logErrorToService(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

function App() {
  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <Suspense fallback={<div>Loading...</div>}>
        <UserProfile userId="1" />
      </Suspense>
    </ErrorBoundary>
  )
}
```

### 7. Error Boundary with Reset

```tsx
class ErrorBoundary extends React.Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={this.handleReset}>Reset</button>
        </div>
      )
    }
    return this.props.children
  }
}

function App() {
  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <Suspense fallback={<div>Loading...</div>}>
        <UserProfile userId="1" />
      </Suspense>
    </ErrorBoundary>
  )
}
```

### 8. Error Boundary with Custom Fallback

```tsx
interface ErrorFallbackProps {
  error: Error
  resetError: () => void
}

function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="error-fallback">
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={resetError}>Try again</button>
    </div>
  )
}

class ErrorBoundary extends React.Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <ErrorFallback
          error={this.state.error}
          resetError={this.handleReset}
        />
      )
    }
    return this.props.children
  }
}

function App() {
  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <Suspense fallback={<div>Loading...</div>}>
        <UserProfile userId="1" />
      </Suspense>
    </ErrorBoundary>
  )
}
```

## Common Mistakes

### Mistake 1. Not Using Error Boundary

```tsx
// DON'T - Not using Error Boundary
function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserProfile userId="1" />
    </Suspense>
  )
}

// DO - Using Error Boundary
function App() {
  return (
    <ErrorBoundary fallback={<div>Error loading user</div>}>
      <Suspense fallback={<div>Loading...</div>}>
        <UserProfile userId="1" />
      </Suspense>
    </ErrorBoundary>
  )
}
```

### Mistake 2. Not Logging Errors

```tsx
// DON'T - Not logging errors
class ErrorBoundary extends React.Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

// DO - Logging errors
class ErrorBoundary extends React.Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logErrorToService(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}
```

### Mistake 3. Not Providing Retry

```tsx
// DON'T - Not providing retry
class ErrorBoundary extends React.Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

// DO - Providing retry
class ErrorBoundary extends React.Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true }
  }

  handleRetry = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <p>Error</p>
          <button onClick={this.handleRetry}>Retry</button>
        </div>
      )
    }
    return this.props.children
  }
}
```

## Performance Tips

### 1. Use Granular Error Boundaries

```tsx
// DO - Use granular error boundaries
function App() {
  return (
    <div>
      <ErrorBoundary fallback={<div>User error</div>}>
        <Suspense fallback={<div>Loading user...</div>}>
          <UserProfile userId="1" />
        </Suspense>
      </ErrorBoundary>

      <ErrorBoundary fallback={<div>Posts error</div>}>
        <Suspense fallback={<div>Loading posts...</div>}>
          <UserPosts userId="1" />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
```

### 2. Log Errors for Debugging

```tsx
// DO - Log errors
class ErrorBoundary extends React.Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logErrorToService(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}
```

### 3. Provide Recovery Options

```tsx
// DO - Provide recovery options
class ErrorBoundary extends React.Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  handleRetry = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <p>Error</p>
          <button onClick={this.handleRetry}>Retry</button>
        </div>
      )
    }
    return this.props.children
  }
}
```

## Key Takeaways

- Use Error Boundaries with Suspense
- Handle errors gracefully
- Log errors for debugging
- Provide retry options
- Use granular error boundaries
- Customize error fallbacks
- Reset error state
- Combine with Suspense
- Test error scenarios
