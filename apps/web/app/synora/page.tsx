import { SynoraHome } from "@features/synora";

export default async function SynoraHomePage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project } = await searchParams;
  return <SynoraHome projectName={project?.trim() || undefined} />;
}
