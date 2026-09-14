/**
 * Ontario Design System (v2.8.0) class name constants.
 *
 * Class names are organized by element type and, where relevant, by the
 * scenario / variant in which they are used. Values are the literal CSS class
 * strings used by the Ontario Design System markup.
 *
 * Usage:
 *   import { OntarioClassNames } from "./ontarioClassNames";
 *   <button className={OntarioClassNames.Button.primary}>Submit</button>
 */

/* -------------------------------------------------------------------------- */
/* Layout & grid                                                              */
/* -------------------------------------------------------------------------- */
export const Layout = {
	row: "ontario-row",
	column: "ontario-column",
	columns: "ontario-columns",
	overlay: "ontario-overlay",
	// Column sizing
	small12: "ontario-small-12",
	small6: "ontario-small-6",
	medium12: "ontario-medium-12",
	large12: "ontario-large-12",
	// Visibility / responsive helpers
	showForSr: "ontario-show-for-sr",
	showOnFocus: "ontario-show-on-focus",
	showForLarge: "ontario-show-for-large",
	showForSmallOnly: "ontario-show-for-small-only",
	showForMedium: "ontario-show-for-medium",
	hideForSmall: "ontario-hide-for-small",
	hideForLarge: "ontario-hide-for-large",
	hideForMediumOnly: "ontario-hide-for-medium-only",
	hideForSmallOnly: "ontario-hide-for-small-only",
} as const;

/* -------------------------------------------------------------------------- */
/* Typography & headings                                                      */
/* -------------------------------------------------------------------------- */
export const Typography = {
	h1: "ontario-h1",
	h2: "ontario-h2",
	h3: "ontario-h3",
	h4: "ontario-h4",
	h5: "ontario-h5",
	h6: "ontario-h6",
} as const;

/* -------------------------------------------------------------------------- */
/* Form group (wrapper for inputs/fieldsets)                                  */
/* -------------------------------------------------------------------------- */
export const FormGroup = {
	base: "ontario-form-group",
} as const;

/* -------------------------------------------------------------------------- */
/* Labels                                                                     */
/* -------------------------------------------------------------------------- */
export const Label = {
	base: "ontario-label",
	large: "ontario-label--large",
	heading: "ontario-label--heading",
	/** "(required/optional)" flag appended to a label/legend. */
	flag: "ontario-label__flag",
} as const;

/* -------------------------------------------------------------------------- */
/* Hint text & hint expander                                                  */
/* -------------------------------------------------------------------------- */
export const Hint = {
	text: "ontario-hint",
	expanderContainer: "ontario-hint-expander__container",
	expanderButton: "ontario-hint-expander__button",
	expanderButtonIconClose: "ontario-hint-expander__button-icon--close",
	expanderButtonIconOpen: "ontario-hint-expander__button-icon--open",
	expanderContent: "ontario-hint-expander__content",
} as const;

/* -------------------------------------------------------------------------- */
/* Text inputs                                                                */
/* -------------------------------------------------------------------------- */
export const Input = {
	base: "ontario-input",
	// Width override scenarios
	width2Char: "ontario-input--2-char-width",
	width3Char: "ontario-input--3-char-width",
	width4Char: "ontario-input--4-char-width",
	width5Char: "ontario-input--5-char-width",
	width7Char: "ontario-input--7-char-width",
	width10Char: "ontario-input--10-char-width",
	width20Char: "ontario-input--20-char-width",
} as const;

/* -------------------------------------------------------------------------- */
/* Text areas                                                                 */
/* -------------------------------------------------------------------------- */
export const Textarea = {
	/** Combine with Input.base. */
	base: "ontario-textarea",
} as const;

/* -------------------------------------------------------------------------- */
/* Dropdown / select                                                          */
/* -------------------------------------------------------------------------- */
export const Dropdown = {
	/** Combine with Input.base. */
	base: "ontario-dropdown",
} as const;

/* -------------------------------------------------------------------------- */
/* Checkboxes                                                                 */
/* -------------------------------------------------------------------------- */
export const Checkboxes = {
	group: "ontario-checkboxes",
	item: "ontario-checkboxes__item",
	input: "ontario-checkboxes__input",
	label: "ontario-checkboxes__label",
} as const;

/* -------------------------------------------------------------------------- */
/* Radio buttons                                                              */
/* -------------------------------------------------------------------------- */
export const Radios = {
	group: "ontario-radios",
	item: "ontario-radios__item",
	input: "ontario-radios__input",
	label: "ontario-radios__label",
} as const;

/* -------------------------------------------------------------------------- */
/* Fieldset & legend                                                          */
/* -------------------------------------------------------------------------- */
export const Fieldset = {
	base: "ontario-fieldset",
	legend: "ontario-fieldset__legend",
} as const;

/* -------------------------------------------------------------------------- */
/* Buttons                                                                    */
/* -------------------------------------------------------------------------- */
export const Button = {
	base: "ontario-button",
	primary: "ontario-button--primary",
	secondary: "ontario-button--secondary",
	tertiary: "ontario-button--tertiary",
} as const;

/* -------------------------------------------------------------------------- */
/* Back button / back to top                                                  */
/* -------------------------------------------------------------------------- */
export const BackButton = {
	/** Use with Button.base + Button.tertiary. */
	base: "ontario-back-button",
} as const;

export const BackToTop = {
	default: "ontario-back-to-top--default",
} as const;

/* -------------------------------------------------------------------------- */
/* Search box                                                                 */
/* -------------------------------------------------------------------------- */
export const Search = {
	container: "ontario-search__container",
	inputContainer: "ontario-search__input-container",
	/** Combine with Input.base. */
	input: "ontario-search__input",
	reset: "ontario-search__reset",
	submit: "ontario-search__submit",
} as const;

/* -------------------------------------------------------------------------- */
/* Page alerts (informational / error / success / warning)                    */
/* -------------------------------------------------------------------------- */
export const Alert = {
	base: "ontario-alert",
	informational: "ontario-alert--informational",
	error: "ontario-alert--error",
	success: "ontario-alert--success",
	warning: "ontario-alert--warning",
	header: "ontario-alert__header",
	headerIcon: "ontario-alert__header-icon",
	headerTitle: "ontario-alert__header-title",
	body: "ontario-alert__body",
} as const;

/* -------------------------------------------------------------------------- */
/* Critical alert                                                             */
/* -------------------------------------------------------------------------- */
export const CriticalAlert = {
	base: "ontario-critical-alert",
	body: "ontario-critical-alert__body",
	icon: "ontario-critical-alert__icon",
} as const;

/* -------------------------------------------------------------------------- */
/* Callouts & asides                                                          */
/* -------------------------------------------------------------------------- */
export const Callout = {
	base: "ontario-callout",
	title: "ontario-callout__title",
} as const;

export const Aside = {
	base: "ontario-aside",
	title: "ontario-aside__title",
} as const;

/* -------------------------------------------------------------------------- */
/* Blockquote                                                                 */
/* -------------------------------------------------------------------------- */
export const Blockquote = {
	base: "ontario-blockquote",
	short: "ontario-blockquote--short",
	attribution: "ontario-blockquote__attribution",
	byline: "ontario-blockquote__byline",
} as const;

/* -------------------------------------------------------------------------- */
/* Badges                                                                     */
/* -------------------------------------------------------------------------- */
export const Badge = {
	container: "ontario-badge__container",
	base: "ontario-badge",
	// Default / neutral scenarios
	defaultHeavy: "ontario-badge--default-heavy",
	defaultLight: "ontario-badge--default-light",
	neutralHeavy: "ontario-badge--neutral-heavy",
	neutralLight: "ontario-badge--neutral-light",
	// System feedback scenarios
	alertHeavy: "ontario-badge--alert-heavy",
	warningHeavy: "ontario-badge--warning-heavy",
	successHeavy: "ontario-badge--success-heavy",
} as const;

/* -------------------------------------------------------------------------- */
/* Accordions                                                                 */
/* -------------------------------------------------------------------------- */
export const Accordion = {
	container: "ontario-accordions__container",
	controls: "ontario-accordion__controls",
	expandAllButton: "ontario-accordion__button--expand-all",
	expandOpenAll: "ontario-accordion--expand-open-all",
	expandCloseAll: "ontario-accordion--expand-close-all",
	base: "ontario-accordion",
	heading: "ontario-accordion-heading",
	button: "ontario-accordion__button",
	buttonIconClose: "ontario-accordion__button-icon--close",
	buttonIconOpen: "ontario-accordion__button-icon--open",
	content: "ontario-accordion__content",
} as const;

/* -------------------------------------------------------------------------- */
/* Cards                                                                      */
/* -------------------------------------------------------------------------- */
export const Card = {
	container: "ontario-card__container",
	base: "ontario-card",
	// Header style scenarios
	default: "ontario-card--default",
	light: "ontario-card--light",
	dark: "ontario-card--dark",
	// Content scenarios
	noDescription: "ontario-card--no-description",
	noImage: "ontario-card--no-image",
	imageTrue: "ontario-card--image-true",
	imageOneThird: "ontario-card--image--one-third",
	imageOneFourth: "ontario-card--image--one-fourth",
	// Orientation scenarios
	positionVertical: "ontario-card--position-vertical",
	positionHorizontal: "ontario-card--position-horizontal",
	positionHorizontalImageLeft: "ontario-card--position-horizontal__image-left",
	positionHorizontalImageRight: "ontario-card--position-horizontal__image-right",
	// Cards-per-row scenarios
	cardsPerRow2: "ontario-card--cards-per-row-2",
	cardsPerRow3: "ontario-card--cards-per-row-3",
	// Sub-elements
	textContainer: "ontario-card__text-container",
	imageContainer: "ontario-card__image-container",
	image: "ontario-card__image",
	heading: "ontario-card__heading",
	description: "ontario-card__description",
} as const;

/* -------------------------------------------------------------------------- */
/* Tables                                                                     */
/* -------------------------------------------------------------------------- */
export const Table = {
	container: "ontario-table-container",
	scrollWrapper: "ontario-table-scroll--wrapper",
	scrollDiv: "ontario-table-scroll--div",
	div: "ontario-table-div",
	cellNumeric: "ontario-table-cell--numeric",
} as const;

/* -------------------------------------------------------------------------- */
/* Task list                                                                  */
/* -------------------------------------------------------------------------- */
export const TaskList = {
	container: "ontario-task-list__container",
	list: "ontario-task-list",
	task: "ontario-task",
	link: "ontario-task__link",
	content: "ontario-task__content",
	text: "ontario-task__text",
	label: "ontario-task__label",
	// Status scenarios
	statusNotStarted: "ontario-task-status--not-started",
} as const;

/* -------------------------------------------------------------------------- */
/* Summary list                                                               */
/* -------------------------------------------------------------------------- */
export const SummaryList = {
	base: "ontario-summary-list",
	headingContainer: "ontario-summary-list-heading__container",
	heading: "ontario-summary-list__heading",
	container: "ontario-summary-list__container",
	row: "ontario-summary-list__row",
	key: "ontario-summary-list__key",
	value: "ontario-summary-list__value",
	buttonContainer: "ontario-summary-list-button__container",
	changeButton: "ontario-summary-list-change__button",
} as const;

/* -------------------------------------------------------------------------- */
/* Step indicator                                                             */
/* -------------------------------------------------------------------------- */
export const StepIndicator = {
	base: "ontario-step-indicator",
	withoutBackButton: "ontario-step-indicator--without-back-button",
	withBackButton: "ontario-step-indicator--with-back-button",
} as const;

/* -------------------------------------------------------------------------- */
/* In-page navigation                                                         */
/* -------------------------------------------------------------------------- */
export const PageNavigation = {
	base: "ontario-page-navigation",
	content: "ontario-page-navigation-content",
	header: "ontario-page-navigation-header",
	list: "ontario-page-navigation-list",
	listItem: "ontario-page-navigation-list__item",
	itemLink: "ontario-page-navigation-item__link",
} as const;

/* -------------------------------------------------------------------------- */
/* Loading indicator                                                          */
/* -------------------------------------------------------------------------- */
export const LoadingIndicator = {
	overlay: "ontario-loading-indicator__overlay",
	base: "ontario-loading-indicator",
	spinner: "ontario-loading-indicator__spinner",
} as const;

/* -------------------------------------------------------------------------- */
/* Icons                                                                      */
/* -------------------------------------------------------------------------- */
export const Icon = {
	base: "ontario-icon",
} as const;

/* -------------------------------------------------------------------------- */
/* Headers (application / Ontario / ServiceOntario)                           */
/* -------------------------------------------------------------------------- */
export const Header = {
	base: "ontario-header",
	container: "ontario-header__container",
	id: "ontario-header", // also used as element id
	languageToggler: "ontario-header__language-toggler",
	button: "ontario-header-button",
	buttonWithOutline: "ontario-header-button--with-outline",
	buttonWithoutOutline: "ontario-header-button--without-outline",
	menuToggle: "ontario-header__menu-toggle",
	// Application header
	applicationHeader: "ontario-application-header",
	applicationHeaderLogo: "ontario-application-header__logo",
	applicationHeaderLangToggle: "ontario-application-header__lang-toggle",
	applicationSubheaderMenuContainer: "ontario-application-subheader-menu__container",
	applicationSubheader: "ontario-application-subheader",
	applicationSubheaderContainer: "ontario-application-subheader__container",
	applicationSubheaderHeading: "ontario-application-subheader__heading",
	applicationSubheaderMenu: "ontario-application-subheader__menu",
	applicationSubheaderMenuContainerInner: "ontario-application-subheader__menu-container",
	// Navigation
	navigation: "ontario-navigation",
	navigationContainer: "ontario-navigation__container",
} as const;

/* -------------------------------------------------------------------------- */
/* Footer (simple / expanded)                                                 */
/* -------------------------------------------------------------------------- */
export const Footer = {
	base: "ontario-footer",
	default: "ontario-footer--default",
	expanded: "ontario-footer--expanded",
	linksContainer: "ontario-footer__links-container",
	linksContainerInline: "ontario-footer__links-container--inline",
	link: "ontario-footer__link",
	copyright: "ontario-footer__copyright",
} as const;

/* -------------------------------------------------------------------------- */
/* Aggregate export                                                           */
/* -------------------------------------------------------------------------- */
export const ContentTypes = {
	Layout,
	Typography,
	FormGroup,
	Label,
	Hint,
	Input,
	Textarea,
	Dropdown,
	Checkboxes,
	Radios,
	Fieldset,
	Button,
	BackButton,
	BackToTop,
	Search,
	Alert,
	CriticalAlert,
	Callout,
	Aside,
	Blockquote,
	Badge,
	Accordion,
	Card,
	Table,
	TaskList,
	SummaryList,
	StepIndicator,
	PageNavigation,
	LoadingIndicator,
	Icon,
	Header,
	Footer,
} as const;

export default ContentTypes;
