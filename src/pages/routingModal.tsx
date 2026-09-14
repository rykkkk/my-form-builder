import React, { useEffect, useMemo, useRef, useState } from "react";
import { FormPage, PageTypeVal, pageTypes, branchOperators, BranchOperator, BranchRule, RoutingBranch, ruleToCondition } from "../formRendering/Constants";
import "./routingModal.css";

const NODE_W = 200;
const NODE_H = 116;
const GAP_X = 120;
const GAP_Y = 60;

type Point = { x: number; y: number };
type HandleKind = "default" | "branch" | "error";

interface RoutingModalProps {
	pages: FormPage[];
	/** Commit an updated copy of the whole page list. */
	onChangePages: (next: FormPage[]) => void;
	onClose: () => void;
}

const pageTypeLabel = (val: PageTypeVal): string => pageTypes.find((t) => t.val === val)?.label ?? val;

/** Lay pages out left-to-right in levels based on default/branch reachability from the first page. */
const autoLayout = (pages: FormPage[]): Record<string, Point> => {
	const byId = new Map(pages.map((p) => [p.pageSettings.pageId, p]));
	const level = new Map<string, number>();
	const start = pages[0]?.pageSettings.pageId;
	if (start) {
		let frontier = [start];
		level.set(start, 0);
		const seen = new Set<string>([start]);
		while (frontier.length) {
			const next: string[] = [];
			for (const id of frontier) {
				const page = byId.get(id);
				if (!page) continue;
				const targets: string[] = [];
				if (page.pageSettings.traversalSettings?.defaultNextPageId) targets.push(page.pageSettings.traversalSettings.defaultNextPageId);
				page.pageSettings.traversalSettings?.branches?.forEach((b) => b.targetPageId && targets.push(b.targetPageId));
				if (page.pageSettings.traversalSettings?.technicalErrorPageId)
					targets.push(page.pageSettings.traversalSettings.technicalErrorPageId);
				for (const t of targets) {
					if (!byId.has(t)) continue;
					if (!level.has(t)) level.set(t, (level.get(id) ?? 0) + 1);
					if (!seen.has(t)) {
						seen.add(t);
						next.push(t);
					}
				}
			}
			frontier = next;
		}
	}
	// Pages never reached get appended to the last column.
	const maxLevel = pages.reduce((m, p) => Math.max(m, level.get(p.pageSettings.pageId) ?? 0), 0);
	pages.forEach((p) => {
		if (!level.has(p.pageSettings.pageId)) level.set(p.pageSettings.pageId, maxLevel + 1);
	});

	const perColumn = new Map<number, number>();
	const positions: Record<string, Point> = {};
	pages.forEach((p) => {
		const col = level.get(p.pageSettings.pageId) ?? 0;
		const row = perColumn.get(col) ?? 0;
		perColumn.set(col, row + 1);
		positions[p.pageSettings.pageId] = {
			x: 40 + col * (NODE_W + GAP_X),
			y: 40 + row * (NODE_H + GAP_Y),
		};
	});
	return positions;
};

/** Centre point of a node from its top-left position. */
const center = (p: Point): Point => ({ x: p.x + NODE_W / 2, y: p.y + NODE_H / 2 });

/** Where the line from `from` to the node centred at `c` crosses the node's border. */
const borderPoint = (c: Point, from: Point): Point => {
	const dx = from.x - c.x;
	const dy = from.y - c.y;
	if (dx === 0 && dy === 0) return c;
	const hw = NODE_W / 2;
	const hh = NODE_H / 2;
	const scale = 1 / Math.max(Math.abs(dx) / hw, Math.abs(dy) / hh);
	return { x: c.x + dx * scale, y: c.y + dy * scale };
};

export default function RoutingModal({ pages, onChangePages, onClose }: RoutingModalProps) {
	const [positions, setPositions] = useState<Record<string, Point>>(() => autoLayout(pages));
	const [selectedId, setSelectedId] = useState<string>(pages[0]?.pageSettings.pageId ?? "");
	const [drag, setDrag] = useState<{ id: string; offset: Point } | null>(null);
	const [connect, setConnect] = useState<{ fromId: string; kind: HandleKind; pointer: Point } | null>(null);

	const surfaceRef = useRef<HTMLDivElement | null>(null);
	const onCloseRef = useRef(onClose);
	onCloseRef.current = onClose;

	// Keep positions in sync as pages are added or removed.
	useEffect(() => {
		setPositions((prev) => {
			const next = { ...prev };
			let changed = false;
			const fresh = autoLayout(pages);
			pages.forEach((p) => {
				if (!next[p.pageSettings.pageId]) {
					next[p.pageSettings.pageId] = fresh[p.pageSettings.pageId];
					changed = true;
				}
			});
			Object.keys(next).forEach((id) => {
				if (!pages.some((p) => p.pageSettings.pageId === id)) {
					delete next[id];
					changed = true;
				}
			});
			return changed ? next : prev;
		});
	}, [pages]);

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onCloseRef.current();
		};
		document.addEventListener("keydown", onKeyDown);
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.removeEventListener("keydown", onKeyDown);
			document.body.style.overflow = previousOverflow;
		};
	}, []);

	/** Convert a pointer event to coordinates inside the scrollable surface. */
	const toSurface = (clientX: number, clientY: number): Point => {
		const surface = surfaceRef.current;
		if (!surface) return { x: clientX, y: clientY };
		const rect = surface.getBoundingClientRect();
		return { x: clientX - rect.left, y: clientY - rect.top };
	};

	/** The node (if any) whose rectangle contains the given surface point. */
	const nodeAt = (pt: Point): string | undefined =>
		pages.find((p) => {
			const pos = positions[p.pageSettings.pageId];
			return pos && pt.x >= pos.x && pt.x <= pos.x + NODE_W && pt.y >= pos.y && pt.y <= pos.y + NODE_H;
		})?.pageSettings.pageId;

	// Global listeners while dragging a node or drawing a connection.
	useEffect(() => {
		if (!drag && !connect) return undefined;
		const onMove = (e: PointerEvent) => {
			const pt = toSurface(e.clientX, e.clientY);
			if (drag) {
				setPositions((prev) => ({ ...prev, [drag.id]: { x: pt.x - drag.offset.x, y: pt.y - drag.offset.y } }));
			} else if (connect) {
				setConnect((prev) => (prev ? { ...prev, pointer: pt } : prev));
			}
		};
		const onUp = (e: PointerEvent) => {
			if (connect) {
				const targetId = nodeAt(toSurface(e.clientX, e.clientY));
				if (targetId && targetId !== connect.fromId) applyConnection(connect.fromId, connect.kind, targetId);
			}
			setDrag(null);
			setConnect(null);
		};
		window.addEventListener("pointermove", onMove);
		window.addEventListener("pointerup", onUp);
		return () => {
			window.removeEventListener("pointermove", onMove);
			window.removeEventListener("pointerup", onUp);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [drag, connect, positions, pages]);

	/** Immutably update one page's traversal settings and commit the change. */
	const updateTraversal = (
		pageId: string,
		updater: (
			t: NonNullable<FormPage["pageSettings"]["traversalSettings"]>,
		) => FormPage["pageSettings"]["traversalSettings"],
	) => {
		onChangePages(
			pages.map((p) =>
				p.pageSettings.pageId === pageId
					? {
							...p,
							pageSettings: {
								...p.pageSettings,
								traversalSettings: updater(p.pageSettings.traversalSettings ?? {}),
							},
						}
					: p,
			),
		);
	};

	const updatePageSettings = (pageId: string, patch: Record<string, unknown>) => {
		onChangePages(pages.map((p) => (p.pageSettings.pageId === pageId ? { ...p, pageSettings: { ...p.pageSettings, ...patch } } : p)));
	};

	/** Apply a drag-created connection from a handle onto a target node. */
	const applyConnection = (fromId: string, kind: HandleKind, targetId: string) => {
		if (kind === "default") updateTraversal(fromId, (t) => ({ ...t, defaultNextPageId: targetId }));
		else if (kind === "error") updateTraversal(fromId, (t) => ({ ...t, technicalErrorPageId: targetId }));
		else {
			const firstField = pages.flatMap((p) => p.elements)[0]?.elementID ?? "";
			const rule: BranchRule = { field: firstField, operator: "equals", value: "" };
			const branch: RoutingBranch = { rule, when: ruleToCondition(rule), targetPageId: targetId };
			updateTraversal(fromId, (t) => ({ ...t, branches: [...(t.branches ?? []), branch] }));
		}
		setSelectedId(fromId);
	};

	const startNodeDrag = (e: React.PointerEvent, pageId: string) => {
		const pos = positions[pageId];
		if (!pos) return;
		const pt = toSurface(e.clientX, e.clientY);
		setSelectedId(pageId);
		setDrag({ id: pageId, offset: { x: pt.x - pos.x, y: pt.y - pos.y } });
	};

	const startConnect = (e: React.PointerEvent, pageId: string, kind: HandleKind) => {
		e.stopPropagation();
		const pt = toSurface(e.clientX, e.clientY);
		setConnect({ fromId: pageId, kind, pointer: pt });
	};

	// All elements in the form, for the decision "field" dropdown.
	const allFields = useMemo(
		() => pages.flatMap((p) => p.elements.map((el) => ({ id: el.elementID, label: `${el.elementID} (${el.type})` }))),
		[pages],
	);

	const selectedPage = pages.find((p) => p.pageSettings.pageId === selectedId);
	const otherPages = pages.filter((p) => p.pageSettings.pageId !== selectedId);

	// --- Branch editing helpers (operate on the selected page) ---
	const setBranch = (index: number, updater: (b: RoutingBranch) => RoutingBranch) => {
		if (!selectedPage) return;
		updateTraversal(selectedPage.pageSettings.pageId, (t) => ({
			...t,
			branches: (t.branches ?? []).map((b, i) => (i === index ? updater(b) : b)),
		}));
	};

	const setBranchRule = (index: number, patch: Partial<BranchRule>) =>
		setBranch(index, (b) => {
			const rule: BranchRule = { field: "", operator: "equals", value: "", ...b.rule, ...patch };
			return { ...b, rule, when: ruleToCondition(rule) };
		});

	const removeBranch = (index: number) => {
		if (!selectedPage) return;
		updateTraversal(selectedPage.pageSettings.pageId, (t) => ({ ...t, branches: (t.branches ?? []).filter((_, i) => i !== index) }));
	};

	const addBranch = () => {
		if (!selectedPage) return;
		const rule: BranchRule = { field: allFields[0]?.id ?? "", operator: "equals", value: "" };
		updateTraversal(selectedPage.pageSettings.pageId, (t) => ({
			...t,
			branches: [...(t.branches ?? []), { rule, when: ruleToCondition(rule), targetPageId: otherPages[0]?.pageSettings.pageId ?? "" }],
		}));
	};

	// --- Edge geometry ---
	type Edge = { from: string; to: string; kind: HandleKind; label?: string };
	const edges: Edge[] = [];
	pages.forEach((p) => {
		const t = p.pageSettings.traversalSettings;
		if (t?.defaultNextPageId && positions[t.defaultNextPageId])
			edges.push({ from: p.pageSettings.pageId, to: t.defaultNextPageId, kind: "default" });
		t?.branches?.forEach((b) => {
			if (b.targetPageId && positions[b.targetPageId]) {
				const op = branchOperators.find((o) => o.val === b.rule?.operator);
				const label = b.rule
					? `${b.rule.field || "?"} ${op?.label ?? ""}${op?.needsValue ? ` ${b.rule.value ?? ""}` : ""}`
					: "branch";
				edges.push({ from: p.pageSettings.pageId, to: b.targetPageId, kind: "branch", label });
			}
		});
		if (t?.technicalErrorPageId && positions[t.technicalErrorPageId])
			edges.push({ from: p.pageSettings.pageId, to: t.technicalErrorPageId, kind: "error" });
	});

	const edgeColor: Record<HandleKind, string> = { default: "#0066cc", branch: "#d97706", error: "#cd0000" };

	return (
		<div className='routing-modal__overlay' role='presentation' onMouseDown={onClose}> {/* eslint-disable-line jsx-a11y/no-noninteractive-element-interactions */}
			{/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
			<div className='routing-modal' role='dialog' aria-modal='true' aria-labelledby='routing-modal-title' onMouseDown={(e) => e.stopPropagation()}>
				<div className='routing-modal__header'>
					<h2 id='routing-modal-title' className='ontario-h3 routing-modal__title'>
						Page routing
					</h2>
					<div className='routing-legend' aria-hidden='true'>
						<span className='routing-legend__item'>
							<span className='routing-legend__swatch routing-legend__swatch--default' /> Default next
						</span>
						<span className='routing-legend__item'>
							<span className='routing-legend__swatch routing-legend__swatch--branch' /> Decision branch
						</span>
						<span className='routing-legend__item'>
							<span className='routing-legend__swatch routing-legend__swatch--error' /> Error route
						</span>
					</div>
					<button type='button' className='ontario-button ontario-button--secondary' onClick={onClose}>
						Done
					</button>
				</div>

				<div className='routing-modal__body'>
					{/* Flowchart canvas */}
					<div className='routing-canvas'>
						<div className='routing-canvas__surface' ref={surfaceRef}>
							<svg className='routing-edges'>
								<defs>
									{(["default", "branch", "error"] as HandleKind[]).map((k) => (
										<marker key={k} id={`arrow-${k}`} markerWidth='10' markerHeight='10' refX='8' refY='3' orient='auto' markerUnits='strokeWidth'>
											<path d='M0,0 L8,3 L0,6 Z' fill={edgeColor[k]} />
										</marker>
									))}
								</defs>
								{edges.map((edge, i) => {
									const from = positions[edge.from];
									const to = positions[edge.to];
									if (!from || !to) return null;
									const sc = center(from);
									const tc = center(to);
									const sp = borderPoint(sc, tc);
									const tp = borderPoint(tc, sc);
									const mid = { x: (sp.x + tp.x) / 2, y: (sp.y + tp.y) / 2 };
									return (
										<g key={`${edge.from}-${edge.to}-${edge.kind}-${i}`}>
											<line
												x1={sp.x}
												y1={sp.y}
												x2={tp.x}
												y2={tp.y}
												stroke={edgeColor[edge.kind]}
												strokeWidth={2}
												strokeDasharray={edge.kind === "error" ? "6 4" : undefined}
												markerEnd={`url(#arrow-${edge.kind})`}
											/>
											{edge.label && (
												<>
													<rect className='routing-edge-label__bg' x={mid.x - edge.label.length * 3.2} y={mid.y - 8} width={edge.label.length * 6.4} height={16} rx={3} />
													<text className='routing-edge-label' x={mid.x} y={mid.y + 4} textAnchor='middle'>
														{edge.label}
													</text>
												</>
											)}
										</g>
									);
								})}
								{connect && positions[connect.fromId] && (
									<line
										x1={center(positions[connect.fromId]).x}
										y1={center(positions[connect.fromId]).y}
										x2={connect.pointer.x}
										y2={connect.pointer.y}
										stroke={edgeColor[connect.kind]}
										strokeWidth={2}
										strokeDasharray='4 4'
									/>
								)}
							</svg>

							{pages.map((p, index) => {
								const pos = positions[p.pageSettings.pageId];
								if (!pos) return null;
								const t = p.pageSettings.traversalSettings;
								return (
									<div
										key={p.pageSettings.pageId}
										ref={(el) => {
											if (el) {
												el.style.left = `${pos.x}px`;
												el.style.top = `${pos.y}px`;
											}
										}}
										className={`routing-node${p.pageSettings.pageId === selectedId ? " routing-node--selected" : ""}${index === 0 ? " routing-node--start" : ""}`}>
										{/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
										<div className='routing-node__header' onPointerDown={(e) => startNodeDrag(e, p.pageSettings.pageId)}>
											<span className='routing-node__title'>
												{index + 1}. {p.pageSettings.pageId}
											</span>
											<span className='routing-node__type'>{pageTypeLabel(p.pageSettings.pageType)}</span>
										</div>
										<div className='routing-node__body'>
											{t?.defaultNextPageId ? `→ ${t.defaultNextPageId}` : "No default next page"}
											{t?.branches?.length ? ` · ${t.branches.length} branch${t.branches.length === 1 ? "" : "es"}` : ""}
										</div>
										<div className='routing-node__handles'>
											<button type='button' className='routing-handle routing-handle--default' title='Drag to a page to set the default next page' onPointerDown={(e) => startConnect(e, p.pageSettings.pageId, "default")}>
												Next
											</button>
											<button type='button' className='routing-handle routing-handle--branch' title='Drag to a page to add a decision branch' onPointerDown={(e) => startConnect(e, p.pageSettings.pageId, "branch")}>
												Branch
											</button>
											<button type='button' className='routing-handle routing-handle--error' title='Drag to a page to set the error route' onPointerDown={(e) => startConnect(e, p.pageSettings.pageId, "error")}>
												Error
											</button>
										</div>
									</div>
								);
							})}
						</div>
					</div>

					{/* Side editor for the selected page */}
					<aside className='routing-panel' aria-label='Routing for selected page'>
						{!selectedPage ? (
							<p className='ontario-hint'>Select a page to edit its routing.</p>
						) : (
							<>
								<h3 className='ontario-h4'>
									{selectedPage.pageSettings.pageId}{" "}
									<span className='ontario-label__flag'>({pageTypeLabel(selectedPage.pageSettings.pageType)})</span>
								</h3>

								<label className='ontario-label' htmlFor='routing-previous'>
									Previous page
								</label>
								<select
									className='ontario-input ontario-dropdown'
									id='routing-previous'
									value={selectedPage.pageSettings.previousPageId ?? ""}
									onChange={(e) => updatePageSettings(selectedPage.pageSettings.pageId, { previousPageId: e.target.value })}>
									<option value=''>None</option>
									{otherPages.map((p) => (
										<option key={p.pageSettings.pageId} value={p.pageSettings.pageId}>
											{p.pageSettings.pageId} — {pageTypeLabel(p.pageSettings.pageType)}
										</option>
									))}
								</select>

								<label className='ontario-label' htmlFor='routing-default'>
									Default next page
								</label>
								<select
									className='ontario-input ontario-dropdown'
									id='routing-default'
									value={selectedPage.pageSettings.traversalSettings?.defaultNextPageId ?? ""}
									onChange={(e) =>
										updateTraversal(selectedPage.pageSettings.pageId, (t) => ({
											...t,
											defaultNextPageId: e.target.value || undefined,
										}))
									}>
									<option value=''>None</option>
									{otherPages.map((p) => (
										<option key={p.pageSettings.pageId} value={p.pageSettings.pageId}>
											{p.pageSettings.pageId} — {pageTypeLabel(p.pageSettings.pageType)}
										</option>
									))}
								</select>

								<label className='ontario-label' htmlFor='routing-error'>
									Technical error page
								</label>
								<select
									className='ontario-input ontario-dropdown'
									id='routing-error'
									value={selectedPage.pageSettings.traversalSettings?.technicalErrorPageId ?? ""}
									onChange={(e) =>
										updateTraversal(selectedPage.pageSettings.pageId, (t) => ({
											...t,
											technicalErrorPageId: e.target.value || undefined,
										}))
									}>
									<option value=''>None</option>
									{otherPages.map((p) => (
										<option key={p.pageSettings.pageId} value={p.pageSettings.pageId}>
											{p.pageSettings.pageId} — {pageTypeLabel(p.pageSettings.pageType)}
										</option>
									))}
								</select>

								<h4 className='ontario-h5 ontario-margin-top-24-!'>Decision branches</h4>
								<p className='ontario-hint'>Branches are checked in order; the first match wins, otherwise the default next page is used.</p>

								{(selectedPage.pageSettings.traversalSettings?.branches ?? []).map((branch, index) => {
									const op = branchOperators.find((o) => o.val === branch.rule?.operator);
									return (
										<div className='routing-branch' key={index}>
											<label className='ontario-label' htmlFor={`branch-field-${index}`}>
												When field
											</label>
											<select
												className='ontario-input ontario-dropdown'
												id={`branch-field-${index}`}
												value={branch.rule?.field ?? ""}
												onChange={(e) => setBranchRule(index, { field: e.target.value })}>
												<option value=''>Select a field</option>
												{allFields.map((f) => (
													<option key={f.id} value={f.id}>
														{f.label}
													</option>
												))}
											</select>

											<label className='ontario-label' htmlFor={`branch-op-${index}`}>
												Operator
											</label>
											<select
												className='ontario-input ontario-dropdown'
												id={`branch-op-${index}`}
												value={branch.rule?.operator ?? "equals"}
												onChange={(e) => setBranchRule(index, { operator: e.target.value as BranchOperator })}>
												{branchOperators.map((o) => (
													<option key={o.val} value={o.val}>
														{o.label}
													</option>
												))}
											</select>

											{op?.needsValue && (
												<>
													<label className='ontario-label' htmlFor={`branch-value-${index}`}>
														Value
													</label>
													<input
														className='ontario-input'
														type='text'
														id={`branch-value-${index}`}
														value={branch.rule?.value ?? ""}
														onChange={(e) => setBranchRule(index, { value: e.target.value })}
													/>
												</>
											)}

											<label className='ontario-label' htmlFor={`branch-target-${index}`}>
												Go to page
											</label>
											<select
												className='ontario-input ontario-dropdown'
												id={`branch-target-${index}`}
												value={branch.targetPageId}
												onChange={(e) => setBranch(index, (b) => ({ ...b, targetPageId: e.target.value }))}>
												<option value=''>Select a page</option>
												{otherPages.map((p) => (
													<option key={p.pageSettings.pageId} value={p.pageSettings.pageId}>
														{p.pageSettings.pageId} — {pageTypeLabel(p.pageSettings.pageType)}
													</option>
												))}
											</select>

											<button type='button' className='ontario-button ontario-button--tertiary ontario-margin-top-8-!' onClick={() => removeBranch(index)}>
												Remove branch
											</button>
										</div>
									);
								})}

								<button type='button' className='ontario-button ontario-button--secondary' onClick={addBranch}>
									Add branch
								</button>
							</>
						)}
					</aside>
				</div>
			</div>
		</div>
	);
}
