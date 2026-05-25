---
name: animation-css-animations
description: Use CSS animations for complex animations in React.
---

# CSS Animations

Use CSS animations for complex animations in React.

## The Problem

```tsx
// DON'T - Not using animations
function Spinner() {
  return <div>Loading...</div>
}
// No visual feedback!
```

## The Solution

```tsx
// DO - Using CSS animations
function Spinner() {
  return (
    <div
      style={{
        animation: 'spin 1s linear infinite'
      }}
    >
      Loading...
    </div>
  )
}

// CSS
// @keyframes spin {
//   from { transform: rotate(0deg); }
//   to { transform: rotate(360deg); }
// }
```

## Common Patterns

### 1. Basic Animation

```tsx
function Spinner() {
  return (
    <div
      style={{
        animation: 'spin 1s linear infinite'
      }}
    >
      Loading...
    </div>
  )
}

// CSS
// @keyframes spin {
//   from { transform: rotate(0deg); }
//   to { transform: rotate(360deg); }
// }
```

### 2. Fade In Animation

```tsx
function FadeIn({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        animation: 'fadeIn 0.5s ease-in'
      }}
    >
      {children}
    </div>
  )
}

// CSS
// @keyframes fadeIn {
//   from { opacity: 0; }
//   to { opacity: 1; }
// }
```

### 3. Slide In Animation

```tsx
function SlideIn({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        animation: 'slideIn 0.5s ease-out'
      }}
    >
      {children}
    </div>
  )
}

// CSS
// @keyframes slideIn {
//   from { transform: translateX(-100%); }
//   to { transform: translateX(0); }
// }
```

### 4. Bounce Animation

```tsx
function Bounce({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        animation: 'bounce 0.5s ease-in-out'
      }}
    >
      {children}
    </div>
  )
}

// CSS
// @keyframes bounce {
//   0%, 100% { transform: translateY(0); }
//   50% { transform: translateY(-20px); }
// }
```

### 5. Pulse Animation

```tsx
function Pulse({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        animation: 'pulse 2s ease-in-out infinite'
      }}
    >
      {children}
    </div>
  )
}

// CSS
// @keyframes pulse {
//   0%, 100% { opacity: 1; }
//   50% { opacity: 0.5; }
// }
```

### 6. Shake Animation

```tsx
function Shake({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        animation: 'shake 0.5s ease-in-out'
      }}
    >
      {children}
    </div>
  )
}

// CSS
// @keyframes shake {
//   0%, 100% { transform: translateX(0); }
//   25% { transform: translateX(-10px); }
//   75% { transform: translateX(10px); }
// }
```

### 7. Scale Animation

```tsx
function Scale({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        animation: 'scale 0.3s ease-out'
      }}
    >
      {children}
    </div>
  )
}

// CSS
// @keyframes scale {
//   from { transform: scale(0); }
//   to { transform: scale(1); }
// }
```

### 8. Rotate Animation

```tsx
function Rotate({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        animation: 'rotate 1s linear infinite'
      }}
    >
      {children}
    </div>
  )
}

// CSS
// @keyframes rotate {
//   from { transform: rotate(0deg); }
//   to { transform: rotate(360deg); }
// }
```

## Common Mistakes

### Mistake 1. Not Using Animation

```tsx
// DON'T - Not using animation
function Spinner() {
  return <div>Loading...</div>
}

// DO - Using animation
function Spinner() {
  return (
    <div
      style={{
        animation: 'spin 1s linear infinite'
      }}
    >
      Loading...
    </div>
  )
}
```

### Mistake 2. Not Cleaning Up Animations

```tsx
// DON'T - Not cleaning up
function AnimatedComponent({ isVisible }: { isVisible: boolean }) {
  return (
    <div
      style={{
        animation: isVisible ? 'fadeIn 0.5s ease-in' : 'none'
      }}
    >
      Content
    </div>
  )
}

// DO - Cleaning up properly
function AnimatedComponent({ isVisible }: { isVisible: boolean }) {
  const [shouldAnimate, setShouldAnimate] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setShouldAnimate(true)
    }
  }, [isVisible])

  return (
    <div
      style={{
        animation: shouldAnimate ? 'fadeIn 0.5s ease-in' : 'none'
      }}
    >
      Content
    </div>
  )
}
```

### Mistake 3. Not Using Hardware Acceleration

```tsx
// DON'T - Not using hardware acceleration
function AnimatedComponent({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        animation: 'slideIn 0.5s ease-out'
      }}
    >
      {children}
    </div>
  )
}

// DO - Using hardware acceleration
function AnimatedComponent({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        animation: 'slideIn 0.5s ease-out',
        willChange: 'transform'
      }}
    >
      {children}
    </div>
  )
}
```

## Best Practices

### 1. Use Appropriate Duration

```tsx
// DO - Use appropriate duration
function FadeIn({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        animation: 'fadeIn 0.3s ease-in'
      }}
    >
      {children}
    </div>
  )
}
```

### 2. Use Correct Timing Function

```tsx
// DO - Use correct timing function
function SlideIn({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        animation: 'slideIn 0.5s ease-out'
      }}
    >
      {children}
    </div>
  )
}
```

### 3. Use Hardware Acceleration

```tsx
// DO - Use hardware acceleration
function AnimatedComponent({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        animation: 'slideIn 0.5s ease-out',
        willChange: 'transform'
      }}
    >
      {children}
    </div>
  )
}
```

### 4. Use CSS Modules

```tsx
// DO - Use CSS modules
import styles from './AnimatedComponent.module.css'

function AnimatedComponent({ children }: { children: ReactNode }) {
  return <div className={styles.animated}>{children}</div>
}

// AnimatedComponent.module.css
// .animated {
//   animation: fadeIn 0.5s ease-in;
// }
// @keyframes fadeIn {
//   from { opacity: 0; }
//   to { opacity: 1; }
// }
```

## Performance Tips

### 1. Animate Transform and Opacity

```tsx
// DO - Animate transform and opacity
function AnimatedComponent({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        animation: 'fadeInScale 0.5s ease-out'
      }}
    >
      {children}
    </div>
  )
}

// CSS
// @keyframes fadeInScale {
//   from {
//     opacity: 0;
//     transform: scale(0.8);
//   }
//   to {
//     opacity: 1;
//     transform: scale(1);
//   }
// }
```

### 2. Avoid Layout Triggers

```tsx
// DON'T - Avoid layout triggers
function AnimatedComponent({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        animation: 'expand 0.5s ease-out'
      }}
    >
      {children}
    </div>
  )
}

// CSS
// @keyframes expand {
//   from { width: 0; height: 0; }
//   to { width: 100%; height: 100%; }
// }

// DO - Use transform instead
function AnimatedComponent({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        animation: 'scale 0.5s ease-out'
      }}
    >
      {children}
    </div>
  )
}

// CSS
// @keyframes scale {
//   from { transform: scale(0); }
//   to { transform: scale(1); }
// }
```

### 3. Use will-change Sparingly

```tsx
// DO - Use will-change sparingly
function AnimatedComponent({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        animation: 'slideIn 0.5s ease-out',
        willChange: 'transform'
      }}
    >
      {children}
    </div>
  )
}
```

## Key Takeaways

- Use animations for complex effects
- Use appropriate duration
- Use correct timing function
- Animate transform and opacity
- Avoid layout triggers
- Use hardware acceleration
- Clean up animations properly
- Use CSS modules
- Use will-change sparingly
