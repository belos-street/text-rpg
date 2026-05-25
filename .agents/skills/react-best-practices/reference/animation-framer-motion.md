---
name: animation-framer-motion
description: Use Framer Motion for declarative animations in React.
---

# Framer Motion

Use Framer Motion for declarative animations in React.

## The Problem

```tsx
// DON'T - Complex CSS animations
function Modal({ isOpen }: { isOpen: boolean }) {
  return (
    <div
      style={{
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? 'scale(1)' : 'scale(0.8)',
        transition: 'opacity 0.3s ease, transform 0.3s ease'
      }}
    >
      Modal content
    </div>
  )
}
// Hard to maintain!
```

## The Solution

```tsx
// DO - Using Framer Motion
import { motion } from 'framer-motion'

function Modal({ isOpen }: { isOpen: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: isOpen ? 1 : 0, scale: isOpen ? 1 : 0.8 }}
      transition={{ duration: 0.3 }}
    >
      Modal content
    </motion.div>
  )
}
// Easy to maintain!
```

## Common Patterns

### 1. Basic Animation

```tsx
import { motion } from 'framer-motion'

function Button() {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      Click me
    </motion.button>
  )
}
```

### 2. Entrance Animation

```tsx
import { motion } from 'framer-motion'

function FadeIn({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  )
}
```

### 3. Exit Animation

```tsx
import { motion, AnimatePresence } from 'framer-motion'

function Modal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
        >
          Modal content
          <button onClick={onClose}>Close</button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

### 4. Staggered Animation

```tsx
import { motion } from 'framer-motion'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

function List({ items }: { items: string[] }) {
  return (
    <motion.ul
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {items.map(item => (
        <motion.li key={item} variants={itemVariants}>
          {item}
        </motion.li>
      ))}
    </motion.ul>
  )
}
```

### 5. Drag Animation

```tsx
import { motion } from 'framer-motion'

function Draggable() {
  return (
    <motion.div
      drag
      dragConstraints={{ left: 0, right: 300, top: 0, bottom: 300 }}
      style={{ width: 100, height: 100, background: 'blue' }}
    >
      Drag me
    </motion.div>
  )
}
```

### 6. Scroll Animation

```tsx
import { motion, useScroll, useTransform } from 'framer-motion'

function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1])

  return (
    <motion.div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: 'blue',
        scaleX,
        transformOrigin: 'left'
      }}
    />
  )
}
```

### 7. Hover Animation

```tsx
import { motion } from 'framer-motion'

function Card() {
  return (
    <motion.div
      whileHover={{ scale: 1.05, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}
      whileTap={{ scale: 0.95 }}
      style={{ width: 200, height: 200, background: 'gray' }}
    >
      Card content
    </motion.div>
  )
}
```

### 8. Layout Animation

```tsx
import { motion, AnimatePresence } from 'framer-motion'

function ReorderableList({ items }: { items: string[] }) {
  return (
    <motion.div layout>
      <AnimatePresence>
        {items.map(item => (
          <motion.div
            key={item}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ padding: 10, margin: 5, background: 'lightgray' }}
          >
            {item}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  )
}
```

## Common Mistakes

### Mistake 1. Not Using AnimatePresence

```tsx
// DON'T - Not using AnimatePresence
function Modal({ isOpen }: { isOpen: boolean }) {
  return (
    <motion.div
      animate={{ opacity: isOpen ? 1 : 0 }}
    >
      Modal content
    </motion.div>
  )
}

// DO - Using AnimatePresence
import { motion, AnimatePresence } from 'framer-motion'

function Modal({ isOpen }: { isOpen: boolean }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          Modal content
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

### Mistake 2. Not Using Layout

```tsx
// DON'T - Not using layout
function ReorderableList({ items }: { items: string[] }) {
  return (
    <div>
      {items.map(item => (
        <motion.div key={item}>
          {item}
        </motion.div>
      ))}
    </div>
  )
}

// DO - Using layout
import { motion } from 'framer-motion'

function ReorderableList({ items }: { items: string[] }) {
  return (
    <motion.div layout>
      {items.map(item => (
        <motion.div key={item} layout>
          {item}
        </motion.div>
      ))}
    </motion.div>
  )
}
```

### Mistake 3. Not Using Variants

```tsx
// DON'T - Not using variants
function List({ items }: { items: string[] }) {
  return (
    <motion.ul>
      {items.map(item => (
        <motion.li
          key={item}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: item.index * 0.1 }}
        >
          {item}
        </motion.li>
      ))}
    </motion.ul>
  )
}

// DO - Using variants
import { motion } from 'framer-motion'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

function List({ items }: { items: string[] }) {
  return (
    <motion.ul
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {items.map(item => (
        <motion.li key={item} variants={itemVariants}>
          {item}
        </motion.li>
      ))}
    </motion.ul>
  )
}
```

## Best Practices

### 1. Use Variants for Complex Animations

```tsx
// DO - Use variants
const variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 }
}

function Component() {
  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
    >
      Content
    </motion.div>
  )
}
```

### 2. Use AnimatePresence for Exit Animations

```tsx
// DO - Use AnimatePresence
import { motion, AnimatePresence } from 'framer-motion'

function Modal({ isOpen }: { isOpen: boolean }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          Content
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

### 3. Use Layout for Smooth Transitions

```tsx
// DO - Use layout
import { motion } from 'framer-motion'

function Component() {
  return (
    <motion.div layout>
      Content
    </motion.div>
  )
}
```

### 4. Use Gestures for Interactions

```tsx
// DO - Use gestures
import { motion } from 'framer-motion'

function Component() {
  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      drag
    >
      Content
    </motion.div>
  )
}
```

## Performance Tips

### 1. Use GPU-Accelerated Properties

```tsx
// DO - Use GPU-accelerated properties
import { motion } from 'framer-motion'

function Component() {
  return (
    <motion.div
      animate={{ x: 100, opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      Content
    </motion.div>
  )
}
```

### 2. Use Layout Prop Sparingly

```tsx
// DO - Use layout prop sparingly
import { motion } from 'framer-motion'

function Component() {
  return (
    <motion.div layout>
      Content
    </motion.div>
  )
}
```

### 3. Use Transform Instead of Layout Properties

```tsx
// DON'T - Avoid layout properties
function Component() {
  return (
    <motion.div
      animate={{ width: 200, height: 200 }}
    >
      Content
    </motion.div>
  )
}

// DO - Use transform
function Component() {
  return (
    <motion.div
      animate={{ scale: 1.5 }}
    >
      Content
    </motion.div>
  )
}
```

## Key Takeaways

- Use Framer Motion for declarative animations
- Use variants for complex animations
- Use AnimatePresence for exit animations
- Use layout prop for smooth transitions
- Use gestures for interactions
- Use GPU-accelerated properties
- Avoid layout properties
- Use staggered animations
- Use scroll animations
