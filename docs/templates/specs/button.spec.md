# Component Spec: Button

- Name: Button
- Layer: primitive
- Purpose: Базовый интерактивный элемент действия. Единая точка для всех кнопок приложения.
- Props (contract):
  - `variant`: "primary" | "secondary" | "ghost" (по умолчанию "primary")
  - `size`: "sm" | "md" | "lg" (по умолчанию "md")
  - наследует все нативные атрибуты `button` (`onClick`, `disabled`, `type` и т.д.)
- Variants:
  - primary — белый фон, тёмный текст (основное действие)
  - secondary — прозрачный фон, бордер, светлый текст (вторичное действие)
  - ghost — без фона и бордера, приглушённый текст (третичное действие)
- States: default, hover, focus-visible (ring), disabled (opacity + блокировка событий)
- Accessibility (Radix basis): нативный `<button>`; видимый focus-ring через `focus-visible`.
- Design tokens used: primary, primary-foreground, foreground, foreground-muted, border, surface-elevated, borderRadius.lg, fontWeight.medium, fontSize.sm/base
- Storybook stories: Primary, Secondary, Ghost, Sizes
