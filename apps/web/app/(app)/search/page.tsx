import type { Metadata } from "next";
import { SearchView } from "@/components/shared/search-view";

export const metadata: Metadata = {
  title: "Поиск",
  description: "Поиск по вашим чатам",
};

export default function SearchPage() {
  return <SearchView />;
}
