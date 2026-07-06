"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button, cn } from "@genora/ui";
import { useAuthStore } from "@/stores/auth-store";

import {
  VERIFICATION_CODE_LENGTH,
  verificationSchema,
} from "../schemas/verification-schema";
import styles from "./verify-card.module.css";

const RESEND_SECONDS = 30;
const FALLBACK_EMAIL = "user@genora.app";

export function VerifyCard({ email }: { email?: string }) {
  const login = useAuthStore((state) => state.login);
  const openLogin = useAuthStore((state) => state.openLogin);
  const [code, setCode] = useState("");
  const [hasError, setHasError] = useState(false);
  const [wasResent, setWasResent] = useState(false);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setInterval(() => setSeconds((value) => value - 1), 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  const isComplete = verificationSchema.safeParse({ code }).success;
  const activeIndex = Math.min(code.length, VERIFICATION_CODE_LENGTH - 1);

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

  function handleChange(rawValue: string) {
    if (isSubmitting) return;
    const nextCode = rawValue
      .replace(/\D/g, "")
      .slice(0, VERIFICATION_CODE_LENGTH);
    setCode(nextCode);
    clearFeedback();
    if (nextCode.length === VERIFICATION_CODE_LENGTH) submitCode();
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
    setCode("");
    setHasError(false);
    setWasResent(true);
    inputRef.current?.focus();
  }

  function getMessage(): string {
    if (hasError) return "Введите 6‑значный код из письма";
    if (wasResent) return "Новый код отправлен";
    return "";
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div
        className={cn(
          styles.codeField,
          hasError && styles.codeFieldError,
          !hasError && isComplete && styles.codeFieldComplete,
        )}
        onClick={() => inputRef.current?.focus()}
      >
        <input
          ref={inputRef}
          value={code}
          onChange={(event) => handleChange(event.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={VERIFICATION_CODE_LENGTH}
          disabled={isSubmitting}
          aria-label="Код подтверждения"
          aria-invalid={hasError}
          className={styles.codeInput}
        />
        {Array.from({ length: VERIFICATION_CODE_LENGTH }, (_, index) => (
          <span
            key={index}
            aria-hidden="true"
            className={cn(
              styles.slot,
              isFocused && index === activeIndex && styles.slotActive,
            )}
          >
            {code[index] ?? ""}
            {isFocused && index === activeIndex && !code[index] && (
              <span className={styles.caret} />
            )}
          </span>
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
