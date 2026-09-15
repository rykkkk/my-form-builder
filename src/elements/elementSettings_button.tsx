import React from "react";
import { ButtonSettings } from "src/formRendering/ElementConstants";
import ScriptEditorModal from "../helpers/ScriptEditorModal";

interface ButtonSettingsEditorProps {
	btnSettings?: ButtonSettings;
	onChange?: (settings: ButtonSettings) => void;
}

interface ButtonSettingsEditorState {
	lang: "en" | "fr";
	settings: ButtonSettings;
	touched: Record<string, boolean>;
	openScriptModal: boolean;
}

/** Validation error messages for the mandatory button-settings fields. */
const buttonSettingsErrors = {
	"btnText-en": "Enter the button text in English.",
	"btnText-fr": "Enter the button text in French.",
} as const;

const defaultButtonSettings: ButtonSettings = {
	btnText: { en: "", fr: "" },
	btnType: "button",
	btnClassName: "",
	btnValue: "",
	btnImage: { src: "", alt: { en: "", fr: "" } },
	btnLoadingText: { en: "", fr: "" },
	btnAction: "submit",
	btnAPI: "",
	btnAPIMethod: "POST",
	btnScript: "",
	isDisabled: false,
};

export class ButtonSettingsEditor extends React.Component<ButtonSettingsEditorProps, ButtonSettingsEditorState> {
	constructor(props: ButtonSettingsEditorProps) {
		super(props);
		this.state = {
			lang: "en",
			settings: { ...defaultButtonSettings, ...props.btnSettings },
			touched: {},
			openScriptModal: false,
		};
	}

	private setLang = (lang: "en" | "fr") => this.setState({ lang });

	private setField = (patch: Partial<ButtonSettings>) => {
		this.setState(
			(prev) => ({ settings: { ...prev.settings, ...patch } }),
			() => this.props.onChange?.(this.state.settings)
		);
	};

	/** Compute validation errors for the mandatory button-settings fields. */
	private getFieldErrors = (): Record<string, string> => {
		const { settings } = this.state;
		const errors: Record<string, string> = {};
		if (!settings.btnText.en.trim()) errors["btnText-en"] = buttonSettingsErrors["btnText-en"];
		if (!settings.btnText.fr.trim()) errors["btnText-fr"] = buttonSettingsErrors["btnText-fr"];
		return errors;
	};

	/** Mark a mandatory field as visited so its inline error can be revealed. */
	private markTouched = (field: string) => this.setState((prev) => ({ touched: { ...prev.touched, [field]: true } }));

	/** Whether a field's error should currently be shown (visited and invalid). */
	private isFieldInvalid = (field: string, errors: Record<string, string>): boolean => !!(this.state.touched[field] && errors[field]);

	/** Render an Ontario-styled, screen-reader-friendly error message for a field. */
	private renderFieldError = (field: string, errors: Record<string, string>) => {
		if (!this.isFieldInvalid(field, errors)) return <div></div>;
		return (
			<div className='ontario-error-messaging' id={`${field}-error`} role='alert'>
				<svg className='ontario-icon' aria-hidden='true' focusable='false' viewBox='0 0 24 24' preserveAspectRatio='xMidYMid meet'>
					<use href='#ontario-icon-alert-error'></use>
				</svg>
				<div className='ontario-error-messaging__content'>
					<span className='ontario-show-for-sr'>Error: </span>
					{errors[field]}
				</div>
			</div>
		);
	};

	public render() {
		const { lang, settings } = this.state;
		const errors = this.getFieldErrors();
		const textField = lang === "en" ? "btnText-en" : "btnText-fr";

		return (
			<div className='ontario-form-group ontario-margin-top-16-!'>
				<fieldset className='ontario-fieldset'>
					<legend id='form-settings-heading' className='ontario-h2'>
						Button settings
					</legend>

					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "flex-end",
							gap: "1rem",
						}}
						role='group'
						aria-label='Editing language for bilingual fields'>
						<span className='ontario-label'>Editing language</span>
						<button
							type='button'
							className={`ontario-button ${lang === "en" ? "ontario-button--primary" : "ontario-button--secondary"}`}
							aria-label='Edit English fields'
							onClick={() => this.setLang("en")}>
							English
						</button>
						<button
							type='button'
							className={`ontario-button ${lang === "fr" ? "ontario-button--primary" : "ontario-button--secondary"}`}
							aria-label='Edit French fields'
							onClick={() => this.setLang("fr")}>
							French
						</button>
						<div> </div>
					</div>

					{/* Button text */}
					<div>
						<label className='ontario-label' htmlFor='btnText'>
							{lang === "en" ? "Button text (English)" : "Button text (French)"}
						</label>
						<input
							className={`ontario-input${this.isFieldInvalid(textField, errors) ? " ontario-input__error" : ""}`}
							type='text'
							id='btnText'
							name='btnText'
							aria-required={true}
							aria-invalid={this.isFieldInvalid(textField, errors)}
							aria-describedby={this.isFieldInvalid(textField, errors) ? `${textField}-error` : undefined}
							value={lang === "en" ? settings.btnText.en  : settings.btnText.fr }
							onChange={(e) => this.setField({ btnText: { ...settings.btnText, [lang]: e.target.value } })}
							onBlur={() => this.markTouched(textField)}
						/>
						{this.renderFieldError(textField, errors)}
					</div>

					{/* Button type */}
					<label className='ontario-label' htmlFor='btnType'>
						Button type
					</label>
					<select
						className='ontario-input ontario-dropdown'
						id='btnType'
						name='btnType'
						value={settings.btnType}
						onChange={(e) => this.setField({ btnType: e.target.value as ButtonSettings["btnType"] })}>
						<option value='button'>Button</option>
						<option value='submit'>Submit</option>
						<option value='reset'>Reset</option>
					</select>

					{/* Button action */}
					<label className='ontario-label' htmlFor='btnAction'>
						Button action
						<span className='ontario-label__flag'>(optional)</span>
					</label>
					<select
						className='ontario-input ontario-dropdown'
						id='btnAction'
						name='btnAction'
						value={settings.btnAction ?? ""}
						onChange={(e) => this.setField({ btnAction: (e.target.value || undefined) as ButtonSettings["btnAction"] })}>
						<option value=''>None</option>
						<option value='submit'>Submit</option>
						<option value='reset'>Reset</option>
						<option value='cancel'>Cancel</option>
						<option value='saveDraft'>Save draft</option>
						<option value='downloadPDF'>Download PDF</option>
						<option value='delete'>Delete</option>
					</select>

					{/* Button CSS class */}
					<label className='ontario-label' htmlFor='btnClassName'>
						Button CSS class
						<span className='ontario-label__flag'>(optional)</span>
					</label>
					<select
						className='ontario-input ontario-dropdown'
						id='btnClassName'
						name='btnClassName'
						value={settings.btnClassName ?? ""}
						onChange={(e) => this.setField({ btnClassName: (e.target.value || undefined) as ButtonSettings["btnClassName"] })}>
						<option value='ontario-button'>ontario-button</option>
						<option value='ontario-button ontario-button--primary'>ontario-button ontario-button--primary</option>
						<option value='ontario-button ontario-button--secondary'>ontario-button ontario-button--secondary</option>
						<option value='ontario-button ontario-button--tertiary'>ontario-button ontario-button--tertiary</option>
					</select>

					{/* button in horizontal */}
					

					{/* Button value */}
					<label className='ontario-label' htmlFor='btnValue'>
						Button value
						<span className='ontario-label__flag'>(optional)</span>
					</label>
					<input
						className='ontario-input'
						type='text'
						id='btnValue'
						name='btnValue'
						value={settings.btnValue ?? ""}
						onChange={(e) => this.setField({ btnValue: e.target.value })}
					/>

					{/* Loading text */}
					<div>
						<label className='ontario-label' htmlFor='btnLoadingText-en'>
							{lang === "en" ? "Loading text (English)" : "Loading text (French)"}
							<span className='ontario-label__flag'>(optional)</span>
						</label>
						<input
							className='ontario-input'
							type='text'
							id='btnLoadingText'
							name='btnLoadingText'
							value={lang === "en" ? settings.btnLoadingText?.en ?? "" : settings.btnLoadingText?.fr ?? ""}
							onChange={(e) =>
								this.setField({
									btnLoadingText: { ...settings.btnLoadingText, [lang]: e.target.value },
								})
							}
						/>
					</div>

					{/* Button image source */}
					<label className='ontario-label' htmlFor='btnImageSrc'>
						Button image source
						<span className='ontario-label__flag'>(optional)</span>
					</label>
					<input
						className='ontario-input'
						type='text'
						id='btnImageSrc'
						name='btnImageSrc'
						value={settings.btnImage?.src ?? ""}
						onChange={(e) =>
							this.setField({
								btnImage: {
									src: e.target.value,
									alt: settings.btnImage?.alt ?? { en: "", fr: "" },
								},
							})
						}
					/>

					{/* Button image alt */}
					<div>
						<label className='ontario-label' htmlFor='btnImageAlt-en'>
							{lang === "en" ? "Button image alt text (English)" : "Button image alt text (French)"}
							<span className='ontario-label__flag'>(optional)</span>
						</label>
						<input
							className='ontario-input'
							type='text'
							id='btnImageAlt'
							name='btnImageAlt'
							value={lang === "en" ? settings.btnImage?.alt.en ?? "" : settings.btnImage?.alt.fr ?? ""}
							onChange={(e) =>
								this.setField({
									btnImage: {
										src: settings.btnImage?.src ?? "",
										alt: { ...settings.btnImage?.alt, [lang]: e.target.value },
									},
								})
							}
						/>
					</div>

					{/* Button API */}
					<label className='ontario-label' htmlFor='btnAPI'>
						Button API endpoint
						<span className='ontario-label__flag'>(optional)</span>
					</label>
					<input
						className='ontario-input'
						type='text'
						id='btnAPI'
						name='btnAPI'
						value={settings.btnAPI ?? ""}
						onChange={(e) => this.setField({ btnAPI: e.target.value })}
					/>

					{/* Button API method */}
					<label className='ontario-label' htmlFor='btnAPIMethod'>
						Button API method
						<span className='ontario-label__flag'>(optional)</span>
					</label>
					<select
						className='ontario-input ontario-dropdown'
						id='btnAPIMethod'
						name='btnAPIMethod'
						value={settings.btnAPIMethod ?? ""}
						onChange={(e) => this.setField({ btnAPIMethod: (e.target.value || undefined) as ButtonSettings["btnAPIMethod"] })}>
						<option value=''>None</option>
						<option value='POST'>POST</option>
						<option value='PUT'>PUT</option>
						<option value='DELETE'>DELETE</option>
					</select>

					{/* Button script */}
					<label className='ontario-label' id='btnScript-label' htmlFor='openBtnScript'>
						Button script
						<span className='ontario-label__flag'>(optional)</span>
					</label>
					<div>
						<button
							type='button'
							id='openBtnScript'
							className='ontario-button ontario-button--secondary'
							aria-haspopup='dialog'
							onClick={() => this.setState({ openScriptModal: true })}>
							{settings.btnScript?.trim() ? "Edit button script" : "Add button script"}
						</button>
					</div>

					{/* Disabled */}
					<div className='ontario-checkboxes__item ontario-margin-top-16-!'>
						<input
							className='ontario-checkboxes__input'
							type='checkbox'
							id='isDisabled'
							name='isDisabled'
							checked={settings.isDisabled}
							onChange={(e) => this.setField({ isDisabled: e.target.checked })}
						/>
						<label className='ontario-checkboxes__label' htmlFor='isDisabled'>
							Disabled
						</label>
					</div>
				</fieldset>

				{this.state.openScriptModal && (
					<ScriptEditorModal
						title='Button script'
						fieldName='btnScript'
						initialDoc={settings.btnScript ?? ""}
						onSave={(value) => {
							this.setField({ btnScript: value });
							this.setState({ openScriptModal: false });
						}}
						onCancel={() => this.setState({ openScriptModal: false })}
					/>
				)}
			</div>
		);
	}
}