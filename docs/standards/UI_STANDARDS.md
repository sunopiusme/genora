# UI Standards

## Назначение

Правила для собственной UI библиотеки `@genora/ui` и её использования в приложении.

## Принципы

- Доступность на основе Radix primitives; визуальный слой полностью свой.
- Токены дизайна берутся из `@genora/design-tokens`, без «магических» значений в компонентах.
- Компонент не содержит бизнес-логики и не обращается к данным.
- Варианты стилей описываются декларативно (class-variance-authority), без ветвлений в разметке.

## Слои библиотеки

- Primitives — низкоуровневые элементы: Button, Input, Checkbox, Dialog, Tooltip и т.д.
- Components — бизнес-UI: PricingCard, ProductCard, SubscriptionCard, AIProviderBadge, OrderStatus.
- Blocks — готовые секции: HeroSection, PricingSection, CheckoutBlock, DashboardSidebar.

## Документация компонентов

- Каждый компонент имеет Storybook story.
- Спецификация компонента фиксируется по `templates/COMPONENT_SPEC_TEMPLATE.md`.

## Связанные документы

- `architecture/UI_LIBRARY.md`
- `standards/CODE_STANDARD.md`
