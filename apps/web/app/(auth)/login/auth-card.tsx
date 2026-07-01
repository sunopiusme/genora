"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, cn } from "@genora/ui";
import styles from "./auth-card.module.css";

type Mode = "register" | "login";

type FieldErrors = {
  email?: string;
  password?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthCard() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const isRegister = mode === "register";
  const emailValid = EMAIL_RE.test(email.trim());

  function switchMode(next: Mode) {
    setMode(next);
    setErrors({});
  }

  function clearError(field: keyof FieldErrors) {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FieldErrors = {};
    if (!EMAIL_RE.test(email.trim())) {
      nextErrors.email = "Введи корректный логин";
    }
    if (!password) {
      nextErrors.password = "Введи корректный пароль";
    }

    setErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) {
      return;
    }

    router.push(`/verify?email=${encodeURIComponent(email.trim())}`);
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          {isRegister ? "Создайте аккаунт" : "С возвращением"}
        </h1>
      </div>

      <div className={styles.social}>
        <Button variant="secondary" size="lg" className={styles.socialButton}>
          <YandexMark />
          Войти через Yandex
        </Button>
        <Button variant="secondary" size="lg" className={styles.socialButton}>
          <VKMark />
          Войти через VK
        </Button>
      </div>

      <div className={styles.divider}>
        <span className={styles.dividerLine} />
        <span className={styles.dividerText}>или</span>
        <span className={styles.dividerLine} />
      </div>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <Field error={errors.email} valid={emailValid}>
          <Input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              clearError("email");
            }}
            aria-invalid={errors.email ? true : undefined}
          />
        </Field>
        <Field error={errors.password}>
          <Input
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete={isRegister ? "new-password" : "current-password"}
            placeholder="Пароль"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              clearError("password");
            }}
            aria-invalid={errors.password ? true : undefined}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={styles.toggleButton}
            aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </Field>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className={styles.submit}
        >
          {isRegister ? "Создать аккаунт" : "Продолжить"}
        </Button>
      </form>

      <p className={styles.footer}>
        {isRegister ? "Уже есть аккаунт? " : "Ещё нет аккаунта? "}
        <button
          type="button"
          onClick={() => switchMode(isRegister ? "login" : "register")}
          className={styles.switchButton}
        >
          {isRegister ? "Войти" : "Зарегистрироваться"}
        </button>
      </p>
    </div>
  );
}

function Field({
  error,
  valid,
  children,
}: {
  error?: string;
  valid?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.field}>
      <div className={styles.inputRow}>
        {children}
        {valid && !error ? (
          <span className={styles.validMark} aria-hidden="true">
            <CheckMark />
          </span>
        ) : null}
      </div>
      <p className={cn(styles.hint, error && styles.hintError)} role="alert">
        {error}
      </p>
    </div>
  );
}

function CheckMark() {
  return (
    <svg viewBox="0 0 20 20" width="1rem" height="1rem" fill="none">
      <path
        d="M4 10.5 8 14.5 16 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function YandexMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={styles.brandMark}>
      <path d="M2.04 12c0-5.523 4.476-10 10-10 5.522 0 10 4.477 10 10s-4.478 10-10 10c-5.524 0-10-4.477-10-10Zm11.061 5.6h1.86V6.4h-2.703c-2.713 0-4.14 1.392-4.14 3.447 0 1.64.783 2.603 2.175 3.593l-2.42 3.62.062.14h2.08l2.71-4.05-.94-.63c-1.13-.76-1.687-1.354-1.687-2.633 0-1.13.794-1.892 2.283-1.892h.46V17.6Z" />
    </svg>
  );
}

function VKMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={styles.brandMark}>
      <path d="M15.07 2H8.93C3.33 2 2 3.33 2 8.93v6.14C2 20.67 3.33 22 8.93 22h6.14c5.6 0 6.93-1.33 6.93-6.93V8.93C22 3.33 20.66 2 15.07 2Zm3.15 14.27h-1.4c-.53 0-.69-.42-1.64-1.37-.83-.8-1.19-.9-1.39-.9-.28 0-.36.08-.36.47v1.26c0 .33-.11.53-.97.53-1.42 0-3-.86-4.1-2.46-1.66-2.33-2.12-4.08-2.12-4.44 0-.2.08-.38.47-.38h1.4c.35 0 .48.16.62.53.69 2 1.84 3.74 2.31 3.74.18 0 .26-.08.26-.53V11.3c-.06-.97-.57-1.05-.57-1.4 0-.16.14-.33.36-.33h2.2c.3 0 .4.16.4.51v2.74c0 .3.13.4.22.4.18 0 .32-.1.64-.43 1-1.12 1.71-2.84 1.71-2.84.1-.2.26-.4.6-.4h1.4c.42 0 .51.22.42.51-.18.81-1.88 3.2-1.88 3.2-.15.24-.2.35 0 .62.15.2.62.62.93.99.58.66 1.02 1.21 1.14 1.6.13.38-.07.58-.46.58Z" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={styles.toggleIcon}
      aria-hidden="true"
    >
      <path
        d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={styles.toggleIcon}
      aria-hidden="true"
    >
      <path
        d="m2 2 20 20M6.71 6.7a13.38 13.38 0 0 0-4.7 5.3s3 7 10 7a9.26 9.26 0 0 0 5.3-1.7m-2.5-5.3a3 3 0 1 1-4.24-4.24M12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
