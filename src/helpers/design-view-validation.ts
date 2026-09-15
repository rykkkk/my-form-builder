import { FormSettings, HeaderSettings } from "../formRendering/Constants";
import { createPageErrors } from "./create-page-errors";

/**
 * Returns a map of `fieldId -> error message` for every invalid mandatory field
 * on the "Create a new form" page. A field appears in the map only when invalid.
 *
 * Mandatory fields: form ID, form name (English), application title (English),
 * header type, footer type, and — when the footer type is "Expanded" — the
 * expanded footer content.
 */
export const getCreateFormErrors = (formSettings: FormSettings, header: HeaderSettings): Record<string, string> => {
	const errors: Record<string, string> = {};
	if (!formSettings.formId.trim()) errors.formId = createPageErrors.formId;
	if (!formSettings.formName.en.trim()) errors["formName-en"] = createPageErrors["formName-en"];
	if (!(formSettings.appTitle?.en ?? "").trim()) errors.appTitle = createPageErrors["appTitle-en"];
	if (!header.headerType.trim()) errors.headerType = createPageErrors.headerType;
	const footerType = formSettings.footerSettings?.footerType ?? "";
	if (!footerType.trim()) errors.footerType = createPageErrors.footerType;
	if (footerType === "Expanded" && !(formSettings.footerSettings?.expandedFooterContent ?? "").trim())
		errors.expandedFooterContent = createPageErrors.expandedFooterContent;
	return errors;
};

/** Whether every mandatory field on the create-form page is filled in. */
export const isCreateFormValid = (formSettings: FormSettings, header: HeaderSettings): boolean =>
	Object.keys(getCreateFormErrors(formSettings, header)).length === 0;

/**
 * Maps each validation field id to the id of the focusable control it should
 * jump to from the error summary. Most fields share their id with their input;
 * the expanded footer content is edited through a modal launched by a button.
 */
export const createFormFieldAnchors: Record<string, string> = {
	formId: "formId",
	"formName-en": "formName-en",
	appTitle: "appTitle",
	headerType: "headerType",
	footerType: "footerType",
	expandedFooterContent: "openExpandedFooterContent",
};
