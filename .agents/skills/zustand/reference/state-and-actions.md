# State and Actions

Learn how to manage state and create actions in Zustand stores.

## State Updates

### Simple Update

```ts
const useStore = create((set) => ({
  count: 0,
  setCount: (value) => set({ count: value }),
}))
```

### Functional Update

```ts
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}))
```

### Multiple State Updates

```ts
const useStore = create((set) => ({
  user: null,
  isLoading: false,
  error: null,
  
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  
  reset: () => set({ user: null, isLoading: false, error: null }),
}))
```

## Async Actions

### Basic Async Action

```ts
const useUserStore = create((set) => ({
  user: null,
  isLoading: false,
  error: null,
  
  fetchUser: async (id: string) => {
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

### Async Action with Multiple Updates

```ts
const useTodoStore = create((set) => ({
  todos: [],
  isLoading: false,
  
  fetchTodos: async () => {
    set({ isLoading: true })
    try {
      const response = await api.getTodos()
      set({ todos: response.data, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },
  
  addTodo: async (text: string) => {
    try {
      const response = await api.addTodo(text)
      set((state) => ({
        todos: [...state.todos, response.data]
      }))
    } catch (error) {
      console.error('Failed to add todo', error)
    }
  },
}))
```

## Array Operations

### Add Item

```ts
const useStore = create((set) => ({
  items: [],
  addItem: (item) => set((state) => ({
    items: [...state.items, item]
  })),
}))
```

### Remove Item

```ts
const useStore = create((set) => ({
  items: [],
  removeItem: (id) => set((state) => ({
    items: state.items.filter((item) => item.id !== id)
  })),
}))
```

### Update Item

```ts
const useStore = create((set) => ({
  items: [],
  updateItem: (id, updates) => set((state) => ({
    items: state.items.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    )
  })),
}))
```

### Toggle Item

```ts
const useTodoStore = create((set) => ({
  todos: [],
  toggleTodo: (id) => set((state) => ({
    todos: state.todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    )
  })),
}))
```

## Object Operations

### Update Nested Property

```ts
const useStore = create((set) => ({
  user: { name: '', email: '', profile: { age: 0 } },
  updateName: (name) => set((state) => ({
    user: { ...state.user, name }
  })),
  updateAge: (age) => set((state) => ({
    user: { ...state.user, profile: { ...state.user.profile, age } }
  })),
}))
```

### Merge Object

```ts
const useStore = create((set) => ({
  user: {},
  updateUser: (updates) => set((state) => ({
    user: { ...state.user, ...updates }
  })),
}))
```

## Conditional Updates

```ts
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({
    count: state.count < 10 ? state.count + 1 : state.count
  })),
}))
```

## Reset State

```ts
const useStore = create((set) => ({
  count: 0,
  name: '',
  increment: () => set((state) => ({ count: state.count + 1 })),
  reset: () => set({ count: 0, name: '' }),
}))
```

## Best Practices

1. **Use functional updates**: For state that depends on previous state
2. **Immutability**: Always create new objects/arrays
3. **Handle errors**: Proper error handling in async actions
4. **Loading states**: Track loading state for async operations
5. **Reset actions**: Provide reset functionality

## Common Mistakes

❌ **Mutating state directly**

```ts
const useStore = create((set) => ({
  items: [],
  addItem: (item) => set((state) => {
    state.items.push(item) // ❌ Mutation
    return state
  }),
}))
```

✅ **Creating new array**

```ts
const useStore = create((set) => ({
  items: [],
  addItem: (item) => set((state) => ({
    items: [...state.items, item] // ✅ New array
  })),
}))
```

❌ **Not handling async errors**

```ts
const useStore = create((set) => ({
  user: null,
  fetchUser: async (id) => {
    const response = await api.getUser(id) // ❌ No error handling
    set({ user: response.data })
  },
}))
```

✅ **Handling async errors**

```ts
const useStore = create((set) => ({
  user: null,
  error: null,
  fetchUser: async (id) => {
    try {
      const response = await api.getUser(id)
      set({ user: response.data, error: null })
    } catch (error) {
      set({ error: error as Error }) // ✅ Error handling
    }
  },
}))
```

❌ **Not using functional updates**

```ts
const useStore = create((set) => ({
  count: 0,
  increment: () => set({ count: count + 1 }) // ❌ Stale closure
}))
```

✅ **Using functional updates**

```ts
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })) // ✅ Functional update
}))
```
