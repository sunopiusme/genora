import type { Metadata } from "next";
import { SearchView } from "@/components/shared/search-view";

export const metadata: Metadata = {
  title: "Поиск — Genora",
  description: "Поиск по вашим запросам и чатам",
};

export default function SearchPage() {
  return <SearchView />;
}
