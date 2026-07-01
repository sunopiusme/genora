# UI Library

## Назначение

`@genora/ui` — собственная UI библиотека. Это не набор внешних компонентов, а
дизайн-системный слой, исходниками которого мы владеем.

## Слои

### Primitives

Низкоуровневые элементы на Radix primitives:

```
Button, Input, Checkbox, Dialog, Tooltip, Card, Modal, Dropdown, Table, Toast
```

### Components

Бизнес-UI поверх primitives:

```
PricingCard, ProductCard, SubscriptionCard, AIProviderBadge, OrderStatus
```

### Blocks

Готовые секции страниц:

```
HeroSection, PricingSection, CheckoutBlock, DashboardSidebar
```

## Структура пакета

```
packages/ui/
├── primitives/<name>/<name>.tsx + <name>.stories.tsx + index.ts
├── components/<name>/<name>.tsx + <name>.stories.tsx + index.ts
├── blocks/<name>/<name>.tsx + index.ts
└── index.ts
```

## Правила

- Компоненты используют токены из `@genora/design-tokens`.
- Доступность обеспечивается Radix; визуальный слой полностью свой.
- Каждый компонент имеет Storybook story.
- Использование: `import { Button } from "@genora/ui"`.

## Связанные документы

- `standards/UI_STANDARDS.md`
- `templates/COMPONENT_SPEC_TEMPLATE.md`
