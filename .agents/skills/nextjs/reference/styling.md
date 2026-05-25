# Styling

Learn different styling approaches in Next.js.

## CSS Modules

### Basic Usage

Create a `.module.css` file:

```css
/* components/Button.module.css */
.button {
  padding: 0.75rem 1.5rem;
  background: blue;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.button:hover {
  background: darkblue;
}

.primary {
  background: blue;
}

.secondary {
  background: gray;
}
```

Use in component:

```tsx
// components/Button.tsx
import styles from './Button.module.css'

export default function Button({ children, variant = 'primary' }) {
  return (
    <button className={`${styles.button} ${styles[variant]}`}>
      {children}
    </button>
  )
}
```

### Composing Classes

```css
/* styles/Button.module.css */
.base {
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
}

.primary {
  composes: base;
  background: blue;
  color: white;
}

.outline {
  composes: base;
  background: transparent;
  border: 1px solid blue;
  color: blue;
}
```

### With Props

```tsx
// components/Card.tsx
import styles from './Card.module.css'

interface CardProps {
  children: React.ReactNode
  variant?: 'default' | 'bordered' | 'shadow'
}

export default function Card({ children, variant = 'default' }: CardProps) {
  return (
    <div className={`${styles.card} ${styles[variant]}`}>
      {children}
    </div>
  )
}
```

## Tailwind CSS

### Setup

```bash
npx create-next-app@latest my-app --typescript --tailwind
```

### Configuration

```js
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0070f3',
        secondary: '#7928ca',
      },
    },
  },
  plugins: [],
}
```

### Basic Usage

```tsx
export default function Button({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
    >
      {children}
    </button>
  )
}
```

### With Variants

```tsx
interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

const variants = {
  primary: 'bg-blue-500 text-white hover:bg-blue-600',
  secondary: 'bg-gray-500 text-white hover:bg-gray-600',
  outline: 'border-2 border-blue-500 text-blue-500 hover:bg-blue-50',
}

const sizes = {
  sm: 'px-3 py-1 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg',
}

export default function Button({ children, variant = 'primary', size = 'md' }: ButtonProps) {
  return (
    <button className={`rounded transition-colors ${variants[variant]} ${sizes[size]}`}>
      {children}
    </button>
  )
}
```

### Dark Mode

```js
// tailwind.config.js
module.exports = {
  darkMode: 'class', // or 'media'
  // ...
}
```

```tsx
// Using dark mode
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  <h1 className="text-2xl font-bold">Hello</h1>
</div>
```

### Responsive

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <div key={item.id}>{item.content}</div>
  ))}
</div>
```

### Custom Fonts

```tsx
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
    },
  },
}
```

```tsx
// app/layout.tsx
import { Inter, DisplayFont } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const display = DisplayFont({ weight: '400', subsets: ['latin'], variable: '--font-display' })

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

## Global CSS

### Basic Setup

```css
/* app/globals.css */
:root {
  --primary: #0070f3;
  --secondary: #7928ca;
  --background: #ffffff;
  --foreground: #171717;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

body {
  color: var(--foreground);
  background: var(--background);
  font-family: system-ui, -apple-system, sans-serif;
}

* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

a {
  color: inherit;
  text-decoration: none;
}
```

Import in layout:

```tsx
// app/layout.tsx
import './globals.css'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

### CSS Variables

```css
/* app/globals.css */
:root {
  --color-primary: #0070f3;
  --color-success: #10b981;
  --color-error: #ef4444;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 2rem;
}
```

Use in components:

```tsx
// Using CSS variables
export default function Card({ children }) {
  return (
    <div style={{ padding: 'var(--spacing-md)' }}>
      {children}
    </div>
  )
}
```

### Tailwind with Global CSS

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    @apply scroll-smooth;
  }
  
  body {
    @apply antialiased;
  }
}

@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600;
  }
  
  .card {
    @apply p-4 bg-white rounded-lg shadow;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
```

## Best Practices

1. **Use CSS Modules**: For component-specific styles
2. **Use Tailwind**: For utility-first styling
3. **Keep globals minimal**: Only global resets and variables
4. **Organize styles**: Group related styles together

## Common Mistakes

❌ **Using inline styles**

```tsx
export default function Button() {
  return (
    <button style={{ padding: '1rem', background: 'blue' }}>
      Click me
    </button>
  )
}
```

✅ **Use CSS Modules or Tailwind**

```tsx
import styles from './Button.module.css'

export default function Button() {
  return <button className={styles.button}>Click me</button>
}
```

❌ **Global styles for everything**

```css
/* globals.css */
.button { ... }
.card { ... }
.header { ... }
```

✅ **Component-specific styles**

```css
/* Button.module.css */
.button { ... }
```

## Adding UnoCSS to Next.js

If you prefer UnoCSS over Tailwind:

```bash
npm install unocss @unocss/next
```

```js
// uno.config.ts
import { defineConfig, presetUno, presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetIcons(),
  ],
})
```

```tsx
// next.config.js
const withUnoCSS = require('@unocss/next')()

module.exports = withUnoCSS({
  // other Next.js config
})
```
