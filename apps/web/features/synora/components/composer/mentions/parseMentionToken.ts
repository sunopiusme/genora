/* ─────────────────────────────────────────
   Парсинг текущего @-токена в textarea.

   Берём текст слева от каретки и ищем
   последний символ @, перед которым стоит
   либо начало строки, либо пробел/перенос.
   Всё что после него и до каретки — query.

   Возвращаем null если токена нет: курсор
   стоит не в @-mention позиции, popover
   должен быть закрыт.
   ───────────────────────────────────────── */

export type MentionToken = {
  /** позиция символа @ в общем value */
  start: number;
  /** позиция каретки = конец query */
  end: number;
  /** текст после @ до каретки, нижний регистр */
  query: string;
};

export function parseMentionToken(
  value: string,
  caret: number,
): MentionToken | null {
  const left = value.slice(0, caret);
  const atIndex = left.lastIndexOf("@");
  if (atIndex === -1) return null;

  // Перед @ должен быть пробел/перенос или начало строки.
  const prevChar = atIndex > 0 ? left[atIndex - 1] : "";
  if (prevChar && !/\s/.test(prevChar)) return null;

  // В query не должно быть пробелов — иначе токен
  // уже «закрылся» и mention неактивен.
  const query = left.slice(atIndex + 1);
  if (/\s/.test(query)) return null;

  return {
    start: atIndex,
    end: caret,
    query: query.toLowerCase(),
  };
}
