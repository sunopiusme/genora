"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, cn } from "@genora/ui";

import { loginSchema } from "../schemas/login-schema";
import type { AuthMode } from "../types";
import styles from "./auth-card.module.css";

type FieldErrors = {
  email?: string;
  password?: string;
};

function getEmailError(email: string): string | undefined {
  const result = loginSchema.shape.email.safeParse(email);
  if (result.success) return undefined;
  return result.error.issues[0]?.message;
}

function getPasswordError(password: string): string | undefined {
  const result = loginSchema.shape.password.safeParse(password);
  if (result.success) return undefined;
  return result.error.issues[0]?.message;
}

export function AuthCard() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const isRegister = mode === "register";

  function switchMode(next: AuthMode) {
    setMode(next);
    setErrors({});
  }

  function clearError(field: keyof FieldErrors) {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const emailError = getEmailError(email);
    if (emailError) {
      setErrors({ email: emailError });
      emailRef.current?.focus();
      return;
    }

    const passwordError = getPasswordError(password);
    if (passwordError) {
      const isPasswordFocused = document.activeElement === passwordRef.current;
      setErrors(isPasswordFocused ? { password: passwordError } : {});
      passwordRef.current?.focus();
      return;
    }

    setErrors({});
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
          <GoogleMark />
          Войти через Google
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
        <Field error={errors.email}>
          <Input
            ref={emailRef}
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
            ref={passwordRef}
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
  children,
}: {
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.field}>
      <div className={styles.inputRow}>{children}</div>
      <p className={cn(styles.hint, error && styles.hintError)} role="alert">
        {error}
      </p>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={styles.brandMark}>
      <path
        fill="#4285F4"
        d="M23.06 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h6.2a5.3 5.3 0 0 1-2.3 3.48v2.9h3.72c2.18-2 3.44-4.96 3.44-8.39Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.11 0 5.72-1.03 7.63-2.79l-3.72-2.9c-1.03.69-2.36 1.1-3.91 1.1-3.01 0-5.56-2.03-6.47-4.77H1.69v3A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.53 14.64a7.2 7.2 0 0 1 0-4.61v-3H1.69a12 12 0 0 0 0 10.61l3.84-3Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.7 0 3.22.59 4.42 1.73l3.3-3.3C17.72 1.2 15.11 0 12 0 7.49 0 3.59 2.58 1.69 6.36l3.84 3C6.44 6.78 8.99 4.75 12 4.75Z"
      />
    </svg>
  );
}

function VKMark() {
  return (
    <svg aria-hidden="true" viewBox="2 2 20 20" className={styles.brandMark}>
      <path
        fill="#0077FF"
        d="M15.07 2H8.93C3.33 2 2 3.33 2 8.93v6.14C2 20.67 3.33 22 8.93 22h6.14c5.6 0 6.93-1.33 6.93-6.93V8.93C22 3.33 20.66 2 15.07 2Z"
      />
      <path
        fill="#ffffff"
        d="M18.22 16.27h-1.4c-.53 0-.69-.42-1.64-1.37-.83-.8-1.19-.9-1.39-.9-.28 0-.36.08-.36.47v1.26c0 .33-.11.53-.97.53-1.42 0-3-.86-4.1-2.46-1.66-2.33-2.12-4.08-2.12-4.44 0-.2.08-.38.47-.38h1.4c.35 0 .48.16.62.53.69 2 1.84 3.74 2.31 3.74.18 0 .26-.08.26-.53V11.3c-.06-.97-.57-1.05-.57-1.4 0-.16.14-.33.36-.33h2.2c.3 0 .4.16.4.51v2.74c0 .3.13.4.22.4.18 0 .32-.1.64-.43 1-1.12 1.71-2.84 1.71-2.84.1-.2.26-.4.6-.4h1.4c.42 0 .51.22.42.51-.18.81-1.88 3.2-1.88 3.2-.15.24-.2.35 0 .62.15.2.62.62.93.99.58.66 1.02 1.21 1.14 1.6.13.38-.07.58-.46.58Z"
      />
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
