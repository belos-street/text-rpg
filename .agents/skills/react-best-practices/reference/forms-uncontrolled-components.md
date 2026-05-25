---
name: forms-uncontrolled-components
description: Use uncontrolled components with useRef for simple forms or when integrating with non-React libraries.
---

# Uncontrolled Components

Use uncontrolled components with useRef for simple forms or when integrating with non-React libraries.

## The Problem

```tsx
// DON'T - Over-engineering simple forms
function SimpleForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log({ name, email })
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button type="submit">Submit</button>
    </form>
  )
}
```

## The Solution

```tsx
// DO - Using uncontrolled components
function SimpleForm() {
  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log({
      name: nameRef.current?.value,
      email: emailRef.current?.value
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <input ref={nameRef} />
      <input ref={emailRef} />
      <button type="submit">Submit</button>
    </form>
  )
}
```

## Common Patterns

### 1. Basic Uncontrolled Input

```tsx
function BasicInput() {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = () => {
    console.log(inputRef.current?.value)
  }

  return (
    <div>
      <input ref={inputRef} />
      <button onClick={handleSubmit}>Submit</button>
    </div>
  )
}
```

### 2. Uncontrolled Form with Multiple Inputs

```tsx
function ContactForm() {
  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const messageRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log({
      name: nameRef.current?.value,
      email: emailRef.current?.value,
      message: messageRef.current?.value
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <input ref={nameRef} placeholder="Name" />
      <input ref={emailRef} placeholder="Email" />
      <textarea ref={messageRef} placeholder="Message" />
      <button type="submit">Submit</button>
    </form>
  )
}
```

### 3. Uncontrolled Checkbox

```tsx
function Checkbox() {
  const checkboxRef = useRef<HTMLInputElement>(null)

  const handleSubmit = () => {
    console.log(checkboxRef.current?.checked)
  }

  return (
    <div>
      <label>
        <input ref={checkboxRef} type="checkbox" />
        Check me
      </label>
      <button onClick={handleSubmit}>Submit</button>
    </div>
  )
}
```

### 4. Uncontrolled Radio Buttons

```tsx
function RadioButtons() {
  const radioRef = useRef<HTMLInputElement>(null)

  const handleSubmit = () => {
    const selected = document.querySelector('input[name="option"]:checked') as HTMLInputElement
    console.log(selected?.value)
  }

  return (
    <div>
      <label>
        <input name="option" type="radio" value="option1" />
        Option 1
      </label>
      <label>
        <input name="option" type="radio" value="option2" />
        Option 2
      </label>
      <button onClick={handleSubmit}>Submit</button>
    </div>
  )
}
```

### 5. Uncontrolled Select

```tsx
function Select() {
  const selectRef = useRef<HTMLSelectElement>(null)

  const handleSubmit = () => {
    console.log(selectRef.current?.value)
  }

  return (
    <div>
      <select ref={selectRef}>
        <option value="">Select an option</option>
        <option value="option1">Option 1</option>
        <option value="option2">Option 2</option>
      </select>
      <button onClick={handleSubmit}>Submit</button>
    </div>
  )
}
```

### 6. Uncontrolled File Input

```tsx
function FileInput() {
  const fileRef = useRef<HTMLInputElement>(null)

  const handleSubmit = () => {
    const file = fileRef.current?.files?.[0]
    console.log(file?.name)
  }

  return (
    <div>
      <input ref={fileRef} type="file" />
      <button onClick={handleSubmit}>Submit</button>
    </div>
  )
}
```

### 7. Resetting Uncontrolled Form

```tsx
function ResetForm() {
  const formRef = useRef<HTMLFormElement>(null)

  const handleReset = () => {
    formRef.current?.reset()
  }

  return (
    <form ref={formRef}>
      <input name="name" placeholder="Name" />
      <input name="email" placeholder="Email" />
      <button type="button" onClick={handleReset}>Reset</button>
    </form>
  )
}
```

### 8. Focusing Uncontrolled Input

```tsx
function FocusInput() {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return <input ref={inputRef} placeholder="Auto-focused" />
}
```

### 9. Integrating with Third-Party Libraries

```tsx
function DatePicker() {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const picker = new Pikaday({
      field: inputRef.current!,
      format: 'YYYY-MM-DD'
    })

    return () => picker.destroy()
  }, [])

  const handleSubmit = () => {
    console.log(inputRef.current?.value)
  }

  return (
    <div>
      <input ref={inputRef} />
      <button onClick={handleSubmit}>Submit</button>
    </div>
  )
}
```

### 10. Default Values

```tsx
function DefaultValues() {
  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (nameRef.current) nameRef.current.value = 'John Doe'
    if (emailRef.current) emailRef.current.value = 'john@example.com'
  }, [])

  const handleSubmit = () => {
    console.log({
      name: nameRef.current?.value,
      email: emailRef.current?.value
    })
  }

  return (
    <form>
      <input ref={nameRef} placeholder="Name" />
      <input ref={emailRef} placeholder="Email" />
      <button type="button" onClick={handleSubmit}>Submit</button>
    </form>
  )
}
```

## Common Mistakes

### Mistake 1. Accessing Ref Before Mount

```tsx
// DON'T - Accessing ref before mount
function Form() {
  const inputRef = useRef<HTMLInputElement>(null)

  console.log(inputRef.current?.value)

  return <input ref={inputRef} />
}

// DO - Accessing ref after mount
function Form() {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    console.log(inputRef.current?.value)
  }, [])

  return <input ref={inputRef} />
}
```

### Mistake 2. Not Checking for Null

```tsx
// DON'T - Not checking for null
function Form() {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = () => {
    console.log(inputRef.current.value)
  }

  return <input ref={inputRef} />
}

// DO - Checking for null
function Form() {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = () => {
    console.log(inputRef.current?.value)
  }

  return <input ref={inputRef} />
}
```

### Mistake 3. Using Uncontrolled for Complex Forms

```tsx
// DON'T - Using uncontrolled for complex forms
function ComplexForm() {
  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const confirmPasswordRef = useRef<HTMLInputElement>(null)

  const validate = () => {
    // Complex validation logic
  }

  return (
    <form>
      <input ref={nameRef} />
      <input ref={emailRef} />
      <input ref={passwordRef} type="password" />
      <input ref={confirmPasswordRef} type="password" />
    </form>
  )
}

// DO - Using controlled for complex forms
function ComplexForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const validate = () => {
    // Complex validation logic
  }

  return (
    <form>
      <input
        name="name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      <input
        name="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />
      <input
        name="password"
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
      />
      <input
        name="confirmPassword"
        type="password"
        value={formData.confirmPassword}
        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
      />
    </form>
  )
}
```

## When to Use Uncontrolled Components

### 1. Simple Forms

```tsx
function SimpleForm() {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = () => {
    console.log(inputRef.current?.value)
  }

  return (
    <div>
      <input ref={inputRef} />
      <button onClick={handleSubmit}>Submit</button>
    </div>
  )
}
```

### 2. Integrating with Non-React Libraries

```tsx
function ThirdPartyInput() {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const library = new ThirdPartyLibrary(inputRef.current!)
    return () => library.destroy()
  }, [])

  return <input ref={inputRef} />
}
```

### 3. Performance Critical Scenarios

```tsx
function HighPerformanceForm() {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = () => {
    console.log(inputRef.current?.value)
  }

  return (
    <div>
      <input ref={inputRef} />
      <button onClick={handleSubmit}>Submit</button>
    </div>
  )
}
```

## Key Takeaways

- Use uncontrolled components for simple forms
- Use useRef to access DOM elements
- Check for null when accessing refs
- Use uncontrolled for third-party library integration
- Use uncontrolled for performance-critical scenarios
- Use controlled for complex forms with validation
- Use controlled for dynamic forms
- Reset uncontrolled forms with form.reset()
