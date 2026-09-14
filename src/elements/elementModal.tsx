import React, { useEffect, useRef, useState } from "react";
import { ButtonSettings, ElementType, FormElement, HTMLSettings } from "../formRendering/Constants";
import "../helpers/design-view-style.css";
import { ButtonSettingsEditor } from "./elementSettings_button";
import { HtmlSettingsEditor } from "./elementSettings_html";

/** Configuration the user fills in before a new element is added to a page. */
export interface ElementConfig {
	type: ElementType;
	elementID: string;
	settings?: FormElement["settings"];
}
type FieldDescriptor = { key: string; label: string; kind: "script" | "text" | "number" | "boolean" | "select"; options?: string[] };

export const elementFields: Partial<Record<ElementType, FieldDescriptor[]>> = {
	Text: [
		{ key: "placeholder", label: "Placeholder", kind: "text" },
		{ key: "maxLength", label: "Max length", kind: "number" },
		{ key: "required", label: "Required", kind: "boolean" },
	],
	HTML: [{ key: "html", label: "HTML content", kind: "script" }],
};
interface ElementModalProps {
	/** Whether the modal is creating a new element or editing an existing one. */
	mode?: "add" | "edit";
	/** Grouped element types shown in the type picker. */
	elementList: { label: string; types: readonly string[] }[];
	/** Pre-selected element type when the modal opens. */
	defaultType?: ElementType;
	/** Previously saved settings to restore when editing an element. */
	initialSettings?: FormElement["settings"];
	/** A pre-filled, unique element id suggestion. */
	suggestedId: string;
	/** Element ids already used on the page (for uniqueness validation). */
	existingIds: string[];
	/** Commit the configured element to the form. */
	onSave: (config: ElementConfig) => void;
	/** Discard and close without adding an element. */
	onCancel: () => void;
}

/**
 * A popup dialog for configuring a form element. In "add" mode it creates a new
 * element; in "edit" mode it edits the selected element. The user picks an
 * element type and an element id; the primary button commits the configuration,
 * while "Cancel" (or Escape / overlay click) discards it.
 */
export default function ElementModal({
	mode = "add",
	elementList,
	defaultType,
	initialSettings,
	suggestedId,
	existingIds,
	onSave,
	onCancel,
}: ElementModalProps) {
	const firstType = defaultType ?? elementList[0]?.types[0] ?? "";
	const [type, setType] = useState<string>(firstType);
	const [elementID, setElementID] = useState<string>(suggestedId);
	const [buttonSettings, setButtonSettings] = useState<ButtonSettings | undefined>(
		defaultType === "Button" ? (initialSettings as ButtonSettings | undefined) : undefined
	);
	const [htmlSettings, setHtmlSettings] = useState<HTMLSettings | undefined>(
		defaultType === "HTML" ? (initialSettings as HTMLSettings | undefined) : undefined
	);

	const dialogRef = useRef<HTMLDivElement | null>(null);
	const onCancelRef = useRef(onCancel);
	onCancelRef.current = onCancel;

	const titleId = "new-element-modal-title";

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onCancelRef.current();
		};
		document.addEventListener("keydown", onKeyDown);
		dialogRef.current?.focus();
		// Prevent the page behind the modal from scrolling.
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.removeEventListener("keydown", onKeyDown);
			document.body.style.overflow = previousOverflow;
		};
	}, []);

	const trimmedId = elementID.trim();
	const idIsEmpty = trimmedId === "";
	const idIsDuplicate = !idIsEmpty && existingIds.includes(trimmedId);
	const canSave = !idIsEmpty && !idIsDuplicate;

	const handleSave = () => {
		if (!canSave) return;
		const settings =
			type === "Button"
				? buttonSettings
				: type === "HTML"
					? htmlSettings
					: type === defaultType
						? initialSettings
						: undefined;
		onSave({ type: type as ElementType, elementID: trimmedId, settings });
	};

	return (
		<div className='script-modal__overlay' role='presentation' onMouseDown={onCancel}>
			{" "}
			{/* eslint-disable-line jsx-a11y/no-noninteractive-element-interactions */}
			{/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
			<div
				className='script-modal'
				role='dialog'
				aria-modal='true'
				aria-labelledby={titleId}
				tabIndex={-1}
				ref={dialogRef}
				onMouseDown={(e) => e.stopPropagation()}>
				<div className='script-modal__header'>
					<h2 id={titleId} className='ontario-h3 script-modal__title'>
						{mode === "edit" ? "Edit element" : "Add a new element"}
					</h2>
				</div>

				<div className='script-modal__body'>
					<label className='ontario-label' htmlFor='new-element-type'>
						Element type
					</label>
					<select className='ontario-input ontario-dropdown' id='new-element-type' value={type} onChange={(e) => setType(e.target.value)}>
						{elementList.map((group) => (
							<optgroup key={group.label} label={group.label}>
								{group.types.map((t) => (
									<option key={t} value={t}>
										{t}
									</option>
								))}
							</optgroup>
						))}
					</select>

					<label className='ontario-label ontario-margin-top-16-!' htmlFor='new-element-id'>
						Element ID
					</label>
					<input
						className='ontario-input'
						type='text'
						id='new-element-id'
						value={elementID}
						aria-describedby={idIsEmpty || idIsDuplicate ? "new-element-id-error" : undefined}
						onChange={(e) => setElementID(e.target.value)}
					/>
					{idIsEmpty && (
						<p className='edit-form__error' id='new-element-id-error' role='alert'>
							Element ID is required.
						</p>
					)}
					{idIsDuplicate && (
						<p className='edit-form__error' id='new-element-id-error' role='alert'>
							Element ID &quot;{trimmedId}&quot; is already used on this page. Choose a unique ID.
						</p>
					)}
					{/* {type === "HTML" && (
					<ScriptEditor initialDoc={holderRef.current[elementID]} 
					onChange={(newDoc) => (holderRef.current[elementID] = newDoc)} />
					)} */}
					{type === "Button" && <ButtonSettingsEditor btnSettings={buttonSettings} onChange={setButtonSettings} />}
					{type === "HTML" && <HtmlSettingsEditor htmlSettings={htmlSettings} onChange={setHtmlSettings} />}
				</div>

				<div className='script-modal__footer'>
					<button type='button' className='ontario-button ontario-button--primary' onClick={handleSave} disabled={!canSave}>
						{mode === "edit" ? "Save changes" : "Add element"}
					</button>
					<button type='button' className='ontario-button ontario-button--secondary' onClick={onCancel}>
						Cancel
					</button>
				</div>
			</div>
		</div>
	);
}
