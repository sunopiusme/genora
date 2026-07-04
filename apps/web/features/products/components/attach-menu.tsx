"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useComposerStore } from "@/stores/composer-store";
import { Icon } from "@/lib/icon";
import { getFeaturedProducts } from "../queries/featured-products";
import type { Product } from "../types";
import styles from "./attach-menu.module.css";

type MenuView = "actions" | "products";

/**
 * Выпадающее меню на «плюсике» строки ассистента.
 *
 * Два экрана: список действий (товар, изображение, файл)
 * и встроенный выбор товара из каталога — выбранный продукт
 * прикрепляется к запросу чипом, без перехода на другую страницу.
 */
export function AttachMenu() {
	const menuId = useId();
	const rootRef = useRef<HTMLDivElement>(null);
	const imageInputRef = useRef<HTMLInputElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const searchInputRef = useRef<HTMLInputElement>(null);
	const [isOpen, setIsOpen] = useState(false);
	const [view, setView] = useState<MenuView>("actions");
	const [search, setSearch] = useState("");
	const attachProduct = useComposerStore((state) => state.attach);
	const attachFile = useComposerStore((state) => state.attachFile);

	useCloseOnOutsideInteraction(rootRef, isOpen, close);

	function close() {
		setIsOpen(false);
		setView("actions");
		setSearch("");
	}

	function toggle() {
		if (isOpen) {
			close();
		} else {
			setIsOpen(true);
		}
	}

	function openProductPicker() {
		setView("products");
		/* Фокус на поиск после отрисовки списка. */
		requestAnimationFrame(() => {
			searchInputRef.current?.focus();
		});
	}

	function handleSelectProduct(product: Product) {
		attachProduct(product);
		close();
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
		close();
	}

	return (
		<div ref={rootRef} className={styles.root}>
			<button
				type="button"
				className={styles.trigger}
				data-open={isOpen || undefined}
				onClick={toggle}
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
					{view === "actions" ? (
						<ActionsView
							onAttachProduct={openProductPicker}
							onPickImage={handlePickImage}
							onPickFile={handlePickFile}
						/>
					) : (
						<ProductPickerView
							search={search}
							searchInputRef={searchInputRef}
							onSearchChange={setSearch}
							onBack={() => setView("actions")}
							onSelect={handleSelectProduct}
						/>
					)}
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

type ActionsViewProps = {
	onAttachProduct: () => void;
	onPickImage: () => void;
	onPickFile: () => void;
};

function ActionsView({
	onAttachProduct,
	onPickImage,
	onPickFile,
}: ActionsViewProps) {
	return (
		<>
			<button
				type="button"
				role="menuitem"
				className={styles.item}
				onClick={onAttachProduct}
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
				onClick={onPickImage}
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
				onClick={onPickFile}
			>
				<Icon
					icon="solar:document-text-linear"
					className={styles.itemGlyph}
					aria-hidden="true"
				/>
				Файл или документ
			</button>
		</>
	);
}

type ProductPickerViewProps = {
	search: string;
	searchInputRef: React.RefObject<HTMLInputElement | null>;
	onSearchChange: (value: string) => void;
	onBack: () => void;
	onSelect: (product: Product) => void;
};

function ProductPickerView({
	search,
	searchInputRef,
	onSearchChange,
	onBack,
	onSelect,
}: ProductPickerViewProps) {
	const products = useMemo(() => getFeaturedProducts(), []);
	const normalized = search.trim().toLowerCase();
	const filtered = normalized
		? products.filter(
				(product) =>
					product.name.toLowerCase().includes(normalized) ||
					product.provider.toLowerCase().includes(normalized),
			)
		: products;

	return (
		<>
			<div className={styles.pickerHeader}>
				<button
					type="button"
					className={styles.backButton}
					onClick={onBack}
					aria-label="Назад к действиям"
				>
					<Icon
						icon="solar:alt-arrow-left-linear"
						className={styles.backGlyph}
						aria-hidden="true"
					/>
				</button>
				<input
					ref={searchInputRef}
					type="text"
					value={search}
					onChange={(event) => onSearchChange(event.target.value)}
					className={styles.searchInput}
					placeholder="Найти товар…"
					aria-label="Поиск товара в каталоге"
				/>
			</div>

			<div className={styles.productList} role="presentation">
				{filtered.length === 0 ? (
					<p className={styles.emptyState}>Ничего не найдено</p>
				) : (
					filtered.map((product) => (
						<button
							key={product.id}
							type="button"
							role="menuitem"
							className={styles.productItem}
							onClick={() => onSelect(product)}
						>
							<span
								className={styles.productLogo}
								style={
									{
										"--logo-url": `url(/brands/${product.logoSlug}.svg)`,
									} as React.CSSProperties
								}
								aria-hidden="true"
							/>
							<span className={styles.productMeta}>
								<span className={styles.productName}>{product.name}</span>
								<span className={styles.productPrice}>
									{product.priceLabel}/{product.periodLabel}
								</span>
							</span>
						</button>
					))
				)}
			</div>
		</>
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
