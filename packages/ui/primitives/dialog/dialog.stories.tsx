import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

const meta = {
  title: "Primitives/Dialog",
  component: Dialog,
} satisfies Meta<typeof Dialog>;

export default meta;

type Story = StoryObj<typeof meta>;

const panelStyle = {
  top: "50%",
  left: "50%",
  width: "min(28rem, calc(100vw - 2rem))",
  transform: "translate(-50%, -50%)",
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
  padding: "1.5rem",
  borderRadius: "1rem",
  border: "1px solid var(--color-border)",
  backgroundColor: "var(--color-surface)",
} as const;

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Открыть диалог</Button>
      </DialogTrigger>
      <DialogContent style={panelStyle}>
        <DialogTitle style={{ margin: 0 }}>Подтверждение</DialogTitle>
        <DialogDescription
          style={{ margin: 0, color: "var(--color-foreground-muted)" }}
        >
          Диалог закрывается по Esc, по клику на фон и по кнопке.
        </DialogDescription>
        <DialogClose asChild>
          <Button variant="secondary">Закрыть</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  ),
};
