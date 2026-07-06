import { AuthCard } from "@features/auth";

import { AuthBackdrop } from "../auth-backdrop";
import { AuthModal } from "../auth-modal";

export default function LoginPage() {
  return (
    <main>
      <AuthBackdrop />
      <AuthModal title="Вход в Genora">
        <AuthCard />
      </AuthModal>
    </main>
  );
}
