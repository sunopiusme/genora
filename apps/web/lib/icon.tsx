"use client";

import { Icon as IconifyIcon, addIcon, type IconProps } from "@iconify/react";

/**
 * Иконки регистрируются офлайн через `addIcon`, поэтому `@iconify/react`
 * рендерит их из локального реестра и не обращается к Iconify API во время
 * рантайма.
 *
 * Обёртка `Icon` дополнительно проставляет `ssr`, чтобы иконка рисовалась уже
 * на первом (серверном) рендере, а не подменяла пустой плейсхолдер после
 * монтирования. Иначе `@iconify/react` показывает пустой <span> до `useEffect`,
 * что и вызывает мерцание иконок при загрузке страницы.
 *
 * Набор: Solar (linear), 24x24, MIT. При добавлении новой иконки в разметку
 * её тело нужно добавить сюда.
 */
const SOLAR_ICONS: Record<string, string> = {
  "pen-new-square-linear":
    '<g fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" d="M22 10.5V12c0 4.714 0 7.071-1.465 8.535C19.072 22 16.714 22 12 22s-7.071 0-8.536-1.465C2 19.072 2 16.714 2 12s0-7.071 1.464-8.536C4.93 2 7.286 2 12 2h1.5"/><path d="m16.652 3.455l.649-.649A2.753 2.753 0 0 1 21.194 6.7l-.65.649m-3.892-3.893s.081 1.379 1.298 2.595c1.216 1.217 2.595 1.298 2.595 1.298m-3.893-3.893L10.687 9.42c-.404.404-.606.606-.78.829q-.308.395-.524.848c-.121.255-.211.526-.392 1.068L8.412 13.9m12.133-6.552l-5.965 5.965c-.404.404-.606.606-.829.78a4.6 4.6 0 0 1-.848.524c-.255.121-.526.211-1.068.392l-1.735.579m0 0l-1.123.374a.742.742 0 0 1-.939-.94l.374-1.122m1.688 1.688L8.412 13.9"/></g>',
  "magnifer-linear":
    '<g fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11.5" cy="11.5" r="9.5"/><path stroke-linecap="round" d="M18.5 18.5L22 22"/></g>',
  /* Утолщённые (stroke 2) варианты для строки ассистента. */
  "magnifer-bold-stroke":
    '<g fill="none" stroke="currentColor" stroke-width="2"><circle cx="11.5" cy="11.5" r="9"/><path stroke-linecap="round" d="M18.5 18.5L22 22"/></g>',
  "chat-bubble-bold-stroke":
    '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 11.5a8.38 8.38 0 0 1-.9 3.8a8.5 8.5 0 0 1-7.6 4.7a8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8a8.5 8.5 0 0 1 4.7-7.6a8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z"/>',
  "arrow-up-bold-stroke":
    '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 20V4m0 0l6 6m-6-6l-6 6"/>',
  "close-bold-stroke":
    '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M6 6l12 12M18 6L6 18"/>',
  "shop-2-linear":
    '<g fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" d="M22 22H2m18 0V11M4 22V11"/><path stroke-linejoin="round" d="M16.528 2H7.472c-1.203 0-1.804 0-2.287.299c-.484.298-.753.836-1.29 1.912L2.49 7.76c-.324.82-.608 1.786-.062 2.479A2 2 0 0 0 6 9a2 2 0 1 0 4 0a2 2 0 1 0 4 0a2 2 0 1 0 4 0a2 2 0 0 0 3.571 1.238c.546-.693.262-1.659-.062-2.479l-1.404-3.548c-.537-1.076-.806-1.614-1.29-1.912C18.332 2 17.731 2 16.528 2Z"/><path stroke-linecap="round" d="M9.5 21.5v-3c0-.935 0-1.402.201-1.75a1.5 1.5 0 0 1 .549-.549C10.598 16 11.065 16 12 16s1.402 0 1.75.201a1.5 1.5 0 0 1 .549.549c.201.348.201.815.201 1.75v3"/></g>',
  "card-2-linear":
    '<g fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 12c0-3.771 0-5.657 1.172-6.828S6.229 4 10 4h4c3.771 0 5.657 0 6.828 1.172S22 8.229 22 12s0 5.657-1.172 6.828S17.771 20 14 20h-4c-3.771 0-5.657 0-6.828-1.172S2 15.771 2 12Z"/><path stroke-linecap="round" d="M10 16.5H6m2-3H6M2 10h20"/><path d="M14 15c0-.943 0-1.414.293-1.707S15.057 13 16 13s1.414 0 1.707.293S18 14.057 18 15s0 1.414-.293 1.707S16.943 17 16 17s-1.414 0-1.707-.293S14 15.943 14 15Z"/></g>',
  "bag-4-linear":
    '<g fill="none"><path stroke="currentColor" stroke-width="1.5" d="M3.794 12.03C4.331 9.342 4.6 8 5.487 7.134a4 4 0 0 1 .53-.434C7.04 6 8.41 6 11.15 6h1.703c2.739 0 4.108 0 5.13.7q.285.196.53.435C19.4 8 19.67 9.343 20.207 12.03c.771 3.856 1.157 5.784.269 7.15q-.241.373-.56.683C18.75 21 16.785 21 12.853 21H11.15c-3.933 0-5.899 0-7.065-1.138a4 4 0 0 1-.559-.683c-.888-1.366-.502-3.294.27-7.15Z"/><circle cx="15" cy="9" r="1" fill="currentColor"/><circle cx="9" cy="9" r="1" fill="currentColor"/><path stroke="currentColor" stroke-linecap="round" stroke-width="1.5" d="M9 6V5a3 3 0 1 1 6 0v1"/></g>',
  "user-linear":
    '<g fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="6" r="4"/><path d="M20 17.5c0 2.485 0 4.5-8 4.5s-8-2.015-8-4.5S7.582 13 12 13s8 2.015 8 4.5Z"/></g>',
  "arrow-up-linear":
    '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 20V4m0 0l6 6m-6-6l-6 6"/>',
  "close-linear":
    '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5" d="M6 6l12 12M18 6L6 18"/>',
  "paperclip-linear":
    '<g fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></g>',
  "pin-linear":
    '<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4.5l-4 4l-4 1.5l-1.5 1.5l7 7l1.5-1.5l1.5-4l4-4"/><path d="M9 15l-4.5 4.5"/><path d="M14.5 4l5.5 5.5"/></g>',
  "share-linear":
    '<g fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="17.5" cy="5.5" r="2.75"/><circle cx="6.5" cy="12" r="2.75"/><circle cx="17.5" cy="18.5" r="2.75"/><path stroke-linecap="round" d="M9 10.7l6-3.7M9 13.3l6 3.7"/></g>',
  "square-share-line-linear":
    '<g fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" d="M22 12c0 4.714 0 7.071-1.465 8.535C19.072 22 16.714 22 12 22s-7.071 0-8.536-1.465C2 19.072 2 16.714 2 12s0-7.071 1.464-8.536C4.93 2 7.286 2 12 2"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 12L21 3m0 0h-5.344M21 3v5.344"/></g>',
  "chat-round-linear":
    '<g fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01"/></g>',
  "link-linear":
    '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"><path d="M10.046 14c-1.506-1.512-1.37-4.1.303-5.779l4.848-4.866c1.673-1.68 4.25-1.816 5.757-.305s1.37 4.1-.303 5.78l-2.424 2.433"/><path d="M13.954 10c1.506 1.512 1.37 4.1-.303 5.779l-2.424 2.433l-2.424 2.433c-1.673 1.68-4.25 1.816-5.757.305s-1.37-4.1.303-5.78l2.424-2.433"/></g>',
  "check-read-linear":
    '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m4 12.9l3.143 3.6L15 7.5m5 .063l-8.572 9L11 16"/>',
  "plain-linear":
    '<g fill="none"><path stroke="currentColor" stroke-width="1.5" d="m18.636 15.67l1.716-5.15c1.5-4.498 2.25-6.747 1.062-7.934s-3.436-.438-7.935 1.062L8.33 5.364C4.7 6.574 2.885 7.18 2.37 8.067a2.72 2.72 0 0 0 0 2.73c.515.888 2.33 1.493 5.96 2.704c.584.194.875.291 1.119.454c.236.158.439.361.597.597c.163.244.26.535.454 1.118c1.21 3.63 1.816 5.446 2.703 5.962a2.72 2.72 0 0 0 2.731 0c.887-.516 1.492-2.331 2.703-5.962Z"/><path fill="currentColor" d="M16.212 8.848a.75.75 0 0 0-1.055-1.066zm-5.55 5.488l5.55-5.488l-1.055-1.066l-5.55 5.488z"/></g>',
};

for (const [name, body] of Object.entries(SOLAR_ICONS)) {
  addIcon(`solar:${name}`, { body, width: 24, height: 24 });
}

export function Icon(props: IconProps) {
  return <IconifyIcon ssr {...props} />;
}
