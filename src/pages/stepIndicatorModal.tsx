import React, { useEffect, useRef, useState } from "react";
import { StepIndicatorSettings } from "../formRendering/Constants";

interface StepIndicatorModalProps {
	settings?: StepIndicatorSettings;
	onSave: (settings: StepIndicatorSettings) => void;
	onCancel: () => void;
}

const optionalPositiveInteger = (value: string): number | undefined => (value === "" ? undefined : Number(value));

export default function StepIndicatorModal({ settings, onSave, onCancel }: StepIndicatorModalProps) {
	const [showStepIndicator, setShowStepIndicator] = useState(settings?.showStepIndicator ?? false);
	const [stepNumber, setStepNumber] = useState(settings?.stepNumber?.toString() ?? "");
	const [totalSteps, setTotalSteps] = useState(settings?.totalSteps?.toString() ?? "");
	const [labelEn, setLabelEn] = useState(settings?.stepBtnLabel?.en ?? "");
	const [labelFr, setLabelFr] = useState(settings?.stepBtnLabel?.fr ?? "");
	const [showBackButton, setShowBackButton] = useState(settings?.showBackButton ?? false);
	const [backLabelEn, setBackLabelEn] = useState(settings?.backBtnLabel?.en ?? "");
	const [backLabelFr, setBackLabelFr] = useState(settings?.backBtnLabel?.fr ?? "");
	const dialogRef = useRef<HTMLDivElement | null>(null);
	const onCancelRef = useRef(onCancel);
	onCancelRef.current = onCancel;

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") onCancelRef.current();
		};
		document.addEventListener("keydown", onKeyDown);
		dialogRef.current?.focus();
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.removeEventListener("keydown", onKeyDown);
			document.body.style.overflow = previousOverflow;
		};
	}, []);

	const parsedStepNumber = optionalPositiveInteger(stepNumber);
	const parsedTotalSteps = optionalPositiveInteger(totalSteps);
	const stepNumberInvalid = parsedStepNumber != null && (!Number.isInteger(parsedStepNumber) || parsedStepNumber < 1);
	const totalStepsInvalid = parsedTotalSteps != null && (!Number.isInteger(parsedTotalSteps) || parsedTotalSteps < 1);
	const stepExceedsTotal = parsedStepNumber != null && parsedTotalSteps != null && parsedStepNumber > parsedTotalSteps;
	const canSave = !stepNumberInvalid && !totalStepsInvalid && !stepExceedsTotal;

	const handleSave = () => {
		if (!canSave) return;
		onSave({
			showStepIndicator,
			stepNumber: parsedStepNumber,
			totalSteps: parsedTotalSteps,
			stepBtnLabel: labelEn.trim() || labelFr.trim() ? { en: labelEn, fr: labelFr } : undefined,
			showBackButton,
			backBtnLabel: backLabelEn.trim() || backLabelFr.trim() ? { en: backLabelEn, fr: backLabelFr } : undefined,
		});
	};

	return (
		<div className='script-modal__overlay' role='presentation' onMouseDown={onCancel}>
			{/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
			<div
				className='script-modal'
				role='dialog'
				aria-modal='true'
				aria-labelledby='step-indicator-modal-title'
				tabIndex={-1}
				ref={dialogRef}
				onMouseDown={(event) => event.stopPropagation()}>
				<div className='script-modal__header'>
					<h2 id='step-indicator-modal-title' className='ontario-h3 script-modal__title'>
						Configure step indicator and navigation buttons
					</h2>
				</div>

				<div className='script-modal__body'>
					<div className='ontario-checkboxes__item'>
						<input
							className='ontario-checkboxes__input'
							type='checkbox'
							id='modalShowStepIndicator'
							checked={showStepIndicator}
							onChange={(event) => setShowStepIndicator(event.target.checked)}
						/>
						<label className='ontario-checkboxes__label' htmlFor='modalShowStepIndicator'>
							Show step indicator
						</label>
					</div>

					{showStepIndicator && (
						<>
							<label className='ontario-label ontario-margin-top-16-!' htmlFor='modalStepNumber'>
								Step number
							</label>
							<input
								className={`ontario-input${stepNumberInvalid || stepExceedsTotal ? " ontario-input__error" : ""}`}
								type='number'
								min={1}
								step={1}
								id='modalStepNumber'
								value={stepNumber}
								onChange={(event) => setStepNumber(event.target.value)}
							/>

							<label className='ontario-label ontario-margin-top-16-!' htmlFor='modalTotalSteps'>
								Total steps
							</label>
							<input
								className={`ontario-input${totalStepsInvalid || stepExceedsTotal ? " ontario-input__error" : ""}`}
								type='number'
								min={1}
								step={1}
								id='modalTotalSteps'
								value={totalSteps}
								onChange={(event) => setTotalSteps(event.target.value)}
							/>

							{(stepNumberInvalid || totalStepsInvalid) && (
								<p className='edit-form__error' role='alert'>
									Step numbers must be whole numbers of 1 or more.
								</p>
							)}
							{stepExceedsTotal && (
								<p className='edit-form__error' role='alert'>
									Step number cannot be greater than total steps.
								</p>
							)}
						</>
					)}

					<h3 className='ontario-h4 ontario-margin-top-24-!'>Continue/Next button</h3>
					<label className='ontario-label' htmlFor='modalStepButtonLabelEn'>
						Button label (English)
						<span className='ontario-label__flag'>(optional)</span>
					</label>
					<input
						className='ontario-input'
						type='text'
						id='modalStepButtonLabelEn'
						value={labelEn}
						onChange={(event) => setLabelEn(event.target.value)}
					/>

					<label className='ontario-label ontario-margin-top-16-!' htmlFor='modalStepButtonLabelFr'>
						Button label (French)
						<span className='ontario-label__flag'>(optional)</span>
					</label>
					<input
						className='ontario-input'
						type='text'
						id='modalStepButtonLabelFr'
						value={labelFr}
						onChange={(event) => setLabelFr(event.target.value)}
					/>

					<h3 className='ontario-h4 ontario-margin-top-24-!'>Back button</h3>
					<div className='ontario-checkboxes__item'>
						<input
							className='ontario-checkboxes__input'
							type='checkbox'
							id='modalShowBackButton'
							checked={showBackButton}
							onChange={(event) => setShowBackButton(event.target.checked)}
						/>
						<label className='ontario-checkboxes__label' htmlFor='modalShowBackButton'>
							Show Back button
						</label>
					</div>

					{showBackButton && (
						<>
							<label className='ontario-label ontario-margin-top-16-!' htmlFor='modalBackButtonLabelEn'>
								Button label (English)
								<span className='ontario-label__flag'>(optional)</span>
							</label>
							<input
								className='ontario-input'
								type='text'
								id='modalBackButtonLabelEn'
								value={backLabelEn}
								onChange={(event) => setBackLabelEn(event.target.value)}
							/>

							<label className='ontario-label ontario-margin-top-16-!' htmlFor='modalBackButtonLabelFr'>
								Button label (French)
								<span className='ontario-label__flag'>(optional)</span>
							</label>
							<input
								className='ontario-input'
								type='text'
								id='modalBackButtonLabelFr'
								value={backLabelFr}
								onChange={(event) => setBackLabelFr(event.target.value)}
							/>
						</>
					)}
				</div>

				<div className='script-modal__footer'>
					<button type='button' className='ontario-button ontario-button--primary' onClick={handleSave} disabled={!canSave}>
						Save configuration
					</button>
					<button type='button' className='ontario-button ontario-button--secondary' onClick={onCancel}>
						Cancel
					</button>
				</div>
			</div>
		</div>
	);
}
