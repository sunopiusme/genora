"use client";

import {
	useEffect,
	useRef,
	useState,
	type FormEvent,
	type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { useComposerStore } from "@/stores/composer-store";
import { Icon } from "@/lib/icon";
import type { Product } from "../types";
import styles from "./assistant-bar.module.css";

/* Below this width the full placeholder does not fit — a shorter
   one is shown instead. iPhone screens are wider and keep the full
   text. */
const NARROW_MEDIA_QUERY = "(max-width: 22.5rem)";

export function AssistantBar() {
	const router = useRouter();
	const inputRef = useRef<HTMLInputElement>(null);
	const [query, setQuery] = useState("");
	const attachedProduct = useComposerStore((state) => state.attachedProduct);
	const detachProduct = useComposerStore((state) => state.detach);
	const hasQuery = query.trim().length > 0;
	const isNarrowScreen = useIsNarrowScreen();

	useFocusInputOnAttach(inputRef, attachedProduct);

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!hasQuery) {
			return;
		}
		router.push(`/products?q=${encodeURIComponent(query.trim())}`);
	}

	function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
		if (event.key === "Backspace" && query.length === 0 && attachedProduct) {
			event.preventDefault();
			detachProduct();
		}
	}

	const placeholder = getPlaceholder(attachedProduct, isNarrowScreen);

	return (
		<form className={styles.bar} onSubmit={handleSubmit}>
			{attachedProduct ? (
				<AttachedProductChip
					product={attachedProduct}
					onRemove={detachProduct}
				/>
			) : (
				<span className={styles.searchIcon}>
					<Icon
						icon="solar:magnifer-linear"
						className={styles.searchGlyph}
						aria-hidden="true"
					/>
				</span>
			)}

			<input
				ref={inputRef}
				name="query"
				value={query}
				onChange={(event) => setQuery(event.target.value)}
				onKeyDown={handleInputKeyDown}
				placeholder={placeholder}
				autoComplete="off"
				className={styles.input}
				aria-label="Сообщение ассистенту"
			/>

			<button
				type="submit"
				className={styles.submit}
				disabled={!hasQuery}
				aria-label="Отправить"
			>
				<Icon icon="solar:arrow-up-linear" className={styles.submitGlyph} />
			</button>
		</form>
	);
}

type AttachedProductChipProps = {
	product: Product;
	onRemove: () => void;
};

function AttachedProductChip({ product, onRemove }: AttachedProductChipProps) {
	return (
		<span
			className={styles.chip}
			role="status"
			aria-label={`Прикреплён товар: ${product.name}`}
		>
			<span
				className={styles.chipLogo}
				style={
					{
						"--logo-url": `url(/brands/${product.logoSlug}.svg)`,
					} as React.CSSProperties
				}
				aria-hidden="true"
			/>
			<span className={styles.chipLabel}>{product.name}</span>
			<button
				type="button"
				className={styles.chipRemove}
				onClick={onRemove}
				aria-label={`Открепить ${product.name}`}
			>
				<Icon
					icon="solar:close-linear"
					className={styles.chipRemoveGlyph}
					aria-hidden="true"
				/>
			</button>
		</span>
	);
}

function getPlaceholder(
	attachedProduct: Product | null,
	isNarrowScreen: boolean,
) {
	/* Название товара уже видно в теге слева — плейсхолдер его
	   не дублирует. */
	if (attachedProduct) {
		return "Ваш вопрос…";
	}
	return isNarrowScreen ? "Спросите" : "Спросите что угодно";
}

function useIsNarrowScreen() {
	const [isNarrow, setIsNarrow] = useState(false);

	useEffect(() => {
		const mediaQuery = window.matchMedia(NARROW_MEDIA_QUERY);
		setIsNarrow(mediaQuery.matches);

		function handleChange(event: MediaQueryListEvent) {
			setIsNarrow(event.matches);
		}
		mediaQuery.addEventListener("change", handleChange);
		return () => mediaQuery.removeEventListener("change", handleChange);
	}, []);

	return isNarrow;
}

function useFocusInputOnAttach(
	inputRef: React.RefObject<HTMLInputElement | null>,
	attachedProduct: Product | null,
) {
	useEffect(() => {
		if (!attachedProduct) {
			return;
		}
		const frameId = requestAnimationFrame(() => {
			inputRef.current?.focus();
		});
		return () => cancelAnimationFrame(frameId);
	}, [inputRef, attachedProduct]);
}
