"use client";

import { SynoraLogo } from "@genora/ui";
import { ChatTranscript } from "./chat-transcript";
import { useChatStore } from "../stores/chat-store";
import styles from "./synora-home.module.css";

export function SynoraHome() {
  const hasMessages = useChatStore((state) => state.messages.length > 0);

  return (
    <main className={styles.page} data-has-messages={hasMessages}>
      <ChatTranscript />
      <section className={styles.hero} aria-label="Синора">
        <SynoraLogo className={styles.logo} width="100%" height="100%" />
        <h1 className={styles.srOnly}>Синора</h1>
      </section>
    </main>
  );
}
