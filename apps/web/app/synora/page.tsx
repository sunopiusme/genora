import { SynoraHome } from "@features/synora";

/**
 * Главная «Синоры». Если пользователь пришёл из списка недавних
 * песочниц, в query приходит ?project=<название> — тогда приветствие
 * упоминает проект («Продолжим работу над „X“?»), иначе показываем
 * общий вариант («Чем займёмся сегодня?»).
 */
export default async function SynoraHomePage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project } = await searchParams;
  return <SynoraHome projectName={project?.trim() || undefined} />;
}
