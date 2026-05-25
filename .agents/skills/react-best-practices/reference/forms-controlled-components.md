---
name: forms-controlled-components
description: Use controlled components for form inputs to have full control over form state.
---

# Controlled Components

Use controlled components for form inputs to have full control over form state.

## The Problem

```tsx
// DON'T - Uncontrolled component
function Form() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    console.log(formData.get('name'))
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" />
      <button type="submit">Submit</button>
    </form>
  )
}
```

## The Solution

```tsx
// DO - Controlled component
function Form() {
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log(name)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button type="submit">Submit</button>
    </form>
  )
}
```

## Common Patterns

### 1. Basic Controlled Input

```tsx
function NameInput() {
  const [name, setName] = useState('')

  return (
    <div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter your name"
      />
      <p>Hello, {name || 'stranger'}!</p>
    </div>
  )
}
```

### 2. Controlled Checkbox

```tsx
function Checkbox() {
  const [checked, setChecked] = useState(false)

  return (
    <label>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
      />
      {checked ? 'Checked' : 'Unchecked'}
    </label>
  )
}
```

### 3. Controlled Radio Buttons

```tsx
function RadioButton() {
  const [selected, setSelected] = useState('option1')

  return (
    <div>
      <label>
        <input
          type="radio"
          value="option1"
          checked={selected === 'option1'}
          onChange={(e) => setSelected(e.target.value)}
        />
        Option 1
      </label>
      <label>
        <input
          type="radio"
          value="option2"
          checked={selected === 'option2'}
          onChange={(e) => setSelected(e.target.value)}
        />
        Option 2
      </label>
      <p>Selected: {selected}</p>
    </div>
  )
}
```

### 4. Controlled Select

```tsx
function Select() {
  const [value, setValue] = useState('')

  return (
    <div>
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
      >
        <option value="">Select an option</option>
        <option value="option1">Option 1</option>
        <option value="option2">Option 2</option>
      </select>
      <p>Selected: {value}</p>
    </div>
  )
}
```

### 5. Controlled Textarea

```tsx
function Textarea() {
  const [text, setText] = useState('')

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        cols={50}
      />
      <p>Character count: {text.length}</p>
    </div>
  )
}
```

### 6. Controlled File Input

```tsx
function FileInput() {
  const [file, setFile] = useState<File | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  return (
    <div>
      <input
        type="file"
        onChange={handleChange}
      />
      {file && <p>Selected: {file.name}</p>}
    </div>
  )
}
```

### 7. Multiple Controlled Inputs

```tsx
function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log(formData)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Name"
      />
      <input
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Email"
      />
      <textarea
        name="message"
        value={formData.message}
        onChange={handleChange}
        placeholder="Message"
      />
      <button type="submit">Submit</button>
    </form>
  )
}
```

### 8. Controlled Form with Validation

```tsx
function ValidatedForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setErrors(prev => {
      const { [name]: removed, ...rest } = prev
      return rest
    })
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      console.log(formData)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Name"
        />
        {errors.name && <span className="error">{errors.name}</span>}
      </div>
      <div>
        <input
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
        />
        {errors.email && <span className="error">{errors.email}</span>}
      </div>
      <button type="submit">Submit</button>
    </form>
  )
}
```

## Common Mistakes

### Mistake 1. Not Controlling Value

```tsx
// DON'T - Not controlling value
function Form() {
  const [value, setValue] = useState('')

  return (
    <input
      onChange={(e) => setValue(e.target.value)}
    />
  )
}

// DO - Controlling value
function Form() {
  const [value, setValue] = useState('')

  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  )
}
```

### Mistake 2. Mutating State Directly

```tsx
// DON'T - Mutating state directly
function Form() {
  const [formData, setFormData] = useState({ name: '', email: '' })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    formData[e.target.name] = e.target.value
    setFormData(formData)
  }

  return <input name="name" value={formData.name} onChange={handleChange} />
}

// DO - Creating new state
function Form() {
  const [formData, setFormData] = useState({ name: '', email: '' })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return <input name="name" value={formData.name} onChange={handleChange} />
}
```

### Mistake 3. Not Handling onChange

```tsx
// DON'T - Not handling onChange
function Form() {
  const [value, setValue] = useState('')

  return <input value={value} />
  // Input is read-only!
}

// DO - Handling onChange
function Form() {
  const [value, setValue] = useState('')

  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  )
}
```

## Key Takeaways

- Use controlled components for form inputs
- Control both value and onChange
- Create new state objects, don't mutate
- Handle all input types consistently
- Validate controlled inputs easily
- Reset controlled inputs easily
- Access form values in state
- Combine with validation logic
