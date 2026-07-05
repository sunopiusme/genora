import { Logo } from "@genora/ui";

import styles from "./brand-panel.module.css";

const BENEFITS = [
  "ChatGPT, Claude, Midjourney и другие модели",
  "Один аккаунт — тексты, код и изображения",
  "Без VPN и зарубежной карты",
];

export function BrandPanel() {
  return (
    <section className={styles.brand}>
      <Logo className={styles.logo} />

      <div className={styles.brandBottom}>
        <h1 className={styles.headline}>Верните себе лучшие нейросети</h1>
        <p className={styles.tagline}>
          Один аккаунт для доступа к ведущим ИИ&#8209;моделям — без лишних
          подписок и ограничений.
        </p>

        <ul className={styles.benefits}>
          {BENEFITS.map((benefit) => (
            <li key={benefit} className={styles.benefit}>
              <CheckIcon />
              {benefit}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={styles.benefitIcon}
      aria-hidden="true"
    >
      <path
        d="m5 13 4 4L19 7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
