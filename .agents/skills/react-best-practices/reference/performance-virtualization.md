---
name: performance-virtualization
description: Use virtualization for long lists to improve rendering performance.
---

# Virtualization

Use virtualization for long lists to improve rendering performance.

## The Problem

```tsx
// DON'T - Rendering all items at once
function LargeList({ items }: { items: string[] }) {
  return (
    <div style={{ height: '500px', overflow: 'auto' }}>
      {items.map((item, index) => (
        <div key={index} style={{ height: '50px' }}>
          {item}
        </div>
      ))}
    </div>
  )
}

function App() {
  const items = Array.from({ length: 10000 }, (_, i) => `Item ${i}`)
  return <LargeList items={items} />
}
// Renders 10,000 DOM nodes!
```

## The Solution

```tsx
// DO - Use virtualization to render only visible items
import { FixedSizeList } from 'react-window'

function LargeList({ items }: { items: string[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>{items[index]}</div>
  )

  return (
    <FixedSizeList
      height={500}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  )
}

function App() {
  const items = Array.from({ length: 10000 }, (_, i) => `Item ${i}`)
  return <LargeList items={items} />
}
// Renders only ~10 visible items!
```

## Common Patterns

### 1. Fixed Size List

```tsx
import { FixedSizeList } from 'react-window'

function FixedList({ items }: { items: string[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>{items[index]}</div>
  )

  return (
    <FixedSizeList
      height={400}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  )
}
```

### 2. Variable Size List

```tsx
import { VariableSizeList } from 'react-window'

function VariableList({ items }: { items: { id: number; content: string }[] }) {
  const getItemSize = (index: number) => {
    return items[index].content.length > 50 ? 100 : 50
  }

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>{items[index].content}</div>
  )

  return (
    <VariableSizeList
      height={400}
      itemCount={items.length}
      itemSize={getItemSize}
      width="100%"
    >
      {Row}
    </VariableSizeList>
  )
}
```

### 3. Fixed Size Grid

```tsx
import { FixedSizeGrid } from 'react-window'

function FixedGrid({ items }: { items: string[] }) {
  const Cell = ({
    columnIndex,
    rowIndex,
    style
  }: {
    columnIndex: number
    rowIndex: number
    style: React.CSSProperties
  }) => {
    const index = rowIndex * 10 + columnIndex
    return <div style={style}>{items[index]}</div>
  }

  return (
    <FixedSizeGrid
      columnCount={10}
      columnWidth={100}
      height={400}
      rowCount={Math.ceil(items.length / 10)}
      rowHeight={50}
      width="100%"
    >
      {Cell}
    </FixedSizeGrid>
  )
}
```

### 4. Infinite Loading

```tsx
import { FixedSizeList } from 'react-window'

function InfiniteList({ initialItems }: { initialItems: string[] }) {
  const [items, setItems] = useState(initialItems)
  const [isLoading, setIsLoading] = useState(false)
  const listRef = useRef<FixedSizeList>(null)

  const loadMore = async () => {
    setIsLoading(true)
    const newItems = await fetchMoreItems()
    setItems(prev => [...prev, ...newItems])
    setIsLoading(false)
  }

  const isItemLoaded = (index: number) => !!items[index]

  const loadMoreItems = async ({ startIndex, stopIndex }: { startIndex: number; stopIndex: number }) => {
    if (!isItemLoaded(startIndex)) {
      await loadMore()
    }
  }

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>{items[index] || 'Loading...'}</div>
  )

  return (
    <FixedSizeList
      height={400}
      itemCount={items.length + 1}
      itemSize={50}
      onItemsRendered={loadMoreItems}
      ref={listRef}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  )
}
```

### 5. Dynamic Item Size

```tsx
import { VariableSizeList } from 'react-window'

function DynamicList({ items }: { items: { id: number; height: number; content: string }[] }) {
  const itemSizeCache = useRef<{ [key: number]: number }>({})

  const getItemSize = (index: number) => {
    return itemSizeCache.current[index] || items[index].height
  }

  const setItemSize = (index: number, size: number) => {
    itemSizeCache.current[index] = size
    listRef.current?.resetAfterIndex(index)
  }

  const listRef = useRef<VariableSizeList>(null)

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = items[index]
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
      if (ref.current) {
        setItemSize(index, ref.current.offsetHeight)
      }
    }, [index])

    return (
      <div ref={ref} style={style}>
        {item.content}
      </div>
    )
  }

  return (
    <VariableSizeList
      height={400}
      itemCount={items.length}
      itemSize={getItemSize}
      ref={listRef}
      width="100%"
    >
      {Row}
    </VariableSizeList>
  )
}
```

### 6. Scroll to Index

```tsx
import { FixedSizeList } from 'react-window'

function ScrollableList({ items }: { items: string[] }) {
  const listRef = useRef<FixedSizeList>(null)

  const scrollToIndex = (index: number) => {
    listRef.current?.scrollToItem(index, 'center')
  }

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>{items[index]}</div>
  )

  return (
    <div>
      <button onClick={() => scrollToIndex(0)}>Top</button>
      <button onClick={() => scrollToIndex(Math.floor(items.length / 2))}>Middle</button>
      <button onClick={() => scrollToIndex(items.length - 1)}>Bottom</button>
      <FixedSizeList
        height={400}
        itemCount={items.length}
        itemSize={50}
        ref={listRef}
        width="100%"
      >
        {Row}
      </FixedSizeList>
    </div>
  )
}
```

### 7. Search and Filter

```tsx
import { FixedSizeList } from 'react-window'

function FilterableList({ items }: { items: string[] }) {
  const [filter, setFilter] = useState('')
  const filteredItems = useMemo(() => {
    return items.filter(item =>
      item.toLowerCase().includes(filter.toLowerCase())
    )
  }, [items, filter])

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>{filteredItems[index]}</div>
  )

  return (
    <div>
      <input
        value={filter}
        onChange={e => setFilter(e.target.value)}
        placeholder="Filter items..."
      />
      <FixedSizeList
        height={400}
        itemCount={filteredItems.length}
        itemSize={50}
        width="100%"
      >
        {Row}
      </FixedSizeList>
    </div>
  )
}
```

### 8. Custom Scrollbar

```tsx
import { FixedSizeList } from 'react-window'

function CustomScrollbarList({ items }: { items: string[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>{items[index]}</div>
  )

  return (
    <FixedSizeList
      height={400}
      itemCount={items.length}
      itemSize={50}
      outerElementType={CustomOuter}
      innerElementType={CustomInner}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  )
}

function CustomOuter({ children, style }: { children: ReactNode; style: React.CSSProperties }) {
  return (
    <div style={{ ...style, overflow: 'auto' }}>
      {children}
    </div>
  )
}

function CustomInner({ children, style }: { children: ReactNode; style: React.CSSProperties }) {
  return <div style={style}>{children}</div>
}
```

## Common Mistakes

### Mistake 1. Not Using Virtualization

```tsx
// DON'T - Rendering all items
function LargeList({ items }: { items: string[] }) {
  return (
    <div style={{ height: '500px', overflow: 'auto' }}>
      {items.map((item, index) => (
        <div key={index}>{item}</div>
      ))}
    </div>
  )
}

// DO - Using virtualization
import { FixedSizeList } from 'react-window'

function LargeList({ items }: { items: string[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>{items[index]}</div>
  )

  return (
    <FixedSizeList
      height={500}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  )
}
```

### Mistake 2. Incorrect Item Size

```tsx
// DON'T - Wrong item size
<FixedSizeList
  height={400}
  itemCount={items.length}
  itemSize={50}
  width="100%"
>
  {Row}
</FixedSizeList>
// Items are actually 100px tall!

// DO - Correct item size
<FixedSizeList
  height={400}
  itemCount={items.length}
  itemSize={100}
  width="100%"
>
  {Row}
</FixedSizeList>
```

### Mistake 3. Not Handling Empty Lists

```tsx
// DON'T - Not handling empty lists
<FixedSizeList
  height={400}
  itemCount={items.length}
  itemSize={50}
  width="100%"
>
  {Row}
</FixedSizeList>

// DO - Handling empty lists
{items.length > 0 ? (
  <FixedSizeList
    height={400}
    itemCount={items.length}
    itemSize={50}
    width="100%"
  >
    {Row}
  </FixedSizeList>
) : (
  <div>No items</div>
)}
```

## Performance Tips

### 1. Use Fixed Size When Possible

```tsx
// DO - Use fixed size for consistent items
<FixedSizeList
  height={400}
  itemCount={items.length}
  itemSize={50}
  width="100%"
>
  {Row}
</FixedSizeList>
```

### 2. Memoize Row Components

```tsx
// DO - Memoize row components
const Row = memo(function Row({ index, style }: { index: number; style: React.CSSProperties }) {
  return <div style={style}>{items[index]}</div>
})
```

### 3. Use react-window for Large Lists

```tsx
// DO - Use react-window for lists > 1000 items
import { FixedSizeList } from 'react-window'

<FixedSizeList
  height={400}
  itemCount={items.length}
  itemSize={50}
  width="100%"
>
  {Row}
</FixedSizeList>
```

## Key Takeaways

- Use virtualization for long lists
- Use FixedSizeList for consistent items
- Use VariableSizeList for variable items
- Memoize row components
- Handle empty lists
- Use correct item sizes
- Implement infinite loading
- Add search and filter
- Customize scrollbars
- Use react-window or react-virtualized
