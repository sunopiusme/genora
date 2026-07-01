import type { Meta, StoryObj } from "@storybook/react";
import { Logo } from "./logo";

const meta = {
  title: "Components/Logo",
  component: Logo,
} satisfies Meta<typeof Logo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
      <Logo width="1.5rem" height="1.5rem" />
      <Logo width="2.5rem" height="2.5rem" />
      <Logo width="4rem" height="4rem" />
    </div>
  ),
};
