import type { Condition } from "./Constants"; // ----------------------------------------------------------------------------
// 2. Element catalog
// ----------------------------------------------------------------------------
// Every element type the user can add, grouped by category. The data is
// `as const` so it can be iterated to build UI dropdowns while still deriving a
// strict union of element-type names for type-checking.
export const elementCatalog = {
	htmlTextAndMedia: {
		label: "HTML, text & media",
		types: ["HTML", "Rich text", "Accordions", "Card", "Card Button"],
	},	
	button: {
		label: "Button",
		types: ["Button", "BXP Cancel with Exit Button", "Delete Subsection Button", "Edit Subsection Button"],
        settings: {
            // btnText: { en: "Button label", fr: "Libellé du bouton" },
            // btnClassName: "ontario-button ontario-button--primary",
            // btnType: "submit",
            // btnValue: "buttonValue",
            // btnLoadingText: { en: "Loading...", fr: "Chargement..." },
            // btnAction: "submit",

        } as ButtonSettings
	},
	alertsAndMessages: {
		label: "Alerts & messages",
		types: [
			"Callout Box",
			"Custom Error Alerts",
			"Technical Error",
			"Error Alert",
			"Information Alert",
			"Success Alert",
			"Warning Alert",
			"Modal",
		],
	},
	listsAndTables: {
		label: "Lists & tables",
		types: [
			"Data Table",
			"Dynamic Accordion Form",
			"Paged CosmosDB List",
			"Order Price Breakdown",
			"Table",
			"Table Menu",
			"Table Summary",
			"Summary List",
			"Paged Summary List",
			"Unorder List",
			"Report Data Table",
		],
	},
	address: {
		label: "Address",
		types: ["Address", "eComplaint Address", "Google Place Address", "ArcGIS Map", "Google Map"],
	},
	dateTime: {
		label: "Date & time",
		types: ["Date", "DateTime", "Time", "ODS Date", "ODS Date Range"],
	},
	optionList: {
		label: "Option list",
		types: [
			"Check box",
			"BXP Checkbox with inline input",
			"Checkbox with inline input",
			"Checkbox with input",
			"Dropdown list",
			"Multiple choice",
			"Radio Button",
			"Radio button with rich text",
		],
	},
	text: {
		label: "Text",
		types: [
			"Text",
			"Currency",
			"Number",
			"Phone Number",
			"Business Number",
			"Health Card Number",
			"License Plate Number",
			"Driver License Number",
			"Registrant Identification Number",
			"Postal Code",
			"Transaction ID",
			"Text Area",
		],
	},
	email: {
		label: "Email",
		types: ["Confirmation Email", "Email with button", "Email"],
	},
	search: {
		label: "Search",
		types: ["Search Autocomplete", "Search Single Item From API"],
	},
	file: {
		label: "File",
		types: ["File", "Excel", "Excel Template", "File Download", "Image", "PDF Button"],
	},
	special: {
		label: "Special",
		types: [
			"Hidden Field",
			"Row",
			"Signature Pad",
			"Star Rating",
			"Order Breakdown",
			"Order Confirmation",
			"Order Info Breakdown",
			"Order Price Breakdown",
			"Repeat Button",
			"Repeatable Text",
			"Repeatable Email",
			"Repeatable Phone",
			"Tile Selection",
			"Section Text Display",
			"Subsection Text Display",
			"Group dropdown list",
			"Multiple panel",
			"Selection with rich text",
			"Check Plate And Render Image",
			"Contact details",
			"Email with button",
			"Incident Report Confirmation",
			"Invoice",
			"Inquire And Redirect",
			"PC Lookup",
			"CMA Question",
			"Questionnaire",
			"Public Secure Button",
			"QR Code",
			"Recaptcha Button",
		],
	},
} as const;

/** Any element type from the catalog. */
export type ElementType = (typeof elementCatalog)[keyof typeof elementCatalog]["types"][number];

// ----------------------------------------------------------------------------
// 3. Element settings shapes
// ----------------------------------------------------------------------------
// --- Buttons ----------------------------------------------------------------

export interface ButtonSettings {
	btnText: { en: string; fr: string };
    btnType: "button" | "submit" | "reset";
    btnClassName?: string;
    btnValue?: string;
    btnImage?: {
        src: string;
        alt: { en: string; fr: string };
        // <input type="image" src="searchbutton.png" alt="Search">
    };
    btnLoadingText?: { en: string; fr: string };
    btnAction?: "submit" | "reset" | "cancel" | "saveDraft" | "downloadPDF" | "delete";
    btnAPI?: string;
    btnAPIMethod?: "POST" | "PUT" | "DELETE";
    btnScript?: string;
    isDisabled: boolean;
	// ConfirmAPI?: string;
	// ConfirmAPIMethod?: "POST" | "PUT" | "DELETE";
	// SpinnerText?: { en: string; fr: string };
	// IsCancelButton?: boolean;
	// IsSaveDraftButton?: boolean;
	// SaveDraftOnCancel?: boolean;
	// IsDownloadPDFButton?: boolean;
	// IsDeleteButton?: boolean;
}

export interface CancelButtonConfig {
	IsCancelButton: boolean;
	CancelButtonLabel: string;
	CancelButtonLabelFRA: string;
	CancelScript: string;
	CancelRedirectUrl: string;
	CancelRedirectUrlFRA: string;
	ShowPopup: boolean;
	PopupTitle: string;
	PopupTitleFRA: string;
	PopupMessage: string;
	PopupMessageFRA: string;
	PopupCancelButtonText: string;
	PopupCancelButtonTextFRA: string;
	PopupSaveButtonText: string;
	PopupSaveButtonTextFRA: string;
	PopupLeftCancelClassName: string;
	PopupRightCancelClassName: string;
	PopupCancelButtonClassName: string;
	HidePopupCancelButton: boolean;
}

export interface EditButtonConfig {
	editButton: boolean;
	editButtonClassName: string;
	editButtonName: string;
	editButtonNameFRA: string;
	editButtonScript: string;
}

/** How an address element is used within the form. */
export type AddressUsage = "Residential" | "Mailing" | "Business";

// --- Text & content ---------------------------------------------------------
export interface TextSettings {
	placeholder?: { en: string; fr: string };
	maxLength?: number;
	minLength?: number;
	required?: boolean;
	pattern?: string;
}

export interface HTMLSettings {
	htmlCode?: string;
}

// --- Option lists -----------------------------------------------------------
export interface DropdownSettings {
	options?: { value: string; label: { en: string; fr: string } }[];
	multiple?: boolean;
	required?: boolean;
}

// --- Date & time ------------------------------------------------------------
export interface DateSettings {
	DateISOFormat: boolean;
}
// --- Email ------------------------------------------------------------------
export interface EmailSettings {
	emailApi: string;
	emailCopy: boolean;
	emailSender: string;
	emailRecipients: string[];
	emailSubject: { en: string; fr: string };
	emailBody: { en: string; fr: string };
	inboxSubject: { en: string; fr: string };
	inboxBody: { en: string; fr: string };
}

// --- Address ----------------------------------------------------------------
export interface AddressAdvancedSettings {
	addressType?: AddressUsage;
	isBXPaddress?: boolean;
	isPostCodeOptional?: boolean;
	isStreetNumberOptional?: boolean;
	isStreetNameOptional?: boolean;
	isOtherOptional?: boolean;
	isMunicipalityOptional?: boolean;
	isProvinceOptional?: boolean;
	hideCountry?: boolean;
	hideRuralRoute?: boolean;
	hidePOBox?: boolean;
	hideStreetType?: boolean;
	manualAddressChecked?: boolean;
	hideStreetDirection?: boolean;
	hideUnitType?: boolean;
	hideTownship?: boolean;
	lockStreetFieldsAfterPopulate?: boolean;
	freeTextStreetNumber?: boolean;
}

// ----------------------------------------------------------------------------
// 4. Element type → settings maps
// ----------------------------------------------------------------------------
// Ties an element type to its `settings` (and `advancedSettings`) shape so the
// FormElement generic can infer the correct configuration object per type.
// Types not listed here fall back to a free-form `Record<string, unknown>`.
export interface ElementSettingsMap {
	HTML: HTMLSettings;
	Text: TextSettings;
	"Text Area": TextSettings;
	"Dropdown list": DropdownSettings;
	Date: DateSettings;
	DateTime: DateSettings;
	Button: ButtonSettings;
	Email: EmailSettings;
	"Confirmation Email": EmailSettings;
	"Email with button": EmailSettings;
}

export interface ElementAdvancedSettingsMap {
	Address: AddressAdvancedSettings;
	"eComplaint Address": AddressAdvancedSettings;
}


// ----------------------------------------------------------------------------
export interface FormElement<T extends ElementType = ElementType> {
	elementID: string;
	type: T;
	visibleWhen?: Condition;
	settings?: T extends keyof ElementSettingsMap ? ElementSettingsMap[T] : Record<string, unknown>;
	advancedSettings?: T extends keyof ElementAdvancedSettingsMap ? ElementAdvancedSettingsMap[T] : Record<string, unknown>;
}
