# TypeScript Support

Learn how to use TypeScript with Zustand for type-safe state management.

## Basic TypeScript Setup

Define interfaces for your state:

```ts
import { create } from 'zustand'

interface CounterState {
  count: number
  increment: () => void
  decrement: () => void
  reset: () => void
}

const useCounterStore = create<CounterState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}))
```

## Complex State Types

Define types for complex state:

```ts
interface User {
  id: number
  name: string
  email: string
  avatar?: string
}

interface UserState {
  user: User | null
  isLoading: boolean
  error: Error | null
  setUser: (user: User) => void
  clearUser: () => void
  fetchUser: (id: number) => Promise<void>
}

const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoading: false,
  error: null,
  
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
  
  fetchUser: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.getUser(id)
      set({ user: response.data, isLoading: false })
    } catch (error) {
      set({ error: error as Error, isLoading: false })
    }
  },
}))
```

## Array State Types

Define types for array state:

```ts
interface Todo {
  id: number
  text: string
  completed: boolean
  createdAt: Date
}

interface TodoState {
  todos: Todo[]
  addTodo: (text: string) => void
  removeTodo: (id: number) => void
  toggleTodo: (id: number) => void
}

const useTodoStore = create<TodoState>((set) => ({
  todos: [],
  
  addTodo: (text) => set((state) => ({
    todos: [...state.todos, {
      id: Date.now(),
      text,
      completed: false,
      createdAt: new Date()
    }]
  })),
  
  removeTodo: (id) => set((state) => ({
    todos: state.todos.filter((todo) => todo.id !== id)
  })),
  
  toggleTodo: (id) => set((state) => ({
    todos: state.todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    )
  })),
}))
```

## Generic Store Types

Create generic store types:

```ts
interface ListState<T> {
  items: T[]
  addItem: (item: T) => void
  removeItem: (id: number) => void
  updateItem: (id: number, updates: Partial<T>) => void
}

function createListStore<T extends { id: number }>(
  initialState: T[]
) {
  return create<ListState<T>>((set) => ({
    items: initialState,
    
    addItem: (item) => set((state) => ({
      items: [...state.items, item]
    })),
    
    removeItem: (id) => set((state) => ({
      items: state.items.filter((item) => item.id !== id)
    })),
    
    updateItem: (id, updates) => set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      )
    })),
  }))
}

interface Product {
  id: number
  name: string
  price: number
}

const useProductStore = createListStore<Product>([])
```

## Typed Selectors

Create typed selectors:

```ts
interface UserState {
  users: User[]
  currentUser: User | null
  getUserById: (id: number) => User | undefined
}

const useUserStore = create<UserState>((set, get) => ({
  users: [],
  currentUser: null,
  
  getUserById: (id) => {
    return get().users.find((user) => user.id === id)
  },
}))

const selectUserById = (id: number) => (state: UserState) =>
  state.getUserById(id)

function UserDetail({ userId }: { userId: number }) {
  const user = useUserStore(selectUserById(userId))
  return <div>{user?.name}</div>
}
```

## Typed Actions

Define typed actions:

```ts
interface CartState {
  items: CartItem[]
  total: number
  addItem: (product: Product) => void
  removeItem: (id: number) => void
  updateQuantity: (id: number, quantity: number) => void
  clearCart: () => void
}

const useCartStore = create<CartState>((set) => ({
  items: [],
  total: 0,
  
  addItem: (product) => set((state) => {
    const existing = state.items.find((item) => item.id === product.id)
    if (existing) {
      return {
        items: state.items.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
        total: state.total + product.price
      }
    }
    return {
      items: [...state.items, { ...product, quantity: 1 }],
      total: state.total + product.price
    }
  }),
  
  removeItem: (id) => set((state) => {
    const item = state.items.find((i) => i.id === id)
    return {
      items: state.items.filter((item) => item.id !== id),
      total: state.total - (item?.price || 0)
    }
  }),
  
  updateQuantity: (id, quantity) => set((state) => {
    const item = state.items.find((i) => i.id === id)
    if (!item) return state
    
    const oldTotal = item.price * item.quantity
    const newTotal = item.price * quantity
    
    return {
      items: state.items.map((i) =>
        i.id === id ? { ...i, quantity } : i
      ),
      total: state.total - oldTotal + newTotal
    }
  }),
  
  clearCart: () => set({ items: [], total: 0 }),
}))
```

## Best Practices

1. **Define interfaces**: Create clear interfaces for your state
2. **Use generics**: For reusable store patterns
3. **Type actions**: Ensure actions have proper types
4. **Use null checks**: Handle nullable types properly
5. **Leverage inference**: Let TypeScript infer where possible

## Common Mistakes

❌ **Not defining types**

```ts
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 }))
})) // ❌ No types
```

✅ **Defining types**

```ts
interface CounterState {
  count: number
  increment: () => void
}

const useStore = create<CounterState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 }))
})) // ✅ Typed
```

❌ **Using any**

```ts
interface State {
  data: any // ❌ Using any
  setData: (data: any) => void
}
```

✅ **Using specific types**

```ts
interface User {
  id: number
  name: string
}

interface State {
  data: User | null // ✅ Specific type
  setData: (data: User) => void
}
```

❌ **Not typing async actions**

```ts
const useStore = create((set) => ({
  user: null,
  fetchUser: async (id) => { // ❌ No types
    const response = await api.getUser(id)
    set({ user: response.data })
  }
}))
```

✅ **Typing async actions**

```ts
interface State {
  user: User | null
  fetchUser: (id: number) => Promise<void>
}

const useStore = create<State>((set) => ({
  user: null,
  fetchUser: async (id) => { // ✅ Typed
    const response = await api.getUser(id)
    set({ user: response.data })
  }
}))
```
