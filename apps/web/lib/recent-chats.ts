export type ProjectGroup = {
  name: string;
  branch: string;
  chats: string[];
};

export const PROJECT_GROUPS: ProjectGroup[] = [
  {
    name: "Genora",
    branch: "main",
    chats: ["Не приходит код подтверждения", "Ошибка гидрации на главной"],
  },
  {
    name: "Синора",
    branch: "feat/synora-composer",
    chats: ["Picker проектов и веток", "Загрузка файлов в песочницу"],
  },
  {
    name: "Витрина",
    branch: "feat/products-showcase",
    chats: [
      "Карточки товаров на витрине",
      "Анимация появления секций",
      "Адаптив витрины на мобильных",
    ],
  },
];
