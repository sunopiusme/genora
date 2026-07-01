import { cn } from "@genora/ui";
import styles from "./support-link.module.css";

export function SupportLink({ className }: { className?: string }) {
  return (
    <p className={cn(styles.root, className)}>
      Нужна помощь?{" "}
      <a href="mailto:support@genora.pro" className={styles.link}>
        Поддержка
      </a>
    </p>
  );
}
