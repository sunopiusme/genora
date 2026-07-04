"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useComposerStore } from "@/stores/composer-store";
import { Icon } from "@/lib/icon";
import styles from "./attach-menu.module.css";

/**
 * Выпадающее меню на «плюсике» строки ассистента.
 *
 * Компактный список без заголовков: товар из каталога,
 * изображение, файл.
 */
export function AttachMenu() {
	const router = useRouter();
	const menuId = useId();
	const rootRef = useRef<HTMLDivElement>(null);
	const imageInputRef = useRef<HTMLInputElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isOpen, setIsOpen] = useState(false);
	const attachFile = useComposerStore((state) => state.attachFile);

	useCloseOnOutsideInteraction(rootRef, isOpen, () => setIsOpen(false));

	function handleAttachProduct() {
		setIsOpen(false);
		router.push("/products");
	}

	function handlePickImage() {
		imageInputRef.current?.click();
	}

	function handlePickFile() {
		fileInputRef.current?.click();
	}

	function handleFileChange(
		event: React.ChangeEvent<HTMLInputElement>,
		kind: "image" | "document",
	) {
		const file = event.target.files?.[0];
		if (file) {
			attachFile({ name: file.name, kind });
		}
		/* Сбрасываем value, чтобы повторный выбор того же файла
		   снова вызвал change. */
		event.target.value = "";
		setIsOpen(false);
	}

	return (
		<div ref={rootRef} className={styles.root}>
			<button
				type="button"
				className={styles.trigger}
				data-open={isOpen || undefined}
				onClick={() => setIsOpen((open) => !open)}
				aria-haspopup="menu"
				aria-expanded={isOpen}
				aria-controls={isOpen ? menuId : undefined}
				aria-label="Прикрепить к вопросу"
			>
				<Icon
					icon="solar:plus-bold-stroke"
					className={styles.triggerGlyph}
					aria-hidden="true"
				/>
			</button>

			{isOpen && (
				<div id={menuId} role="menu" className={styles.menu}>
					<button
						type="button"
						role="menuitem"
						className={styles.item}
						onClick={handleAttachProduct}
					>
						<Icon
							icon="solar:shop-2-linear"
							className={styles.itemGlyph}
							aria-hidden="true"
						/>
						Товар из каталога
					</button>
					<button
						type="button"
						role="menuitem"
						className={styles.item}
						onClick={handlePickImage}
					>
						<Icon
							icon="solar:gallery-linear"
							className={styles.itemGlyph}
							aria-hidden="true"
						/>
						Фото или скриншот
					</button>
					<button
						type="button"
						role="menuitem"
						className={styles.item}
						onClick={handlePickFile}
					>
						<Icon
							icon="solar:document-text-linear"
							className={styles.itemGlyph}
							aria-hidden="true"
						/>
						Файл или документ
					</button>
				</div>
			)}

			<input
				ref={imageInputRef}
				type="file"
				accept="image/*"
				className={styles.hiddenInput}
				onChange={(event) => handleFileChange(event, "image")}
				aria-hidden="true"
				tabIndex={-1}
			/>
			<input
				ref={fileInputRef}
				type="file"
				className={styles.hiddenInput}
				onChange={(event) => handleFileChange(event, "document")}
				aria-hidden="true"
				tabIndex={-1}
			/>
		</div>
	);
}

function useCloseOnOutsideInteraction(
	rootRef: React.RefObject<HTMLDivElement | null>,
	isOpen: boolean,
	onClose: () => void,
) {
	useEffect(() => {
		if (!isOpen) {
			return;
		}

		function handlePointerDown(event: PointerEvent) {
			if (!rootRef.current?.contains(event.target as Node)) {
				onClose();
			}
		}
		function handleKeyDown(event: globalThis.KeyboardEvent) {
			if (event.key === "Escape") {
				onClose();
			}
		}

		document.addEventListener("pointerdown", handlePointerDown);
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("pointerdown", handlePointerDown);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [rootRef, isOpen, onClose]);
}
