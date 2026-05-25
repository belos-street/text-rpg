---
name: suspense-fallback
description: Use appropriate fallback UI for Suspense boundaries.
---

# Suspense Fallback

Use appropriate fallback UI for Suspense boundaries.

## The Problem

```tsx
// DON'T - Poor fallback UI
function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserProfile userId="1" />
    </Suspense>
  )
}
// Generic fallback doesn't provide good UX
```

## The Solution

```tsx
// DO - Use appropriate fallback UI
function App() {
  return (
    <Suspense
      fallback={
        <div className="loading-skeleton">
          <div className="skeleton-avatar" />
          <div className="skeleton-text" />
          <div className="skeleton-text" />
        </div>
      }
    >
      <UserProfile userId="1" />
    </Suspense>
  )
}
// Skeleton provides better UX
```

## Common Patterns

### 1. Loading Spinner

```tsx
function LoadingSpinner() {
  return (
    <div className="loading-spinner">
      <div className="spinner" />
      <p>Loading...</p>
    </div>
  )
}

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <UserProfile userId="1" />
    </Suspense>
  )
}
```

### 2. Skeleton Loading

```tsx
function UserSkeleton() {
  return (
    <div className="user-skeleton">
      <div className="skeleton-avatar" />
      <div className="skeleton-info">
        <div className="skeleton-name" />
        <div className="skeleton-email" />
      </div>
    </div>
  )
}

function App() {
  return (
    <Suspense fallback={<UserSkeleton />}>
      <UserProfile userId="1" />
    </Suspense>
  )
}
```

### 3. Progress Indicator

```tsx
function ProgressIndicator() {
  return (
    <div className="progress-indicator">
      <div className="progress-bar">
        <div className="progress-fill" />
      </div>
      <p>Loading data...</p>
    </div>
  )
}

function App() {
  return (
    <Suspense fallback={<ProgressIndicator />}>
      <UserProfile userId="1" />
    </Suspense>
  )
}
```

### 4. Contextual Fallback

```tsx
function UserProfileSkeleton() {
  return (
    <div className="user-profile-skeleton">
      <div className="skeleton-header" />
      <div className="skeleton-content">
        <div className="skeleton-item" />
        <div className="skeleton-item" />
        <div className="skeleton-item" />
      </div>
    </div>
  )
}

function App() {
  return (
    <Suspense fallback={<UserProfileSkeleton />}>
      <UserProfile userId="1" />
    </Suspense>
  )
}
```

### 5. Multiple Fallbacks

```tsx
function App() {
  return (
    <div>
      <Suspense fallback={<div>Loading user...</div>}>
        <UserProfile userId="1" />
      </Suspense>

      <Suspense fallback={<div>Loading posts...</div>}>
        <UserPosts userId="1" />
      </Suspense>

      <Suspense fallback={<div>Loading comments...</div>}>
        <UserComments userId="1" />
      </Suspense>
    </div>
  )
}
```

### 6. Nested Fallbacks

```tsx
function App() {
  return (
    <Suspense fallback={<div>Loading profile...</div>}>
      <UserProfile userId="1">
        <Suspense fallback={<div>Loading posts...</div>}>
          <UserPosts userId="1" />
        </Suspense>
      </UserProfile>
    </Suspense>
  )
}
```

### 7. Animated Fallback

```tsx
function AnimatedFallback() {
  return (
    <div className="animated-fallback">
      <div className="dots">
        <span>.</span>
        <span>.</span>
        <span>.</span>
      </div>
      <p>Loading...</p>
    </div>
  )
}

function App() {
  return (
    <Suspense fallback={<AnimatedFallback />}>
      <UserProfile userId="1" />
    </Suspense>
  )
}
```

### 8. Fallback with Timeout

```tsx
function TimeoutFallback() {
  const [showTimeout, setShowTimeout] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowTimeout(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  if (showTimeout) {
    return <div>Taking longer than expected...</div>
  }

  return <div>Loading...</div>
}

function App() {
  return (
    <Suspense fallback={<TimeoutFallback />}>
      <UserProfile userId="1" />
    </Suspense>
  )
}
```

## Common Mistakes

### Mistake 1. Generic Fallback

```tsx
// DON'T - Generic fallback
function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserProfile userId="1" />
    </Suspense>
  )
}

// DO - Contextual fallback
function App() {
  return (
    <Suspense fallback={<UserSkeleton />}>
      <UserProfile userId="1" />
    </Suspense>
  )
}
```

### Mistake 2. No Fallback

```tsx
// DON'T - No fallback
function App() {
  return (
    <Suspense fallback={null}>
      <UserProfile userId="1" />
    </Suspense>
  )
}

// DO - Provide fallback
function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserProfile userId="1" />
    </Suspense>
  )
}
```

### Mistake 3. Blocking Fallback

```tsx
// DON'T - Blocking fallback
function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserProfile userId="1" />
      <button>Other Action</button>
    </Suspense>
  )
}

// DO - Non-blocking fallback
function App() {
  return (
    <div>
      <Suspense fallback={<div>Loading user...</div>}>
        <UserProfile userId="1" />
      </Suspense>
      <button>Other Action</button>
    </div>
  )
}
```

## UX Best Practices

### 1. Use Skeleton Loading

```tsx
// DO - Use skeleton loading
function UserSkeleton() {
  return (
    <div className="user-skeleton">
      <div className="skeleton-avatar" />
      <div className="skeleton-info">
        <div className="skeleton-name" />
        <div className="skeleton-email" />
      </div>
    </div>
  )
}
```

### 2. Provide Context

```tsx
// DO - Provide context
function App() {
  return (
    <Suspense fallback={<div>Loading user profile...</div>}>
      <UserProfile userId="1" />
    </Suspense>
  )
}
```

### 3. Add Visual Feedback

```tsx
// DO - Add visual feedback
function LoadingSpinner() {
  return (
    <div className="loading-spinner">
      <div className="spinner" />
      <p>Loading...</p>
    </div>
  )
}
```

### 4. Handle Long Loads

```tsx
// DO - Handle long loads
function TimeoutFallback() {
  const [showTimeout, setShowTimeout] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowTimeout(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  if (showTimeout) {
    return <div>Taking longer than expected...</div>
  }

  return <div>Loading...</div>
}
```

## Performance Tips

### 1. Keep Fallbacks Lightweight

```tsx
// DO - Keep fallbacks lightweight
function SimpleFallback() {
  return <div>Loading...</div>
}

// DON'T - Heavy fallbacks
function HeavyFallback() {
  return (
    <div>
      <ComplexComponent />
      <AnotherComplexComponent />
    </div>
  )
}
```

### 2. Use CSS Animations

```tsx
// DO - Use CSS animations
function AnimatedFallback() {
  return (
    <div className="animated-fallback">
      <div className="spinner" />
    </div>
  )
}
```

### 3. Match Content Structure

```tsx
// DO - Match content structure
function UserSkeleton() {
  return (
    <div className="user-skeleton">
      <div className="skeleton-avatar" />
      <div className="skeleton-info">
        <div className="skeleton-name" />
        <div className="skeleton-email" />
      </div>
    </div>
  )
}
```

## Key Takeaways

- Use contextual fallbacks
- Provide skeleton loading
- Add visual feedback
- Handle long loads
- Keep fallbacks lightweight
- Match content structure
- Use CSS animations
- Provide multiple fallbacks
- Use nested fallbacks
- Improve UX with appropriate fallbacks
