
// ============================================================================
// ============================================================================
import type { FormElement } from "./ElementConstants";

// Gather the element catalog, settings shapes and the FormElement model from
// ElementConstants so the whole form model can be imported from this module.
export * from "./ElementConstants";

// ----------------------------------------------------------------------------
// 1. Page types
// ----------------------------------------------------------------------------
export const pageTypes = [
	{ val: "landing", label: "Landing page" },
	{ val: "blank", label: "Blank page" },
	{ val: "review", label: "Review page" },
	{ val: "editPage", label: "Edit page" },
	{ val: "summary", label: "Summary page" },
	{ val: "customSummary", label: "Custom summary page" },
	{ val: "confirmation", label: "Confirmation page" },
	{ val: "submission", label: "Submission page" },
	{ val: "error", label: "Error page" },
] as const;

/** Union of every valid page-type value: "landing" | "blank" | ... */
export type PageTypeVal = (typeof pageTypes)[number]["val"];

export interface HeaderSettings {
	headerType: string;
	dynamicOriginWithPublicSecure: boolean;
	enableExitPopup: boolean;
	exitPopupTitle: string;
	exitPopupMessage: string;
	exitPopupStayButtonLabel: string;
	exitPopupExitButtonLabel: string;
	headerInitScript: string;
	headerMenuItems?: HeaderMenuItem[];
}

export type HeaderMenuItem = {
    id: string;
	label: { en: string; fr: string };
	link?: { en: string; fr: string };
    icon: string;
};

export const getMenuOptions = (): HeaderMenuItem[] => [
    {
        id: 'myInbox',
        label: { en: 'My Inbox', fr: 'Ma boîte de réception' },
        // link: { en: getEnvVar('CXP_INBOX'), fr: getEnvVar('CXP_INBOX_F') },
        icon: '#ontario-icon-email',
    },
    {
        id: 'myAccount',
        label: { en: 'My Account', fr: 'Mon compte' },
        // link: { en: getEnvVar('CXP_MYACCOUNT'), fr: getEnvVar('CXP_MYACCOUNT_F') },
        icon: '#ontario-icon-account',
    },
    {
        id: 'myTransactions',
        label: { en: 'My Transactions', fr: 'Mes transactions' },
        // link: { en: getEnvVar('CXP_MYTRANSACTION'), fr: getEnvVar('CXP_MYTRANSACTION_F') },
        icon: '#ontario-icon-document',
    },
    {
        id: 'signout',
        label: { en: 'Sign out', fr: 'Déconnexion' },
        // link: { en: getEnvVar('CXP_SIGNOUT'), fr: getEnvVar('CXP_SIGNOUT_F') },
        icon: '#ontario-icon-exit',
    },
    {
        id: 'serviceOntario',
        label: { en: 'ServiceOntario dashboard', fr: 'ServiceOntario tableau de bord' },
        // link: { en: getEnvVar('PUBLIC_CXP_WEB_BASE_PATH'), fr: getEnvVar('PUBLIC_CXP_WEB_BASE_PATH') + '/fr' },
        icon: 'https://ws.train.cxp.mgcs.gov.on.ca/on-form-service/assets/images/Trillium_with_circle.png',
    },
];

export const menuOptions: HeaderMenuItem[] = getMenuOptions();

export const FooterType = [
	{ description: 'Simple', value: 'Simple' },
	{ description: 'Expanded', value: 'Expanded' },
	{ description: 'CXP', value: 'CXP' },
	{ description: 'Ministry of Labour', value: 'MOL' },
	{ description: 'BXP', value: 'BXP' },
	{ description: 'EHS Partner Portal', value: 'EHSPartnerPortal' },
];
export interface FooterSettings {
	footerType: string;
	expandedFooterContent: string;
}






// 3. Tie it to the element generically.


// ----------------------------------------------------------------------------
// 4. Form model
// ----------------------------------------------------------------------------
export interface FormSettings {
	formId: string;
	formName: { en: string; fr: string };
    // categoryId
	appTitle?: { en?: string; fr?: string };
	auth: string;
    createdDate: string;
    createdByUser: string;
    editable: boolean;
    lastUpdatedDate: string;
    lastUpdatedByUser: string;
    version: number;
    coOwners: string[];
    deployed: boolean;
    isComplete: boolean;
    // scopes
    // pdfTemplateId?: string;
    // headerType: HeaderTypeVal;
    // footerType: FooterTypeVal;

    // englishOnly: boolean;
    // enableExitModal: boolean;
    // exitModalContent?: ModalComponent;
    // enableTimeoutWarning: boolean;
    // timeoutWarningContent?: ModalComponent;

    // instructions: { en: string; fr: string };
    // declaration: { en: string; fr: string };

	headerSettings: HeaderSettings;
	footerSettings: FooterSettings;
    
    // form api configs
    UiAzureRegistration?: string;
    UiAzureTenantId?: string;
    redirectUrlOnAuthFailure?: string;
    redirectUrlOnSubmit?: string;
    updateApiUrl?: string;
    getApiUrl?: string;
    deleteApiUrl?: string;
    createApiUrl?: string;
    emailApiUrl?: string;
    downloadApiUrl?: string;
    initialDataApiUrl?: string;
    apiBasePath?: string;
    apiKeyKey?: string; 
    apiKeyValue?: string; 
    useProxy?: boolean; 
}
export interface FormLayout {
	formSettings: FormSettings;
	pages: FormPage[];
}
// Map of element id -> the user's current answer for that element. Passed to
// developer-defined conditions so they can decide visibility/routing freely.
export type FormAnswers = Record<string, unknown>;

// A developer-supplied condition. Return true to show an element or to take a
// routing branch. The developer writes whatever logic they want against the
// current answers — no operators or expression engine required.
export type Condition = (answers: FormAnswers) => boolean;



// --- Step indicator ---------------------------------------------------------

export interface StepIndicatorSettings {
	showStepIndicator: boolean;
	stepNumber?: number;
	totalSteps?: number;
	stepBtnLabel?: { en: string; fr: string };
	showBackButton?: boolean;
	backBtnLabel?: { en: string; fr: string };
}

// --- Page traversal (next-page routing) -------------------------------------

/** Comparison operators available when building a routing decision from a form value. */
export type BranchOperator = "equals" | "notEquals" | "contains" | "greaterThan" | "lessThan" | "isEmpty" | "isNotEmpty";

/** Human-readable labels for each operator, for use in dropdowns. */
export const branchOperators: { val: BranchOperator; label: string; needsValue: boolean }[] = [
	{ val: "equals", label: "equals", needsValue: true },
	{ val: "notEquals", label: "does not equal", needsValue: true },
	{ val: "contains", label: "contains", needsValue: true },
	{ val: "greaterThan", label: "is greater than", needsValue: true },
	{ val: "lessThan", label: "is less than", needsValue: true },
	{ val: "isEmpty", label: "is empty", needsValue: false },
	{ val: "isNotEmpty", label: "is not empty", needsValue: false },
];

/**
 * A serializable routing decision: "when the answer to `field` `operator`
 * `value`, take this branch". This lets the routing be edited entirely in the UI
 * (unlike a raw {@link Condition} function).
 */
export interface BranchRule {
	field: string;
	operator: BranchOperator;
	value?: string;
}

/** Build a runnable {@link Condition} from a serializable {@link BranchRule}. */
export const ruleToCondition =
	(rule: BranchRule): Condition =>
	(answers: FormAnswers): boolean => {
		const raw = answers[rule.field];
		const text = raw == null ? "" : String(raw);
		switch (rule.operator) {
			case "equals":
				return text === (rule.value ?? "");
			case "notEquals":
				return text !== (rule.value ?? "");
			case "contains":
				return text.includes(rule.value ?? "");
			case "greaterThan":
				return Number(text) > Number(rule.value ?? "");
			case "lessThan":
				return Number(text) < Number(rule.value ?? "");
			case "isEmpty":
				return text.trim() === "";
			case "isNotEmpty":
				return text.trim() !== "";
			default:
				return false;
		}
	};

export interface RoutingBranch {
	/** Serializable decision edited in the routing UI. */
	rule?: BranchRule;
	/** Runnable predicate (generated from `rule`, or supplied directly in code). */
	when?: Condition;
	targetPageId: string;
}

export interface PageTraversalSettings {
	defaultNextPageId?: string;
	branches?: RoutingBranch[];
	technicalErrorPageId?: string;
}

export interface PageSettings {
	pageId: string;
	pageType: PageTypeVal;
	previousPageId?: string;
	stepIndicator?: StepIndicatorSettings;
	traversalSettings?: PageTraversalSettings;
	[key: string]: unknown;
}

export interface FormPage {
	pageSettings: PageSettings;
	elements: FormElement[];
}
