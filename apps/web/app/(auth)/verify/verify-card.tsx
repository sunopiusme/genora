"use client";

import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Button, cn } from "@genora/ui";
import styles from "./verify-card.module.css";

const LENGTH = 6;
const RESEND_SECONDS = 30;

export function VerifyCard() {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(""));
  const [error, setError] = useState(false);
  const [resent, setResent] = useState(false);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [submitting, setSubmitting] = useState(false);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setInterval(() => setSeconds((value) => value - 1), 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  const code = digits.join("");
  const complete = code.length === LENGTH;

  function submitCode() {
    if (submitting) return;
    setSubmitting(true);
    setError(false);
    setResent(false);
    setTimeout(() => router.push("/dashboard"), 300);
  }

  function setDigit(index: number, raw: string) {
    if (submitting) return;
    const value = raw.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    setError(false);
    setResent(false);
    if (value && index < LENGTH - 1) refs.current[index + 1]?.focus();
    if (next.every((entry) => entry !== "")) submitCode();
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const text = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, LENGTH);
    if (!text) return;
    event.preventDefault();
    const next = Array(LENGTH).fill("");
    for (let i = 0; i < text.length; i += 1) next[i] = text[i];
    setDigits(next);
    setError(false);
    setResent(false);
    refs.current[Math.min(text.length, LENGTH - 1)]?.focus();
    if (next.every((entry) => entry !== "")) submitCode();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (code.length < LENGTH) {
      setError(true);
      return;
    }
    submitCode();
  }

  function handleResend() {
    if (seconds > 0) return;
    setSeconds(RESEND_SECONDS);
    setDigits(Array(LENGTH).fill(""));
    setError(false);
    setResent(true);
    refs.current[0]?.focus();
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.cells} onPaste={handlePaste}>
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              refs.current[index] = element;
            }}
            value={digit}
            onChange={(event) => setDigit(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            disabled={submitting}
            aria-label={`Цифра ${index + 1}`}
            aria-invalid={error}
            className={cn(
              styles.cell,
              error && styles.cellError,
              !error && complete && styles.cellComplete,
            )}
          />
        ))}
      </div>

      <p
        className={cn(
          styles.message,
          error && styles.messageError,
          !error && resent && styles.messageSuccess,
        )}
        role="alert"
      >
        {error
          ? "Введите 6‑значный код из письма"
          : resent
            ? "Новый код отправлен"
            : ""}
      </p>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={submitting}
        className={styles.submit}
      >
        Подтвердить
      </Button>

      <div className={styles.footer}>
        <a href="/login" className={styles.link}>
          Изменить почту
        </a>
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
