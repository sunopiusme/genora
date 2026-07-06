"use client";

import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Button, cn } from "@genora/ui";
import { useAuthStore } from "@/stores/auth-store";

import {
  VERIFICATION_CODE_LENGTH,
  verificationSchema,
} from "../schemas/verification-schema";
import styles from "./verify-card.module.css";

const RESEND_SECONDS = 30;
const FALLBACK_EMAIL = "user@genora.app";

function createEmptyDigits() {
  return Array<string>(VERIFICATION_CODE_LENGTH).fill("");
}

export function VerifyCard({ email }: { email?: string }) {
  const login = useAuthStore((state) => state.login);
  const openLogin = useAuthStore((state) => state.openLogin);
  const [digits, setDigits] = useState<string[]>(createEmptyDigits);
  const [hasError, setHasError] = useState(false);
  const [wasResent, setWasResent] = useState(false);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cellRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setInterval(() => setSeconds((value) => value - 1), 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  const code = digits.join("");
  const isComplete = verificationSchema.safeParse({ code }).success;

  function clearFeedback() {
    setHasError(false);
    setWasResent(false);
  }

  function submitCode() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    clearFeedback();
    setTimeout(() => {
      login(email ?? FALLBACK_EMAIL);
    }, 300);
  }

  function setDigit(index: number, rawValue: string) {
    if (isSubmitting) return;
    const digit = rawValue.replace(/\D/g, "").slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = digit;
    setDigits(nextDigits);
    clearFeedback();
    if (digit && index < VERIFICATION_CODE_LENGTH - 1) {
      cellRefs.current[index + 1]?.focus();
    }
    if (nextDigits.every((entry) => entry !== "")) submitCode();
  }

  function handleKeyDown(
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      cellRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const pastedDigits = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, VERIFICATION_CODE_LENGTH);
    if (!pastedDigits) return;
    event.preventDefault();
    const nextDigits = createEmptyDigits();
    for (let index = 0; index < pastedDigits.length; index += 1) {
      nextDigits[index] = pastedDigits.charAt(index);
    }
    setDigits(nextDigits);
    clearFeedback();
    const lastFilledIndex = Math.min(
      pastedDigits.length,
      VERIFICATION_CODE_LENGTH - 1,
    );
    cellRefs.current[lastFilledIndex]?.focus();
    if (nextDigits.every((entry) => entry !== "")) submitCode();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isComplete) {
      setHasError(true);
      return;
    }
    submitCode();
  }

  function handleResend() {
    if (seconds > 0) return;
    setSeconds(RESEND_SECONDS);
    setDigits(createEmptyDigits());
    setHasError(false);
    setWasResent(true);
    cellRefs.current[0]?.focus();
  }

  function getMessage(): string {
    if (hasError) return "Введите 6‑значный код из письма";
    if (wasResent) return "Новый код отправлен";
    return "";
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.cells} onPaste={handlePaste}>
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              cellRefs.current[index] = element;
            }}
            value={digit}
            onChange={(event) => setDigit(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            disabled={isSubmitting}
            aria-label={`Цифра ${index + 1}`}
            aria-invalid={hasError}
            className={cn(
              styles.cell,
              hasError && styles.cellError,
              !hasError && isComplete && styles.cellComplete,
            )}
          />
        ))}
      </div>

      <p
        className={cn(
          styles.message,
          hasError && styles.messageError,
          !hasError && wasResent && styles.messageSuccess,
        )}
        role="alert"
      >
        {getMessage()}
      </p>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={isSubmitting}
        className={styles.submit}
      >
        Подтвердить
      </Button>

      <div className={styles.footer}>
        <button type="button" onClick={openLogin} className={styles.link}>
          Изменить почту
        </button>
        <button
          type="button"
          onClick={handleResend}
          disabled={seconds > 0}
          className={styles.resend}
        >
          {seconds > 0
            ? `Отправить снова через ${seconds} с`
            : "Отправить код снова"}
        </button>
      </div>
    </form>
  );
}
