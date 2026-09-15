import React, { useState } from "react";
import { pageTypes, PageTypeVal, FormPage, FormSettings, elementCatalog, ruleToCondition } from "../formRendering/Constants";
import ElementModal, { ElementConfig } from "../elements/elementModal";

import RoutingModal from "./routingModal";
import StepIndicatorModal from "./stepIndicatorModal";
import "./editForm.css";

/** Human-readable label for a page-type value. */
const pageTypeLabel = (val: PageTypeVal): string => pageTypes.find((t) => t.val === val)?.label ?? val;

/** Grouped element types for the "add element" picker (matches the catalog). */
const elementTypeGroups: { label: string; types: readonly string[] }[] = Object.values(elementCatalog).map((c) => ({
	label: c.label,
	types: c.types,
}));

/** Every next-page id declared on a page (default route + conditional branches). */
const nextPageIds = (page: FormPage): string[] => {
	const ids: string[] = [];
	if (page.pageSettings.traversalSettings?.defaultNextPageId) ids.push(page.pageSettings.traversalSettings.defaultNextPageId);
	page.pageSettings.traversalSettings?.branches?.forEach((branch) => {
		if (branch.targetPageId) ids.push(branch.targetPageId);
	});
	return ids;
};

/** Whether `toId` can be reached from `fromId` by following next-page routing. */
const isReachable = (pages: FormPage[], fromId: string, toId: string): boolean => {
	const byId = new Map(pages.map((page) => [page.pageSettings.pageId, page]));
	const start = byId.get(fromId);
	const seen = new Set<string>();
	let frontier = start ? nextPageIds(start) : [];
	while (frontier.length > 0) {
		const next: string[] = [];
		for (const id of frontier) {
			if (id === toId) return true;
			if (seen.has(id)) continue;
			seen.add(id);
			const page = byId.get(id);
			if (page) next.push(...nextPageIds(page));
		}
		frontier = next;
	}
	return false;
};

/** Two pages share a path if either can be reached from the other via routing. */
const onSamePath = (pages: FormPage[], aId: string, bId: string): boolean => isReachable(pages, aId, bId) || isReachable(pages, bId, aId);

interface StepConflict {
	page: FormPage;
	samePath: boolean;
}

/** Other pages that reuse the step number of `page`, flagged by shared path. */
const findStepConflicts = (pages: FormPage[], page: FormPage): StepConflict[] => {
	const step = page.pageSettings.stepIndicator?.stepNumber;
	if (step == null) return [];
	return pages
		.filter((other) => other.pageSettings.pageId !== page.pageSettings.pageId && other.pageSettings.stepIndicator?.stepNumber === step)
		.map((other) => ({
			page: other,
			samePath: onSamePath(pages, page.pageSettings.pageId, other.pageSettings.pageId),
		}));
};

/** Create a blank page with a unique id derived from the existing pages. */
const makePage = (existing: FormPage[]): FormPage => {
	const taken = new Set(existing.map((p) => p.pageSettings.pageId));
	let n = existing.length + 1;
	while (taken.has(`page-${n}`)) n += 1;
	return {
		pageSettings: {
			pageId: `page-${n}`,
			pageType: "blank",
			traversalSettings: {},
		},
		elements: [],
	};
};

/** Seed a new editing session with a small set of starter pages. */
const createInitialPages = (): FormPage[] => {
	const pages: FormPage[] = [];
	(["landing", "error"] as PageTypeVal[]).forEach((type) => {
		const page = makePage(pages);
		pages.push({ ...page, pageSettings: { ...page.pageSettings, pageType: type } });
	});
	// Wire a simple linear default route between the starter pages.
	return pages.map((page, index) => ({
		...page,
		pageSettings: {
			...page.pageSettings,
			traversalSettings: {
				...page.pageSettings.traversalSettings,
				defaultNextPageId: pages[index + 1]?.pageSettings.pageId,
			},
			previousPageId: pages[index - 1]?.pageSettings.pageId ?? "",
		},
	}));
};

/** A saved form record. Forms are stored under "savedForms" as `FormSettings`; we
 * additionally carry the form's `pages` so the editor can round-trip them. */
type SavedForm = FormSettings & { pages?: FormPage[] };

type LegacyFormPage = {
	pageId: string;
	pageType: PageTypeVal;
	pageSettings?: Record<string, unknown>;
	stepIndicator?: FormPage["pageSettings"]["stepIndicator"];
	traversalSettings?: FormPage["pageSettings"]["traversalSettings"];
	elements: FormPage["elements"];
};

/** Read the saved forms array from localStorage (empty if none/invalid). */
const readSavedForms = (): SavedForm[] => {
	try {
		return JSON.parse(localStorage.getItem("savedForms") ?? "[]") as SavedForm[];
	} catch {
		return [];
	}
};

/** Move pages saved with the previous flat structure into the current nested structure. */
const normalizePage = (page: FormPage | LegacyFormPage): FormPage => {
	if (!("pageId" in page)) return page;
	return {
		pageSettings: {
			...page.pageSettings,
			pageId: page.pageId,
			pageType: page.pageType,
			stepIndicator: page.stepIndicator,
			traversalSettings: page.traversalSettings,
		},
		elements: page.elements,
	};
};

/** Rebuild the runnable branch predicates that don't survive JSON serialization. */
const rehydratePage = (page: FormPage): FormPage => {
	const traversal = page.pageSettings.traversalSettings;
	if (!traversal) return page;
	return {
		...page,
		pageSettings: {
			...page.pageSettings,
			traversalSettings: {
				...traversal,
				branches: traversal.branches?.map((b) => (b.rule ? { ...b, when: ruleToCondition(b.rule) } : b)),
			},
		},
	};
};

/**
 * Load the pages to edit for `formId` plus the baseline to diff against.
 * If the form was already saved with pages, those are the starting point and the
 * baseline. Otherwise we seed starter pages and use an empty baseline, so the
 * first save lists every page as a new addition.
 */
const loadInitial = (formId: string, formName: { en: string; fr: string }): { pages: FormPage[]; baseline: FormPage[] } => {
	const record = [...readSavedForms()]
		.reverse()
		.find((f) => f.formId === formId && f.formName?.en === formName?.en && f.formName?.fr === formName?.fr);

	if (record?.pages?.length) {
		const pages = record.pages.map((page) => rehydratePage(normalizePage(page)));
		return { pages, baseline: pages };
	}
	return { pages: createInitialPages(), baseline: [] };
};

/** The serializable routing of a page, for change detection. */
const routingOf = (page: FormPage) => ({
	previous: page.pageSettings.previousPageId ?? "",
	default: page.pageSettings.traversalSettings?.defaultNextPageId ?? "",
	error: page.pageSettings.traversalSettings?.technicalErrorPageId ?? "",
	branches: (page.pageSettings.traversalSettings?.branches ?? []).map((b) => ({ rule: b.rule ?? null, target: b.targetPageId })),
});

/** Human-readable list of what changed within a single page. */
const describePageChanges = (before: FormPage, after: FormPage): string[] => {
	const msgs: string[] = [];
	if (before.pageSettings.pageType !== after.pageSettings.pageType) msgs.push(`type changed to "${after.pageSettings.pageType}"`);

	const beforeEls = new Map(before.elements.map((e) => [e.elementID, e]));
	const afterEls = new Map(after.elements.map((e) => [e.elementID, e]));
	after.elements.forEach((e) => {
		const prev = beforeEls.get(e.elementID);
		if (!prev) msgs.push(`added element "${e.elementID}" (${e.type})`);
		else if (prev.type !== e.type) msgs.push(`changed element "${e.elementID}" to ${e.type}`);
	});
	before.elements.forEach((e) => {
		if (!afterEls.has(e.elementID)) msgs.push(`removed element "${e.elementID}"`);
	});

	if (JSON.stringify(before.pageSettings.stepIndicator ?? null) !== JSON.stringify(after.pageSettings.stepIndicator ?? null))
		msgs.push("step indicator updated");
	if (JSON.stringify(routingOf(before)) !== JSON.stringify(routingOf(after))) msgs.push("routing updated");
	return msgs;
};

/** Human-readable list of changes between a saved baseline and the current pages. */
const summarizeChanges = (baseline: FormPage[], current: FormPage[]): string[] => {
	const out: string[] = [];
	const beforeById = new Map(baseline.map((p) => [p.pageSettings.pageId, p]));
	const afterById = new Map(current.map((p) => [p.pageSettings.pageId, p]));
	current.forEach((p) => {
		if (!beforeById.has(p.pageSettings.pageId)) out.push(`Added page "${p.pageSettings.pageId}"`);
	});
	baseline.forEach((p) => {
		if (!afterById.has(p.pageSettings.pageId)) out.push(`Removed page "${p.pageSettings.pageId}"`);
	});
	current.forEach((p) => {
		const before = beforeById.get(p.pageSettings.pageId);
		if (before) describePageChanges(before, p).forEach((m) => out.push(`Page "${p.pageSettings.pageId}": ${m}`));
	});
	return out;
};

interface SaveSummary {
	ok: boolean;
	message: string;
	items: string[];
}

export const EditForm: React.FC<{ formId: string; formName: { en: string; fr: string }; onEditProperties?: () => void }> = ({
	formId,
	formName,
	onEditProperties,
}) => {
	const [initial] = useState(() => loadInitial(formId, formName));
	const [pages, setPages] = useState<FormPage[]>(initial.pages);
	const [lastSaved, setLastSaved] = useState<FormPage[]>(initial.baseline);
	const [selectedPageId, setSelectedPageId] = useState<string>(() => initial.pages[0]?.pageSettings.pageId ?? "");
	const [elementModal, setElementModal] = useState<{ mode: "add" } | { mode: "edit"; elementID: string } | null>(null);
	const [showRouting, setShowRouting] = useState(false);
	const [showStepIndicatorModal, setShowStepIndicatorModal] = useState(false);
	const [saveSummary, setSaveSummary] = useState<SaveSummary | null>(null);

	const selectedIndex = pages.findIndex((p) => p.pageSettings.pageId === selectedPageId);
	const selectedPage = selectedIndex >= 0 ? pages[selectedIndex] : undefined;

	/** Immutably update a single page by id. */
	const updatePage = (pageId: string, updater: (page: FormPage) => FormPage) =>
		setPages((prev) => prev.map((page) => (page.pageSettings.pageId === pageId ? updater(page) : page)));

	const addPage = () =>
		setPages((prev) => {
			const page = makePage(prev);
			setSelectedPageId(page.pageSettings.pageId);
			return [...prev, page];
		});

	const removePage = (pageId: string) =>
		setPages((prev) => {
			const next = prev.filter((page) => page.pageSettings.pageId !== pageId);
			if (pageId === selectedPageId) {
				setSelectedPageId(next[0]?.pageSettings.pageId ?? "");
			}
			return next;
		});

	/** Next free auto-generated element id for a page (used to seed the modal). */
	const suggestedElementId = (page: FormPage): string => {
		const taken = new Set(page.elements.map((el) => el.elementID));
		let n = page.elements.length + 1;
		while (taken.has(`${page.pageSettings.pageId}-el-${n}`)) n += 1;
		return `${page.pageSettings.pageId}-el-${n}`;
	};

	const addElement = (pageId: string, config: ElementConfig) =>
		updatePage(pageId, (page) => ({
			...page,
			elements: [...page.elements, config],
		}));

	const editElement = (pageId: string, elementID: string, config: ElementConfig) => {
		updatePage(pageId, (page) => ({
			...page,
			elements: page.elements.map((el) => (el.elementID === elementID ? { ...el, ...config } : el)),
		}));
	};

	const removeElement = (pageId: string, elementID: string) =>
		updatePage(pageId, (page) => ({
			...page,
			elements: page.elements.filter((el) => el.elementID !== elementID),
		}));

	/** Save the form's pages into its "savedForms" record, the same store "Save
	 * form" writes to: update the record in place, bump its version and timestamp. */
	const savePage = () => {
		const forms = readSavedForms();
		const idx = forms.map((f) => f.formId).lastIndexOf(formId);
		if (idx === -1) {
			setSaveSummary({
				ok: false,
				message: "This form isn't saved yet. Use \u201cEdit form properties\u201d to save it first.",
				items: [],
			});
			return;
		}
		const changes = summarizeChanges(lastSaved, pages);
		const updated: SavedForm = {
			...forms[idx],
			pages,
			lastUpdatedDate: new Date().toISOString(),
			version: (forms[idx].version ?? 0) + 1,
		};
		forms[idx] = updated;
		localStorage.setItem("savedForms", JSON.stringify(forms));
		setLastSaved(pages);
		setSaveSummary({
			ok: true,
			message: `Saved as version ${updated.version}.`,
			items: changes,
		});
	};

	const pendingChanges = summarizeChanges(lastSaved, pages);

	/** Remove the step indicator from every page (used when paths branch). */
	const clearAllStepIndicators = () =>
		setPages((prev) => prev.map((page) => ({ ...page, pageSettings: { ...page.pageSettings, stepIndicator: undefined } })));

	const stepNumber = selectedPage?.pageSettings.stepIndicator?.stepNumber;
	const stepConflicts = selectedPage ? findStepConflicts(pages, selectedPage) : [];
	const samePathStepConflicts = stepConflicts.filter((c) => c.samePath);
	const branchingStepConflicts = stepConflicts.filter((c) => !c.samePath);
	const invalidStepNumber = stepNumber != null && (!Number.isInteger(stepNumber) || stepNumber < 1);

	return (
		<div className='edit-form'>
			<header className='edit-form__header'>
				<div>
					<h1 className='ontario-h1'>Edit form</h1>
					<p className='ontario-lead-statement'>Select a page to edit its settings, elements and routing.</p>
				</div>
				<article className='ontario-card ontario-card--default'>
					<div className='ontario-margin-left-16-!'>
						<h3 className='ontario-card__heading'>
							{formName?.en}
							<br></br>
							<span className='ontario-badge ontario-badge--default-light'>{formId}</span>
							<div className='ontario-margin-top-16-!'>
								{onEditProperties && (
									<button type='button' className='ontario-button ontario-button--secondary' onClick={onEditProperties}>
										Edit form properties
									</button>
								)}
							</div>
						</h3>
					</div>
				</article>
			</header>

			<div className='edit-form__layout'>
				{/* ------------------------------------------------------------ */}
				{/* Left panel — one card per page                                */}
				{/* ------------------------------------------------------------ */}
				<nav className='edit-form__sidebar' aria-labelledby='form-pages-heading'>
					<h2 id='form-pages-heading' className='ontario-h4 edit-form__sidebar-heading'>
						Pages ({pages.length})
					</h2>

					<ul className='edit-form__page-list'>
						{pages.map((page, index) => {
							const isSelected = page.pageSettings.pageId === selectedPageId;
							return (
								<li key={page.pageSettings.pageId}>
									<button
										type='button'
										onClick={() => setSelectedPageId(page.pageSettings.pageId)}
										aria-current={isSelected ? "true" : undefined}
										className={`edit-form__page-card${isSelected ? " edit-form__page-card--active" : ""}`}>
										<span className='edit-form__page-card-title'>
											{index + 1}. {page.pageSettings.pageId}
										</span>
										<span className='edit-form__page-card-type'>{pageTypeLabel(page.pageSettings.pageType)}</span>
										<span className='edit-form__page-card-count'>
											{page.elements.length} element{page.elements.length === 1 ? "" : "s"}
										</span>
									</button>
								</li>
							);
						})}
					</ul>
					<hr></hr>

					<button type='button' className='ontario-button ontario-button--secondary' onClick={addPage}>
						Add page
					</button>
					<button type='button' className='ontario-button ontario-button--secondary' onClick={() => setShowRouting(true)}>
						Page routing
					</button>
				</nav>

				{/* ------------------------------------------------------------ */}
				{/* Main edit area — settings + elements + routing                */}
				{/* ------------------------------------------------------------ */}
				<div className='edit-form__main'>
					{!selectedPage ? (
						<p className='ontario-lead-statement'>No page selected. Add a page to begin.</p>
					) : (
						<>
							{/* Page settings */}
							<section className='ontario-callout' aria-labelledby='page-settings-heading'>
								<h2 id='page-settings-heading' className='ontario-h3'>
									Page settings
								</h2>

								<label className='ontario-label' htmlFor='pageId'>
									Page ID
								</label>
								<input
									className='ontario-input'
									type='text'
									id='pageId'
									value={selectedPage.pageSettings.pageId}
									onChange={(e) => {
										const newId = e.target.value;
										const oldId = selectedPage.pageSettings.pageId;
										updatePage(oldId, (page) => ({
											...page,
											pageSettings: { ...page.pageSettings, pageId: newId },
										}));
										setSelectedPageId(newId);
									}}
								/>

								<label className='ontario-label' htmlFor='pageType'>
									Page type
								</label>
								<select
									className='ontario-input ontario-dropdown'
									id='pageType'
									value={selectedPage.pageSettings.pageType}
									onChange={(e) =>
										updatePage(selectedPage.pageSettings.pageId, (page) => ({
											...page,
											pageSettings: { ...page.pageSettings, pageType: e.target.value as PageTypeVal },
										}))
									}>
									{pageTypes.map((type) => (
										<option key={type.val} value={type.val}>
											{type.label}
										</option>
									))}
								</select>

								<div className='ontario-margin-top-16-!'>
									<p>
										<strong>Step indicator:</strong>{" "}
										{selectedPage.pageSettings.stepIndicator?.showStepIndicator
											? `Step ${selectedPage.pageSettings.stepIndicator.stepNumber ?? "not set"} of ${selectedPage.pageSettings.stepIndicator.totalSteps ?? "not set"}`
											: "Hidden"}
										<br />
										<strong>Continue/Next label:</strong>{" "}
										{selectedPage.pageSettings.stepIndicator?.stepBtnLabel?.en || selectedPage.pageSettings.stepIndicator?.stepBtnLabel?.fr
											? `${selectedPage.pageSettings.stepIndicator.stepBtnLabel.en || "Not set"} / ${selectedPage.pageSettings.stepIndicator.stepBtnLabel.fr || "Not set"}`
											: "Default"}
										<br />
										<strong>Back button:</strong>{" "}
										{selectedPage.pageSettings.stepIndicator?.showBackButton
											? selectedPage.pageSettings.stepIndicator.backBtnLabel?.en || selectedPage.pageSettings.stepIndicator.backBtnLabel?.fr
												? `${selectedPage.pageSettings.stepIndicator.backBtnLabel.en || "Not set"} / ${selectedPage.pageSettings.stepIndicator.backBtnLabel.fr || "Not set"}`
												: "Shown with default label"
											: "Hidden"}
									</p>
									<button
										type='button'
										className='ontario-button ontario-button--secondary'
										onClick={() => setShowStepIndicatorModal(true)}>
										Configure step indicator and navigation buttons
									</button>
								</div>

								{selectedPage.pageSettings.stepIndicator?.showStepIndicator && (
									<>
										{invalidStepNumber && (
											<p className='edit-form__error' role='alert'>
												Step number must be a whole number of 1 or more.
											</p>
										)}
										{samePathStepConflicts.length > 0 && (
											<p className='edit-form__error' role='alert'>
												Step number {stepNumber} is already used on this path by{" "}
												{samePathStepConflicts.map((c) => c.page.pageSettings.pageId).join(", ")}. Step numbers must be unique along a path.
											</p>
										)}

										{branchingStepConflicts.length > 0 && (
											<div className='edit-form__notice' role='alert'>
												<p>
													Step number {stepNumber} is also used by{" "}
													{branchingStepConflicts.map((c) => c.page.pageSettings.pageId).join(", ")} on a
													different path. A step indicator only works for one linear path, so it can&apos;t be used once pages branch.
												</p>
												<button type='button' className='ontario-button ontario-button--secondary' onClick={clearAllStepIndicators}>
													Remove step numbers and use page routing instead
												</button>
											</div>
										)}
									</>
								)}
							</section>

							{/* Elements */}
							<section aria-labelledby='page-elements-heading'>
								<h2 id='page-elements-heading' className='ontario-h3'>
									Elements ({selectedPage.elements.length})
								</h2>

								{selectedPage.elements.length === 0 ? (
									<p className='ontario-hint'>No elements yet. Add your first element to this page.</p>
								) : (
									<ol className='ontario-list ontario-list--ordered'>
										{selectedPage.elements.map((element) => (
											<li key={element.elementID}>
												<strong>{element.type}</strong> <span className='ontario-label__flag'>(id: {element.elementID})</span>{" "}
												<button
													type='button'
													className='ontario-button ontario-button--tertiary'
													onClick={() => setElementModal({ mode: "edit", elementID: element.elementID })}>
													Edit
												</button>
												<button
													type='button'
													className='ontario-button ontario-button--tertiary'
													onClick={() => removeElement(selectedPage.pageSettings.pageId, element.elementID)}>
													Remove
												</button>
											</li>
										))}
									</ol>
								)}

								<div className='edit-form__row'>
									<button
										type='button'
										className='ontario-button ontario-button--secondary'
										onClick={() => setElementModal({ mode: "add" })}>
										Add element
									</button>
								</div>
							</section>
							<hr></hr>
							<div className='ontario-margin-top-24-!'>
								{pendingChanges.length > 0 && (
									<div className='edit-form__notice' role='status'>
										<p>
											<strong>Unsaved changes ({pendingChanges.length}):</strong>
										</p>
										<ul className='ontario-list'>
											{pendingChanges.map((change, i) => (
												<li key={i}>{change}</li>
											))}
										</ul>
									</div>
								)}

								{saveSummary && pendingChanges.length === 0 && (
									<div className={saveSummary.ok ? "edit-form__saved" : "edit-form__notice"} role='status'>
										<p>
											<strong>{saveSummary.message}</strong>
										</p>
										{saveSummary.ok &&
											(saveSummary.items.length > 0 ? (
												<ul className='ontario-list'>
													{saveSummary.items.map((item, i) => (
														<li key={i}>{item}</li>
													))}
												</ul>
											) : (
												<p>No changes were detected, but the form was re-saved at {new Date().toLocaleTimeString()}.</p>
											))}
									</div>
								)}

								<button type='button' className='ontario-button ontario-button--primary' onClick={savePage}>
									Save form
								</button>
								<button
									type='button'
									className='ontario-button ontario-button--tertiary'
									onClick={() => removePage(selectedPage.pageSettings.pageId)}
									disabled={pages.length === 1}>
									Remove this page
								</button>
							</div>
						</>
					)}
				</div>
			</div>

			{showRouting && <RoutingModal pages={pages} onChangePages={setPages} onClose={() => setShowRouting(false)} />}

			{showStepIndicatorModal && selectedPage && (
				<StepIndicatorModal
					settings={selectedPage.pageSettings.stepIndicator}
					onSave={(settings) => {
						updatePage(selectedPage.pageSettings.pageId, (page) => ({
							...page,
							pageSettings: { ...page.pageSettings, stepIndicator: settings },
						}));
						setShowStepIndicatorModal(false);
					}}
					onCancel={() => setShowStepIndicatorModal(false)}
				/>
			)}

			{elementModal &&
				selectedPage &&
				(() => {
					const editing =
						elementModal.mode === "edit" ? selectedPage.elements.find((el) => el.elementID === elementModal.elementID) : undefined;
					// In edit mode the element keeps its own id, so exclude it from the duplicate check.
					const existingIds = selectedPage.elements.filter((el) => el.elementID !== editing?.elementID).map((el) => el.elementID);
					return (
						<ElementModal
							mode={elementModal.mode}
							elementList={elementTypeGroups}
							defaultType={editing?.type}
							initialSettings={editing?.settings}
							existingIds={existingIds}
							suggestedId={editing?.elementID ?? suggestedElementId(selectedPage)}
							onSave={(config) => {
								if (elementModal.mode === "add") addElement(selectedPage.pageSettings.pageId, config);
								else if (elementModal.mode === "edit" && editing)
									editElement(selectedPage.pageSettings.pageId, editing.elementID, config);
								setElementModal(null);
							}}
							onCancel={() => setElementModal(null)}
						/>
					);
				})()}
		</div>
	);
};

export default EditForm;
