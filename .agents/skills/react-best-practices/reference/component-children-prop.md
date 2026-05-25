---
name: component-children-prop
description: Use the children prop to pass components or elements as content to other components.
---

# Children Prop

Use the children prop to pass components or elements as content to other components.

## Basic Usage

```tsx
function Card({ children }: { children: ReactNode }) {
  return (
    <div className="card">
      {children}
    </div>
  )
}

// Usage
<Card>
  <h2>Title</h2>
  <p>Content goes here</p>
</Card>
```

## Common Patterns

### 1. Wrapper Components

```tsx
function Container({ children }: { children: ReactNode }) {
  return (
    <div className="container">
      {children}
    </div>
  )
}

// Usage
<Container>
  <h1>My App</h1>
  <p>Welcome</p>
</Container>
```

### 2. Layout Components

```tsx
function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="layout">
      <header>Header</header>
      <main>{children}</main>
      <footer>Footer</footer>
    </div>
  )
}

// Usage
<Layout>
  <h1>Page Content</h1>
</Layout>
```

### 3. Conditional Rendering

```tsx
function Modal({ isOpen, children }: { isOpen: boolean; children: ReactNode }) {
  if (!isOpen) return null

  return (
    <div className="modal">
      {children}
    </div>
  )
}

// Usage
<Modal isOpen={showModal}>
  <h2>Modal Title</h2>
  <p>Modal content</p>
</Modal>
```

### 4. Multiple Children

```tsx
function SplitPane({ children }: { children: ReactNode }) {
  const childrenArray = Children.toArray(children)

  return (
    <div className="split-pane">
      <div className="left">{childrenArray[0]}</div>
      <div className="right">{childrenArray[1]}</div>
    </div>
  )
}

// Usage
<SplitPane>
  <div>Left content</div>
  <div>Right content</div>
</SplitPane>
```

### 5. Children with Props

```tsx
function List({ children }: { children: ReactNode }) {
  return (
    <ul>
      {Children.map(children, child => {
        if (isValidElement(child)) {
          return cloneElement(child as ReactElement, { className: 'list-item' })
        }
        return child
      })}
    </ul>
  )
}

// Usage
<List>
  <li>Item 1</li>
  <li>Item 2</li>
</List>
```

### 6. Default Children

```tsx
function Card({ children }: { children: ReactNode }) {
  return (
    <div className="card">
      {children || <p>No content</p>}
    </div>
  )
}

// Usage
<Card />
<Card>Custom content</Card>
```

### 7. Children Validation

```tsx
function Tabs({ children }: { children: ReactNode }) {
  const childrenArray = Children.toArray(children)

  const tabs = childrenArray.filter(child =>
    isValidElement(child) && child.type === Tab
  )

  if (tabs.length === 0) {
    console.warn('Tabs requires at least one Tab component')
  }

  return <div className="tabs">{children}</div>
}

function Tab({ children }: { children: ReactNode }) {
  return <div className="tab">{children}</div>
}

// Usage
<Tabs>
  <Tab>Tab 1</Tab>
  <Tab>Tab 2</Tab>
</Tabs>
```

### 8. Render Props Alternative

```tsx
// Instead of render props
function Mouse({ render }: { render: (state: { x: number; y: number }) => ReactNode }) {
  const [position, setPosition] = useState({ x: 0, y: 0 })

  return (
    <div onMouseMove={e => setPosition({ x: e.clientX, y: e.clientY })}>
      {render(position)}
    </div>
  )
}

// Use children
function Mouse({ children }: { children: (state: { x: number; y: number }) => ReactNode }) {
  const [position, setPosition] = useState({ x: 0, y: 0 })

  return (
    <div onMouseMove={e => setPosition({ x: e.clientX, y: e.clientY })}>
      {children(position)}
    </div>
  )
}

// Usage
<Mouse>
  {({ x, y }) => <p>Mouse at {x}, {y}</p>}
</Mouse>
```

## Advanced Patterns

### 1. Slot Pattern

```tsx
interface LayoutProps {
  header?: ReactNode
  sidebar?: ReactNode
  children: ReactNode
}

function Layout({ header, sidebar, children }: LayoutProps) {
  return (
    <div className="layout">
      {header && <header className="header">{header}</header>}
      <div className="content">
        {sidebar && <aside className="sidebar">{sidebar}</aside>}
        <main>{children}</main>
      </div>
    </div>
  )
}

// Usage
<Layout
  header={<h1>Header</h1>}
  sidebar={<nav>Sidebar</nav>}
>
  <p>Main content</p>
</Layout>
```

### 2. Compound Components

```tsx
interface TabsContextValue {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const TabsContext = createContext<TabsContextValue | null>(null)

function Tabs({ defaultTab, children }: { defaultTab: string; children: ReactNode }) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  )
}

function TabList({ children }: { children: ReactNode }) {
  return <div className="tab-list">{children}</div>
}

function Tab({ name, children }: { name: string; children: ReactNode }) {
  const { activeTab, setActiveTab } = useContext(TabsContext)!
  const isActive = activeTab === name

  return (
    <button
      className={isActive ? 'active' : ''}
      onClick={() => setActiveTab(name)}
    >
      {children}
    </button>
  )
}

function TabPanel({ name, children }: { name: string; children: ReactNode }) {
  const { activeTab } = useContext(TabsContext)!
  return activeTab === name ? <div>{children}</div> : null
}

Tabs.TabList = TabList
Tabs.Tab = Tab
Tabs.TabPanel = TabPanel

// Usage
<Tabs defaultTab="home">
  <Tabs.TabList>
    <Tabs.Tab name="home">Home</Tabs.Tab>
    <Tabs.Tab name="about">About</Tabs.Tab>
  </Tabs.TabList>
  <Tabs.TabPanel name="home">Home content</Tabs.TabPanel>
  <Tabs.TabPanel name="about">About content</Tabs.TabPanel>
</Tabs>
```

## Common Mistakes

### Mistake 1: Not Handling Empty Children

```tsx
// DON'T - Empty children may cause issues
function Card({ children }: { children: ReactNode }) {
  return <div className="card">{children}</div>
}

// DO - Handle empty children
function Card({ children }: { children: ReactNode }) {
  return (
    <div className="card">
      {children || <p>No content</p>}
    </div>
  )
}
```

### Mistake 2. Mutating Children

```tsx
// DON'T - Mutating children array
function Wrapper({ children }: { children: ReactNode }) {
  const childrenArray = Children.toArray(children)
  childrenArray.reverse()  // Mutation!
  return <div>{childrenArray}</div>
}

// DO - Create new array
function Wrapper({ children }: { children: ReactNode }) {
  const childrenArray = Children.toArray(children)
  return <div>{[...childrenArray].reverse()}</div>
}
```

### Mistake 3. Not Validating Children

```tsx
// DON'T - No validation
function Tabs({ children }: { children: ReactNode }) {
  return <div className="tabs">{children}</div>
}

// DO - Validate children
function Tabs({ children }: { children: ReactNode }) {
  const childrenArray = Children.toArray(children)
  const tabs = childrenArray.filter(child =>
    isValidElement(child) && child.type === Tab
  )

  if (tabs.length === 0) {
    console.warn('Tabs requires at least one Tab component')
  }

  return <div className="tabs">{children}</div>
}
```

## Key Takeaways

- Use children prop for flexible component composition
- Children can be any ReactNode (elements, strings, numbers, etc.)
- Use Children utility functions for advanced patterns
- Handle empty children with default content
- Validate children when needed
- Children enable powerful composition patterns
- Prefer children over render props when possible
