import type { Meta, StoryObj } from "@storybook/react";
import { Avatar } from "./avatar";

const meta = {
  title: "Components/Avatar",
  component: Avatar,
  args: {
    name: "Иван Петров",
  },
} satisfies Meta<typeof Avatar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        padding: "1.5rem",
        background: "#000",
        borderRadius: "0.75rem",
      }}
    >
      {[
        "Иван Петров",
        "Анна Смирнова",
        "Олег Ким",
        "Мария Ли",
        "Denis Volkov",
        "Sasha Orlova",
      ].map((name) => (
        <Avatar key={name} name={name} size="3rem" />
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
      <Avatar name="Иван Петров" size="1.625rem" />
      <Avatar name="Иван Петров" size="2.5rem" />
      <Avatar name="Иван Петров" size="4rem" />
    </div>
  ),
};
