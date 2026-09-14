import React, { useEffect, useRef } from "react";
import ScriptEditor from "./ScriptEditor";
import "../helpers/design-view-style.css";

interface ScriptEditorModalProps {
	/** Visible dialog title; also used to label the editor for screen readers. */
	title: string;
	/** Key the editor reads/writes inside its draft holder. */
	fieldName: string;
	/** The currently-saved value to seed the editor with when the modal opens. */
	initialDoc: string;
	/** Commit the edited code to the form. */
	onSave: (value: string) => void;
	/** Discard the edited code and close without saving. */
	onCancel: () => void;
}

/**
 * A popup dialog that hosts a single {@link ScriptEditor}. The editor writes to a
 * throwaway draft holder; only "Save" commits the code to the form. "Cancel" (or
 * Escape / overlay click) discards the draft, so reopening shows the last saved
 * value — never the unsaved edits.
 */
export default function ScriptEditorModal({ title, fieldName, initialDoc, onSave, onCancel }: ScriptEditorModalProps) {
	// Fresh draft per open (the component is mounted only while the modal is open).
	const holderRef = useRef<Record<string, string>>({ [fieldName]: initialDoc });
	const dialogRef = useRef<HTMLDivElement | null>(null);
	const onCancelRef = useRef(onCancel);
	onCancelRef.current = onCancel;

	const titleId = `${fieldName}-modal-title`;

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

	return (
		<div className='script-modal__overlay' role='presentation' onMouseDown={onCancel}> {/* eslint-disable-line jsx-a11y/no-noninteractive-element-interactions */}
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
						{title}
					</h2>
				</div>
				<div className='script-modal__body'>
					<ScriptEditor
						id={`${fieldName}-modal-editor`}
						fieldName={fieldName}
						initialDoc={initialDoc}
						ariaLabelledBy={titleId}
						className='script-editor'
						scriptProps={holderRef.current}
						callback={() => {}}
					/>
				</div>
				<div className='script-modal__footer'>
					<button type='button' className='ontario-button ontario-button--primary' onClick={() => onSave(holderRef.current[fieldName] ?? "")}>
						Save
					</button>
					<button type='button' className='ontario-button ontario-button--secondary' onClick={onCancel}>
						Cancel
					</button>
				</div>
			</div>
		</div>
	);
}
