import React from "react";
import { FormSettings, HeaderSettings, HeaderMenuItem, menuOptions } from "../formRendering/Constants";
import ScriptEditorModal from "../helpers/ScriptEditorModal";
import { SavedFormsList } from "../routes/SavedFormList/SavedFormsList";
import { EditForm } from "./editForm";
import { getCreateFormErrors, createFormFieldAnchors } from "../helpers/design-view-validation";

interface S {
	formSettings: FormSettings;
	lang: "en" | "fr";
	showFormSiteSettings: boolean;
	showApiConfig: boolean;
	header: HeaderSettings;
	showHeaderMenu: boolean;
	showAddNewMenuItem: boolean;
	customMenuDraft: HeaderMenuItem;
	/** Which script editor modal is open, if any (one at a time). */
	openScriptModal: "headerInitScript" | "expandedFooterContent" | null;
	showSavedForms: boolean;
	/** True once a valid form has been saved at least once (version >= 1). */
	hasSavedValidForm: boolean;
	showEditForm: boolean;
	/** Mandatory fields the user has visited; gates when inline errors are shown. */
	touched: Record<string, boolean>;
}
interface P {
	/** When provided, the editor opens populated with this saved form for editing. */
	initialForm?: FormSettings;
}

const emptyHeader: HeaderSettings = {
	headerType: "",
	dynamicOriginWithPublicSecure: false,
	enableExitPopup: false,
	exitPopupTitle: "",
	exitPopupMessage: "",
	exitPopupStayButtonLabel: "",
	exitPopupExitButtonLabel: "",
	headerInitScript: "",
	headerMenuItems: [],
};

/** Default, empty draft for a new custom menu item. */
const emptyMenuDraft: HeaderMenuItem = {
	id: "",
	label: { en: "", fr: "" },
	link: { en: "", fr: "" },
	icon: "",
};

/** Default, empty form settings used to seed a brand-new form. */
const emptyFormSettings: FormSettings = {
	formId: "",
	formName: { en: "", fr: "" },
	appTitle: { en: "", fr: "" },
	auth: "",
	createdDate: new Date().toISOString(),
	createdByUser: "",
	editable: true,
	lastUpdatedDate: new Date().toISOString(),
	lastUpdatedByUser: "",
	version: 0,
	coOwners: [],
	deployed: false,
	isComplete: false,
	headerSettings: { ...emptyHeader },
	footerSettings: { footerType: "Simple", expandedFooterContent: "" },

	UiAzureRegistration: "",
	UiAzureTenantId: "",
	redirectUrlOnAuthFailure: "",
	redirectUrlOnSubmit: "",
	updateApiUrl: "",
	getApiUrl: "",
	deleteApiUrl: "",
	createApiUrl: "",
	emailApiUrl: "",
	downloadApiUrl: "",
	initialDataApiUrl: "",
	apiBasePath: "",
	apiKeyKey: "",
	apiKeyValue: "",
	useProxy: false,
};

export class NewForm extends React.Component<P, S> {
	/** The error summary, focused after a failed save so screen readers announce it. */
	private errorSummaryRef = React.createRef<HTMLDivElement>();

	constructor(props: P) {
		super(props);
		const formSettings: FormSettings = props.initialForm
			? { ...emptyFormSettings, ...props.initialForm }
			: { ...emptyFormSettings };
		const header: HeaderSettings = props.initialForm?.headerSettings
			? { ...emptyHeader, ...props.initialForm.headerSettings }
			: { ...emptyHeader };
		this.state = {
			formSettings,
			lang: "en",
			showFormSiteSettings: false,
			showApiConfig: false,
			header,
			showHeaderMenu: (header.headerMenuItems?.length ?? 0) > 0,
			showAddNewMenuItem: false,
			customMenuDraft: { ...emptyMenuDraft },
			openScriptModal: null,
			showSavedForms: false,
			hasSavedValidForm: !!props.initialForm && (props.initialForm.version ?? 0) >= 1,
			showEditForm: false,
			touched: {},
		};
	}


	private getFieldErrors = (): Record<string, string> => getCreateFormErrors(this.state.formSettings, this.state.header);

	/** Whether every mandatory field is filled in. */
	private isFormValid = (): boolean => Object.keys(this.getFieldErrors()).length === 0;

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

	/** Shallow-merge a patch into formSettings. */
	private setField = (patch: Partial<FormSettings>) => {
		this.setState((prev) => ({
			formSettings: { ...prev.formSettings, ...patch },
		}));
	};

	private setLang = (lang: "en" | "fr") => this.setState({ lang });

	private toggleSiteSettings = () => this.setState((prev) => ({ showFormSiteSettings: !prev.showFormSiteSettings }));

	private toggleApiConfig = () => this.setState((prev) => ({ showApiConfig: !prev.showApiConfig }));

	/** Shallow-merge a patch into the header config. */
	private setHeaderField = (patch: Partial<HeaderSettings>) => {
		this.setState((prev) => ({ header: { ...prev.header, ...patch } }));
	};

	/** Whether a menu option is currently in the header menu list. */
	private isMenuItemSelected = (id: string): boolean => this.state.header.headerMenuItems?.some((item) => item.id === id) ?? false;

	/** Add or remove a built-in menu option from the header menu list. */
	private toggleMenuItem = (option: HeaderMenuItem, checked: boolean) => {
		const current = this.state.header.headerMenuItems ?? [];
		const next = checked ? [...current, option] : current.filter((item) => item.id !== option.id);
		this.setHeaderField({ headerMenuItems: next });
	};

	/** Shallow-merge a patch into the custom menu item draft. */
	private setCustomMenuDraft = (patch: Partial<HeaderMenuItem>) =>
		this.setState((prev) => ({ customMenuDraft: { ...prev.customMenuDraft, ...patch } }));

	/** Generate the next sequential, unique id for a custom menu item. */
	private nextCustomMenuId = (): string => {
		const items = this.state.header.headerMenuItems ?? [];
		const taken = new Set(items.map((item) => item.id));
		let n = items.length + 1;
		while (taken.has(`customItem-${n}`)) n += 1;
		return `customItem-${n}`;
	};

	/** Save the current draft as a new numbered custom menu item. */
	private saveCustomMenuItem = () => {
		const newItem: HeaderMenuItem = { ...this.state.customMenuDraft, id: this.nextCustomMenuId() };
		const next = [...(this.state.header.headerMenuItems ?? []), newItem];
		this.setHeaderField({ headerMenuItems: next });
		this.cancelCustomMenuForm();
	};

	/** Reset and close the custom menu item editor. */
	private cancelCustomMenuForm = () => this.setState({ showAddNewMenuItem: false, customMenuDraft: { ...emptyMenuDraft } });

	/** Remove a menu item from the list by id. */
	private removeMenuItem = (id: string) => {
		const next = (this.state.header.headerMenuItems ?? []).filter((item) => item.id !== id);
		this.setHeaderField({ headerMenuItems: next });
	};

	/** Header type change, applying Labour's exit-popup defaults. */
	private onHeaderTypeChange = (headerType: string) => {
		const { header } = this.state;
		const patch: Partial<HeaderSettings> = { headerType };
		if (headerType === "Labour") {
			patch.enableExitPopup = true;
			patch.exitPopupTitle = header.exitPopupTitle || "Are you sure you want to exit?";
			patch.exitPopupMessage = header.exitPopupMessage || "If you leave this page your progress will not be saved.";
			patch.exitPopupStayButtonLabel = header.exitPopupStayButtonLabel || "Stay on this page";
			patch.exitPopupExitButtonLabel = header.exitPopupExitButtonLabel || "Exit without saving";
		}
		this.setHeaderField(patch);
	};

	generateForm = () => {
		// Guard: never persist unless every mandatory field is filled in.
		if (!this.isFormValid()) return;
		const formToSave: FormSettings = {
			...this.state.formSettings,
			formId: this.state.formSettings.formId || crypto.randomUUID(),
			lastUpdatedDate: new Date().toISOString(),
			headerSettings: this.state.header,
			version: this.state.formSettings.version + 1,
		};

		const savedForms = JSON.parse(localStorage.getItem("savedForms") ?? "[]") as (FormSettings & { pages?: unknown })[];
		const idx = savedForms.map((f) => f.formId).lastIndexOf(formToSave.formId);
		if (idx >= 0) {
			// Update the existing record in place, keeping any pages already saved for it.
			savedForms[idx] = { ...savedForms[idx], ...formToSave };
		} else {
			savedForms.push(formToSave);
		}
		localStorage.setItem("savedForms", JSON.stringify(savedForms));

		this.setState({
			formSettings: formToSave,
			hasSavedValidForm: true,
		});
	};

	/**
	 * Save handler. When any mandatory field is invalid, reveal every error
	 * (mark them all touched), move keyboard/screen-reader focus to the error
	 * summary, and stop. Otherwise persist the form.
	 */
	private onSubmit = () => {
		const errors = this.getFieldErrors();
		if (Object.keys(errors).length > 0) {
			const touched = Object.keys(errors).reduce<Record<string, boolean>>((acc, field) => {
				acc[field] = true;
				return acc;
			}, {});
			this.setState(
				(prev) => ({ touched: { ...prev.touched, ...touched } }),
				() => this.errorSummaryRef.current?.focus(),
			);
			return;
		}
		this.generateForm();
	};

	render() {
		const { formSettings, lang, showFormSiteSettings, showApiConfig, header, customMenuDraft, showSavedForms, showEditForm } = this.state;
		if (showSavedForms) {
			return <SavedFormsList />;
		}
		if (showEditForm) {
			return <EditForm formId={formSettings.formId} formName={formSettings.formName} onEditProperties={() => this.setState({ showEditForm: false })} />;
		}
		const errors = this.getFieldErrors();
		const summaryErrors = Object.entries(errors).filter(([field]) => this.state.touched[field]);
		return (
			<div className='ontario-column ontario-small-12 ontario-large-12'>
				{/* ---------------------------------------------------------------- */}
				{/* Page heading                                                      */}
				{/* ---------------------------------------------------------------- */}
				<h1 className='ontario-h1'>Create a new form</h1>
				<p className='ontario-lead-statement'>Configure your form’s settings. You’ll add its pages and elements in the next step.</p>

				{/* Explains the scope of this page: metadata only. Adding pages and
					    elements happens later, via "Edit this form". */}
				<div className='ontario-alert ontario-alert--informational'>
					<div className='ontario-alert__header'>
						<div className='ontario-alert__header-icon'>
							<svg className='ontario-icon' aria-hidden='true' focusable='false' viewBox='0 0 24 24' preserveAspectRatio='xMidYMid meet'>
								<use href='#ontario-icon-alert-information'></use>
							</svg>
						</div>
						<h2 className='ontario-alert__header-title ontario-h4'>This step sets up your form’s metadata</h2>
					</div>
					<div className='ontario-alert__body'>
						<p>
							Here you configure the form’s settings only — its name, header, footer, and API configuration. You won’t add any pages or
							elements yet.
						</p>
						<p>
							Once you’ve saved these details, select <strong>Edit this form</strong> below to start adding and arranging the pages and
							elements that make up the form.
						</p>
					</div>
				</div>

				{/* Error summary — lists outstanding mandatory fields with in-page links */}
				{summaryErrors.length > 0 && (
					<div className='ontario-alert ontario-alert--error' ref={this.errorSummaryRef} tabIndex={-1}>
						<div className='ontario-alert__header'>
							<div className='ontario-alert__header-icon'>
								<svg className='ontario-icon' aria-hidden='true' focusable='false' viewBox='0 0 24 24' preserveAspectRatio='xMidYMid meet'>
									<use href='#ontario-icon-alert-error'></use>
								</svg>
							</div>
							<h2 id='error-summary-heading' className='ontario-alert__header-title ontario-h4'>
								There is a problem
							</h2>
						</div>
						<div className='ontario-alert__body'>
							<p>Complete the following required fields before saving:</p>
							<ul>
								{summaryErrors.map(([field, message]) => (
									<li key={field}>
										<a href={`#${createFormFieldAnchors[field] ?? field}`}>{message}</a>
									</li>
								))}
							</ul>
						</div>
					</div>
				)}

				{/* ================================================================ */}
				{/* SECTION 1 — Form settings                                         */}
				{/* ================================================================ */}
				<section className='ontario-callout'>
					<fieldset className='ontario-fieldset'>
						<legend id='form-settings-heading' className='ontario-h2'>
							Form settings
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

						{/* Form ID */}
						<label className='ontario-label' htmlFor='formId'>
							Form ID <span className='ontario-label__flag'>(required)</span>
						</label>
						{this.renderFieldError("formId", errors)}
						<input
							className={`ontario-input${this.isFieldInvalid("formId", errors) ? " ontario-input__error" : ""}`}
							type='text'
							id='formId'
							name='formId'
							aria-required={true}
							aria-invalid={this.isFieldInvalid("formId", errors)}
							aria-describedby={this.isFieldInvalid("formId", errors) ? "formId-error" : undefined}
							value={formSettings.formId}
							onChange={(e) => this.setField({ formId: e.target.value })}
							onBlur={() => this.markTouched("formId")}
						/>

						{/* Form name  */}
						
						<div>
							<label className='ontario-label' htmlFor='formName'>
								{lang !== "fr" ? 'Form name (English)' : 'Form name (French)'}
							</label>
							<input
								className={`ontario-input${this.isFieldInvalid("formName", errors) ? " ontario-input__error" : ""}`}
								type='text'
								id='formName'
								name='formName'
								aria-required={true}
								aria-invalid={this.isFieldInvalid("formName", errors)}
								aria-describedby={this.isFieldInvalid("formName", errors) ? "formName-error" : undefined}
								value={ lang === "fr" ? formSettings.formName.fr : formSettings.formName.en}
								onChange={(e) =>
									this.setField({
										formName: {
											...formSettings.formName,
											en: lang === "en" ? e.target.value : formSettings.formName.en,
											fr: lang === "fr" ? e.target.value : formSettings.formName.fr,
										},
									})
								}
								onBlur={() => this.markTouched("formName")}
							/>
							{this.renderFieldError("formName", errors)}
						</div>

						{/* Co-owners */}
						<label className='ontario-label' htmlFor='coOwners'>
							Co-owners
							<span className='ontario-label__flag'>(optional)</span>
						</label>
						<p className='ontario-hint' id='coOwners-hint'>
							One email address per line.
						</p>
						<textarea
							className='ontario-input ontario-textarea'
							id='coOwners'
							name='coOwners'
							aria-describedby='coOwners-hint'
							rows={3}
							value={formSettings.coOwners.join("\n")}
							onChange={(e) =>
								this.setField({
									coOwners: e.target.value.split("\n"),
								})
							}
						/>

						{/* Authentication */}
						<label className='ontario-label' htmlFor='auth'>
							Authentication
						</label>
						<select
							className='ontario-input ontario-dropdown'
							id='auth'
							name='auth'
							value={formSettings.auth}
							onChange={(e) => this.setField({ auth: e.target.value })}>
							<option value=''>Embedded (No authentication)</option>
							<option value='ps'>Public Secure</option>
							<option value='ad'>Entra ID</option>
							<option value='tk'>BXP Form Authentication</option>
							<option value='bps'>BPS Authentication</option>
						</select>

						<hr></hr>
						{/*  Header and footer - required*/}
						<div id='header-settings'>
							<h3 className='ontario-h4'>Header and footer</h3>
							{/* Header type */}
							<div className='ontario-form-group'>
								<label className='ontario-label' htmlFor='headerType'>
									Header type
								</label>
								<select
									className={`ontario-input ontario-dropdown${this.isFieldInvalid("headerType", errors) ? " ontario-input__error" : ""}`}
									id='headerType'
									name='headerType'
									aria-required={true}
									aria-invalid={this.isFieldInvalid("headerType", errors)}
									aria-describedby={this.isFieldInvalid("headerType", errors) ? "headerType-error" : undefined}
									value={header.headerType}
									onChange={(e) => this.onHeaderTypeChange(e.target.value)}
									onBlur={() => this.markTouched("headerType")}>
									<option value=''>Select header</option>
									<option value='Application'>Application</option>
									<option value='ServiceOntario'>ServiceOntario</option>
									<option value='Ontario'>Ontario.ca</option>
									<option value='Labour'>Labour</option>
									<option value='MCCSS'>MCCSS</option>
								</select>
								{this.renderFieldError("headerType", errors)}

								{/* App title */}
								<div>
									<label className='ontario-label' htmlFor='appTitle'>
										{lang === "en" ? "Application title (English)" : "Application title (French)"}
									</label>
									<input
										className={`ontario-input${this.isFieldInvalid("appTitle", errors) ? " ontario-input__error" : ""}`}
										type='text'
										id='appTitle'
										name='appTitle'
										aria-required={true}
										aria-invalid={this.isFieldInvalid("appTitle", errors)}
										aria-describedby={this.isFieldInvalid("appTitle", errors) ? "appTitle-error" : undefined}
										value={lang === "en" ? formSettings.appTitle.en : formSettings.appTitle.fr}
										onChange={(e) =>
											this.setField({
												appTitle: {
													...formSettings.appTitle,
													en: lang === "en" ? e.target.value : formSettings.appTitle.en,
													fr: lang === "fr" ? e.target.value : formSettings.appTitle.fr,
												},
											})
										}
										onBlur={() => this.markTouched("appTitle")}
									/>
									{this.renderFieldError("appTitle", errors)}
								</div>

								{/* Dynamic with Public Secure — ServiceOntario/Labour + PS auth */}
								<div
									className='ontario-checkboxes__item'
									hidden={!((header.headerType === "Labour" || header.headerType === "ServiceOntario") && formSettings.auth === "ps")}>
									<input
										className='ontario-checkboxes__input'
										type='checkbox'
										id='dynamicOriginWithPublicSecure'
										name='dynamicOriginWithPublicSecure'
										checked={header.dynamicOriginWithPublicSecure}
										onChange={(e) =>
											this.setHeaderField({
												dynamicOriginWithPublicSecure: e.target.checked,
											})
										}
									/>
									<label className='ontario-checkboxes__label' htmlFor='dynamicOriginWithPublicSecure'>
										Dynamic origin with Public Secure
									</label>
								</div>
								{/* Exit popup — ServiceOntario/Labour only */}
								<div
									className='ontario-checkboxes__item'
									hidden={!(header.headerType === "Labour" || header.headerType === "ServiceOntario")}>
									<input
										className='ontario-checkboxes__input'
										type='checkbox'
										id='enableExitPopup'
										name='enableExitPopup'
										checked={header.enableExitPopup}
										onChange={(e) =>
											this.setHeaderField({
												enableExitPopup: e.target.checked,
											})
										}
									/>
									<label className='ontario-checkboxes__label' htmlFor='enableExitPopup'>
										Enable exit popup
									</label>
								</div>
								{/* Exit popup details */}
								<div hidden={!((header.headerType === "Labour" || header.headerType === "ServiceOntario") && header.enableExitPopup)}>
									<label className='ontario-label' htmlFor='exitPopupTitle'>
										Exit popup title
									</label>
									<input
										className='ontario-input'
										type='text'
										id='exitPopupTitle'
										name='exitPopupTitle'
										value={header.exitPopupTitle}
										onChange={(e) =>
											this.setHeaderField({
												exitPopupTitle: e.target.value,
											})
										}
									/>

									<label className='ontario-label' htmlFor='exitPopupMessage'>
										Exit popup message
									</label>
									<input
										className='ontario-input'
										type='text'
										id='exitPopupMessage'
										name='exitPopupMessage'
										value={header.exitPopupMessage}
										onChange={(e) =>
											this.setHeaderField({
												exitPopupMessage: e.target.value,
											})
										}
									/>

									<label className='ontario-label' htmlFor='exitPopupStayButtonLabel'>
										Exit popup stay button label
									</label>
									<input
										className='ontario-input'
										type='text'
										id='exitPopupStayButtonLabel'
										name='exitPopupStayButtonLabel'
										value={header.exitPopupStayButtonLabel}
										onChange={(e) =>
											this.setHeaderField({
												exitPopupStayButtonLabel: e.target.value,
											})
										}
									/>

									<label className='ontario-label' htmlFor='exitPopupExitButtonLabel'>
										Exit popup exit button label
									</label>
									<input
										className='ontario-input'
										type='text'
										id='exitPopupExitButtonLabel'
										name='exitPopupExitButtonLabel'
										value={header.exitPopupExitButtonLabel}
										onChange={(e) =>
											this.setHeaderField({
												exitPopupExitButtonLabel: e.target.value,
											})
										}
									/>
								</div>

								{/* Enable application header menu */}
								<div className='ontario-checkboxes__item'>
									<input
										className='ontario-checkboxes__input'
										type='checkbox'
										id='enableHeaderMenu'
										name='enableHeaderMenu'
										checked={this.state.showHeaderMenu}
										onChange={(e) => this.setState({ showHeaderMenu: e.target.checked })}
									/>
									<label className='ontario-checkboxes__label' htmlFor='enableHeaderMenu'>
										Enable application header menu
									</label>
								</div>
								<br></br>
								{this.state.showHeaderMenu && (
									<>
										{/* Built-in menu items */}
										<fieldset className='ontario-fieldset'>
											<legend className='ontario-label'>Header menu items</legend>
											<div className='ontario-checkboxes'>
												{menuOptions.map((option) => (
													<div className='ontario-checkboxes__item' key={option.id}>
														<input
															className='ontario-checkboxes__input'
															type='checkbox'
															id={`menuItem-${option.id}`}
															name={`menuItem-${option.id}`}
															checked={this.isMenuItemSelected(option.id)}
															onChange={(e) => this.toggleMenuItem(option, e.target.checked)}
														/>
														<label className='ontario-checkboxes__label' htmlFor={`menuItem-${option.id}`}>
															{lang === "fr" ? option.label.fr : option.label.en}
														</label>
													</div>
												))}
											</div>

											{/* Current menu items, numbered, showing their id */}
											<h4 className='ontario-h5'>Menu items ({(header.headerMenuItems ?? []).length})</h4>
											{(header.headerMenuItems ?? []).length === 0 ? (
												<p className='ontario-hint'>No menu items added yet.</p>
											) : (
												<ol className='ontario-list ontario-list--ordered'>
													{(header.headerMenuItems ?? []).map((item, index) => (
														<li key={item.id}>
															<strong>{index + 1}.</strong> {lang === "fr" ? item.label.fr : item.label.en}{" "}
															<span className='ontario-label__flag'>(id: {item.id})</span>{" "}
															<button
																type='button'
																className='ontario-button ontario-button--tertiary'
																onClick={() => this.removeMenuItem(item.id)}>
																Remove
															</button>
														</li>
													))}
												</ol>
											)}

											<button
												type='button'
												className='ontario-button ontario-button--secondary'
												id='addCustomMenuItem'
												name='addCustomMenuItem'
												hidden={this.state.showAddNewMenuItem}
												onClick={() => this.setState({ showAddNewMenuItem: true })}>
												Add custom menu item
											</button>

											{/* Custom menu item editor */}
											<div hidden={!this.state.showAddNewMenuItem} className='ontario-table-div'>
												<h4 className='ontario-h5'>New custom menu item</h4>

												{/* Label (English) */}
												<div hidden={lang !== "en"}>
													<label className='ontario-label' htmlFor='customLabelEn'>
														Label (English)
													</label>
													<input
														className='ontario-input'
														type='text'
														id='customLabelEn'
														value={customMenuDraft.label.en}
														onChange={(e) => this.setCustomMenuDraft({ label: { ...customMenuDraft.label, en: e.target.value } })}
													/>
												</div>

												{/* Label (French) */}
												<div hidden={lang !== "fr"}>
													<label className='ontario-label' htmlFor='customLabelFr'>
														Label (French)
													</label>
													<input
														className='ontario-input'
														type='text'
														id='customLabelFr'
														value={customMenuDraft.label.fr}
														onChange={(e) => this.setCustomMenuDraft({ label: { ...customMenuDraft.label, fr: e.target.value } })}
													/>
												</div>

												{/* Link (English) */}
												<div hidden={lang !== "en"}>
													<label className='ontario-label' htmlFor='customMenuLinkEn'>
														Link (English)
														<span className='ontario-label__flag'>(optional)</span>
													</label>
													<input
														className='ontario-input'
														type='text'
														id='customMenuLinkEn'
														value={customMenuDraft.link?.en ?? ""}
														onChange={(e) => this.setCustomMenuDraft({ link: { en: e.target.value, fr: customMenuDraft.link?.fr ?? "" } })}
													/>
												</div>

												{/* Link (French) */}
												<div hidden={lang !== "fr"}>
													<label className='ontario-label' htmlFor='customMenuLinkFr'>
														Link (French)
														<span className='ontario-label__flag'>(optional)</span>
													</label>
													<input
														className='ontario-input'
														type='text'
														id='customMenuLinkFr'
														value={customMenuDraft.link?.fr ?? ""}
														onChange={(e) => this.setCustomMenuDraft({ link: { en: customMenuDraft.link?.en ?? "", fr: e.target.value } })}
													/>
												</div>

												<div className='ontario-margin-top-16-!'>
													<button type='button' className='ontario-button ontario-button--primary' onClick={this.saveCustomMenuItem}>
														Save menu item
													</button>
													<button type='button' className='ontario-button ontario-button--tertiary' onClick={this.cancelCustomMenuForm}>
														Cancel
													</button>
												</div>
											</div>
										</fieldset>
									</>
								)}
								{/* Header init script */}
								<label className='ontario-label' id='headerInitScript-label' htmlFor='openHeaderInitScript'>
									Header init script
									<span className='ontario-label__flag'>(optional)</span>
								</label>
								<div>
									<button
										type='button'
										id='openHeaderInitScript'
										className='ontario-button ontario-button--secondary'
										aria-haspopup='dialog'
										onClick={() => this.setState({ openScriptModal: "headerInitScript" })}>
										{formSettings.headerSettings.headerInitScript?.trim() ? "Edit header init script" : "Add header init script"}
									</button>
								</div>
							</div>
						</div>

						<div id='footer-settings'>
							<div className='ontario-form-group'>
								<label className='ontario-label' htmlFor='footerType'>
									Footer type
								</label>
								<select
									className={`ontario-input ontario-dropdown${this.isFieldInvalid("footerType", errors) ? " ontario-input__error" : ""}`}
									id='footerType'
									name='footerType'
									aria-required={true}
									aria-invalid={this.isFieldInvalid("footerType", errors)}
									aria-describedby={this.isFieldInvalid("footerType", errors) ? "footerType-error" : undefined}
									value={formSettings.footerSettings?.footerType ?? "Simple"}
									onChange={(e) => this.setField({ footerSettings: { ...formSettings.footerSettings, footerType: e.target.value } })}
									onBlur={() => this.markTouched("footerType")}>
									<option value='Simple'>Simple</option>
									<option value='Expanded'>Expanded</option>
									<option value='CXP'>CXP</option>
									<option value='BXP'>BXP</option>
									<option value='EHSPartnerPortal'>EHS Partner Portal</option>
								</select>
								{this.renderFieldError("footerType", errors)}

								{formSettings.footerSettings?.footerType === "Expanded" && (
									<div className='ontario-form-group'>
										<label className='ontario-label' id='expandedFooterContent-label' htmlFor='openExpandedFooterContent'>
											Expanded footer content
										</label>
										<div>
											<button
												type='button'
												id='openExpandedFooterContent'
												className='ontario-button ontario-button--secondary'
												aria-haspopup='dialog'
												onClick={() => this.setState({ openScriptModal: "expandedFooterContent" })}>
												{formSettings.footerSettings?.expandedFooterContent?.trim()
													? "Edit expanded footer content"
													: "Add expanded footer content"}
											</button>
										</div>
										{this.renderFieldError("expandedFooterContent", errors)}
									</div>
								)}
							</div>
						</div>

						<hr></hr>

						{/* Site settings — collapsible */}
						<button type='button' className='ontario-button ontario-button--tertiary' onClick={this.toggleSiteSettings}>
							{showFormSiteSettings ? "Hide form site settings" : "Show form site settings"}
						</button>

						<div id='site-settings' hidden={!showFormSiteSettings}>
							<h3 className='ontario-h4'>Site settings</h3>
							{/* Entra ID (Azure) registration — only relevant for Entra ID */}
							<div className='ontario-form-group' hidden={formSettings.auth !== "ad"}>
								<label className='ontario-label' htmlFor='uiAzureRegistration'>
									Azure app registration (client ID)
								</label>
								<input
									className='ontario-input'
									type='text'
									id='uiAzureRegistration'
									name='uiAzureRegistration'
									value={formSettings.UiAzureRegistration ?? ""}
									onChange={(e) =>
										this.setField({
											UiAzureRegistration: e.target.value,
										})
									}
								/>

								<label className='ontario-label' htmlFor='uiAzureTenantId'>
									Azure tenant ID
								</label>
								<input
									className='ontario-input'
									type='text'
									id='uiAzureTenantId'
									name='uiAzureTenantId'
									value={formSettings.UiAzureTenantId ?? ""}
									onChange={(e) =>
										this.setField({
											UiAzureTenantId: e.target.value,
										})
									}
								/>
							</div>

							{/* Redirect URL on auth failure */}
							<label className='ontario-label' htmlFor='redirectUrlOnAuthFailure'>
								Redirect URL on authentication failure
								<span className='ontario-label__flag'>(optional)</span>
							</label>
							<input
								className='ontario-input'
								type='text'
								id='redirectUrlOnAuthFailure'
								name='redirectUrlOnAuthFailure'
								value={formSettings.redirectUrlOnAuthFailure ?? ""}
								onChange={(e) =>
									this.setField({
										redirectUrlOnAuthFailure: e.target.value,
									})
								}
							/>

							{/* Redirect URL on submit */}

							<label className='ontario-label' htmlFor='redirectUrlOnSubmit'>
								Redirect URL on submit
								<span className='ontario-label__flag'>(optional)</span>
							</label>
							<input
								className='ontario-input'
								type='text'
								id='redirectUrlOnSubmit'
								name='redirectUrlOnSubmit'
								value={formSettings.redirectUrlOnSubmit ?? ""}
								onChange={(e) =>
									this.setField({
										redirectUrlOnSubmit: e.target.value,
									})
								}
							/>
						</div>
						<hr></hr>
						<button type='button' className='ontario-button ontario-button--tertiary' onClick={this.toggleApiConfig}>
							{showApiConfig ? "Hide API configuration" : "Show API configuration"}
						</button>
						<div id='api-config-fields' hidden={!showApiConfig} className='ontario-form-group'>
							{/* API base path */}
							<h4 className='ontario-h4'>API configuration</h4>

							<label className='ontario-label' htmlFor='apiBasePath'>
								API base path
								<span className='ontario-label__flag'>(optional)</span>
							</label>
							<input
								className='ontario-input'
								type='text'
								id='apiBasePath'
								name='apiBasePath'
								value={formSettings.apiBasePath ?? ""}
								onChange={(e) => this.setField({ apiBasePath: e.target.value })}
							/>

							{/* Create API URL */}
							<label className='ontario-label' htmlFor='createApiUrl'>
								Create API URL
								<span className='ontario-label__flag'>(optional)</span>
							</label>
							<input
								className='ontario-input'
								type='text'
								id='createApiUrl'
								name='createApiUrl'
								value={formSettings.createApiUrl ?? ""}
								onChange={(e) => this.setField({ createApiUrl: e.target.value })}
							/>

							{/* Get API URL */}
							<label className='ontario-label' htmlFor='getApiUrl'>
								Get API URL
								<span className='ontario-label__flag'>(optional)</span>
							</label>
							<input
								className='ontario-input'
								type='text'
								id='getApiUrl'
								name='getApiUrl'
								value={formSettings.getApiUrl ?? ""}
								onChange={(e) => this.setField({ getApiUrl: e.target.value })}
							/>

							{/* Update API URL */}
							<label className='ontario-label' htmlFor='updateApiUrl'>
								Update API URL
								<span className='ontario-label__flag'>(optional)</span>
							</label>
							<input
								className='ontario-input'
								type='text'
								id='updateApiUrl'
								name='updateApiUrl'
								value={formSettings.updateApiUrl ?? ""}
								onChange={(e) => this.setField({ updateApiUrl: e.target.value })}
							/>

							{/* Delete API URL */}
							<label className='ontario-label' htmlFor='deleteApiUrl'>
								Delete API URL
								<span className='ontario-label__flag'>(optional)</span>
							</label>
							<input
								className='ontario-input'
								type='text'
								id='deleteApiUrl'
								name='deleteApiUrl'
								value={formSettings.deleteApiUrl ?? ""}
								onChange={(e) => this.setField({ deleteApiUrl: e.target.value })}
							/>

							{/* Email API URL */}
							<label className='ontario-label' htmlFor='emailApiUrl'>
								Email API URL
								<span className='ontario-label__flag'>(optional)</span>
							</label>
							<input
								className='ontario-input'
								type='text'
								id='emailApiUrl'
								name='emailApiUrl'
								value={formSettings.emailApiUrl ?? ""}
								onChange={(e) => this.setField({ emailApiUrl: e.target.value })}
							/>

							{/* Download API URL */}
							<label className='ontario-label' htmlFor='downloadApiUrl'>
								Download API URL
								<span className='ontario-label__flag'>(optional)</span>
							</label>
							<input
								className='ontario-input'
								type='text'
								id='downloadApiUrl'
								name='downloadApiUrl'
								value={formSettings.downloadApiUrl ?? ""}
								onChange={(e) => this.setField({ downloadApiUrl: e.target.value })}
							/>

							{/* Initial data API URL */}
							<label className='ontario-label' htmlFor='initialDataApiUrl'>
								Initial data API URL
								<span className='ontario-label__flag'>(optional)</span>
							</label>
							<input
								className='ontario-input'
								type='text'
								id='initialDataApiUrl'
								name='initialDataApiUrl'
								value={formSettings.initialDataApiUrl ?? ""}
								onChange={(e) =>
									this.setField({
										initialDataApiUrl: e.target.value,
									})
								}
							/>

							{/* API key header name */}
							<label className='ontario-label' htmlFor='apiKeyKey'>
								API key header name
								<span className='ontario-label__flag'>(optional)</span>
							</label>
							<input
								className='ontario-input'
								type='text'
								id='apiKeyKey'
								name='apiKeyKey'
								value={formSettings.apiKeyKey ?? ""}
								onChange={(e) => this.setField({ apiKeyKey: e.target.value })}
							/>

							{/* API key value */}
							<label className='ontario-label' htmlFor='apiKeyValue'>
								API key value
								<span className='ontario-label__flag'>(optional)</span>
							</label>
							<input
								className='ontario-input'
								type='password'
								id='apiKeyValue'
								name='apiKeyValue'
								value={formSettings.apiKeyValue ?? ""}
								onChange={(e) => this.setField({ apiKeyValue: e.target.value })}
							/>

							{/* Use proxy */}
							<div className='ontario-checkboxes__item'>
								<input
									className='ontario-checkboxes__input'
									type='checkbox'
									id='useProxy'
									name='useProxy'
									checked={formSettings.useProxy ?? false}
									onChange={(e) => this.setField({ useProxy: e.target.checked })}
								/>
								<label className='ontario-checkboxes__label' htmlFor='useProxy'>
									Route API calls through the proxy
								</label>
							</div>
						</div>
					</fieldset>
				</section>

				{/* ================================================================ */}
				{/* SECTION 4 — Primary actions                                       */}
				{/* ================================================================ */}
				<div className='ontario-margin-top-32-!'>
					<p className='ontario-hint'>
						Save the form to enable <strong>Edit this form</strong>, where you can add pages and elements.
					</p>
					<button type='button' className='ontario-button ontario-button--primary' id='saveFormButton' onClick={this.onSubmit}>
						Save form
					</button>
					<button
						type='button'
						className='ontario-button ontario-button--tertiary'
						id='editFormButton'
						disabled={!(this.state.hasSavedValidForm && formSettings.version >= 1)}
						onClick={() => this.setState({ showEditForm: true })}>
						Edit this form
					</button>
				</div>

				{this.state.openScriptModal === "headerInitScript" && (
					<ScriptEditorModal
						title='Header init script'
						fieldName='headerInitScript'
						initialDoc={formSettings.headerSettings.headerInitScript ?? ""}
						onSave={(value) => {
							this.setField({ headerSettings: { ...formSettings.headerSettings, headerInitScript: value } });
							this.setState({ openScriptModal: null });
						}}
						onCancel={() => this.setState({ openScriptModal: null })}
					/>
				)}
				{this.state.openScriptModal === "expandedFooterContent" && (
					<ScriptEditorModal
						title='Expanded footer content'
						fieldName='expandedFooterContent'
						initialDoc={formSettings.footerSettings?.expandedFooterContent ?? ""}
						onSave={(value) => {
							this.markTouched("expandedFooterContent");
							this.setField({ footerSettings: { ...formSettings.footerSettings, expandedFooterContent: value } });
							this.setState({ openScriptModal: null });
						}}
						onCancel={() => this.setState({ openScriptModal: null })}
					/>
				)}
			</div>
		);
	}
}

