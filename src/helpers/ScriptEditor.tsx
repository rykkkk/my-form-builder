import React, { useEffect, useRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { Decoration, DecorationSet, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { Compartment } from "@codemirror/state";
import * as acorn from "acorn";
import debounce from "lodash.debounce";

type ScriptError = { message: string; line: number; column: number };

interface ScriptEditorProps {
	id?: string;
	scriptProps: Record<string, string>;
	fieldName: string;
	className?: string;
	editorId?: string;
	ariaLabel?: string;
	ariaLabelledBy?: string;
	initialDoc?: string;
	callback: () => void;
}

export default function ScriptEditor({ scriptProps, fieldName, className, editorId, id, ariaLabel, ariaLabelledBy, initialDoc, callback }: ScriptEditorProps) {
	const editorRef = useRef<EditorView | null>(null);
	const containerRef = useRef<HTMLDivElement | null>(null);

	const errorCompartment = useRef(new Compartment()).current;
	// const themeCompartment = useRef(new Compartment()).current;

	const CODE_PLACEHOLDER = `// Write your script here  `
	const DEFAULT_TEMPLATE = `(field) => {
    // Write your script here
}`;
	const EXPANDED_FOOTER_TEMPLATE = `<footer class="ontario-footer ontario-footer--expanded">
	<div class="ontario-footer__expanded-top-section">
		<div class="ontario-row">
			<div class="ontario-columns ontario-small-12 ontario-expanded-footer__one-third-block ontario-medium-12 ontario-large-4">
                <h2 class="ontario-h4">Ontario Design System</h2>
				<p>The Ontario Design System provides principles, guidance and code to help teams design and build accessible, mobile-friendly government websites and digital services.</p>
			</div>
                <div class="ontario-columns ontario-small-12 ontario-medium-6 ontario-large-4 ontario-expanded-footer__one-third-block">
                        <h2 class="ontario-h4">Latest release</h2>
                        <ul>
                            <li>Built on: June 3, 2022</li>
                            <li>Distribution package version 0.12.10</li>
                        </ul>
                </div>
            <div class="ontario-columns ontario-small-12 ontario-medium-6 ontario-large-4 ontario-expanded-footer__one-third-block">
                        <h2 class="ontario-h4">Help us improve the design system</h2>
                        <p>You can check our <a href="#">help and feedback page</a> if you don't see the component you need.</p>
                        <a class="ontario-footer__button ontario-button ontario-margin-bottom-0-!" href="#">Send us an email</a>
                        <ul class="ontario-footer__links-container ontario-footer__links-container--social">
                            <li>
                                <a class="ontario-footer__link" href="" aria-label="Facebook">
                                    <svg class="ontario-icon" alt="" sol:category="communication" aria-hidden="true" focusable="false" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
                                        <use href="../../icons/ontario-icons-secondary.svg#ontario-icon-facebook"></use>
                                    </svg>
                                </a>
                            </li>
                            <li>
                                <a class="ontario-footer__link" href="" aria-label="Twitter-X">
                                    <svg class="ontario-icon" alt="" sol:category="communication" aria-hidden="true" focusable="false" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
                                        <use href="../../icons/ontario-icons-secondary.svg#ontario-icon-twitter-x"></use>
                                    </svg>
                                </a>
                            </li>
                            <li>
                                <a class="ontario-footer__link" href="" aria-label="Instagram">
                                    <svg class="ontario-icon" alt="" sol:category="communication" aria-hidden="true" focusable="false" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
                                        <use href="../../icons/ontario-icons-secondary.svg#ontario-icon-instagram"></use>
                                    </svg>
                                </a>
                            </li>
                            <li>
                                <a class="ontario-footer__link" href="" aria-label="Youtube">
                                    <svg class="ontario-icon" alt="" sol:category="communication" aria-hidden="true" focusable="false" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
                                        <use href="../../icons/ontario-icons-secondary.svg#ontario-icon-youtube"></use>
                                    </svg>
                                </a>
                            </li>
                        </ul>

            </div>
		</div>
    </div>
        <div class="ontario-row ontario-footer__expanded-bottom-section">
		    <div class="ontario-columns ontario-small-12">
                <ul class="ontario-footer__links-container ontario-footer__links-container--inline">
                    <li><a class="ontario-footer__link" href="https://www.ontario.ca/page/accessibility">Accessibility</a></li>
                    <li><a class="ontario-footer__link" href="https://www.ontario.ca/page/privacy-statement">Privacy</a></li>
                    <li><a class="ontario-footer__link" href="#">Contact us</a></li>
                </ul>
                <div class="ontario-footer__copyright">
                    <a class="ontario-footer__link" href="https://www.ontario.ca/page/copyright-information"> © King's Printer for Ontario, <span class="ontario-nbsp">2012–26</span></a>
                </div>
		    </div>
	    </div>
</footer>`;

	// const isDarkMode = typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark";
	// const theme: "light" | "dark" = isDarkMode ? "dark" : "light";

	const debouncedCallback = useRef(debounce(() => callback(), 300)).current;

	const validateCode = (code: string): ScriptError | null => {
		try {
			acorn.parse(code, {
				ecmaVersion: "latest",
				allowReturnOutsideFunction: true,
				allowAwaitOutsideFunction: true,
				sourceType: "script",
			});
			return null;
		} catch (err) {
			const e = err as { message: string; loc?: { line: number; column: number } };
			return {
				message: e.message,
				line: e.loc?.line ?? 1,
				column: e.loc?.column ?? 0,
			};
		}
	};

	const errorMark = Decoration.line({ class: "cm-error-line" });

	const errorPlugin = (error: ScriptError | null) =>
		ViewPlugin.fromClass(
			class {
				decorations: DecorationSet;

				constructor() {
					if (!error) {
						this.decorations = Decoration.none;
					} else {
						const safeLine = Math.max(1, error.line);
						const lineInfo = editorRef.current!.state.doc.line(safeLine);

						this.decorations = Decoration.set([errorMark.range(lineInfo.from)]);
					}
				}
			},
			{ decorations: (v) => v.decorations },
		);

	useEffect(() => {
		if (!containerRef.current) return undefined;

		let placeholderScript: string;
		switch (fieldName) {
			case "headerInitScript":
				placeholderScript = DEFAULT_TEMPLATE;
				break;
			case "expandedFooterContent":
				placeholderScript = EXPANDED_FOOTER_TEMPLATE;
				break;
			case "htmlCode":
				placeholderScript = "<div>Enter custom HTML content here</div>";
				break;
			default:
				placeholderScript = CODE_PLACEHOLDER;
		}

		// Prefer the saved value when one is provided; otherwise start from the template.
		const startDoc = initialDoc && initialDoc.trim() ? initialDoc : placeholderScript;
const accessibleLightTheme = EditorView.theme({
  "&": {
    height: "100%",
    minHeight: "8rem",
    backgroundColor: PALETTE.white,
    color: PALETTE.black, // ✅ strong contrast
  },

  ".cm-content": {
    color: PALETTE.black, // ✅ main text fix
    caretColor: PALETTE.black,
  },

  "&.cm-focused .cm-cursor": {
    borderLeftColor: PALETTE.black,
  },

  ".cm-gutters": {
    backgroundColor: PALETTE.greyscale5,
    color: PALETTE.greyscale80, // ✅ darker line numbers
    borderRight: `1px solid ${PALETTE.greyscale20}`,
  },

  ".cm-lineNumbers": {
    color: PALETTE.greyscale70,
  },

  ".cm-activeLine": {
    backgroundColor: PALETTE.systemLightestBlue,
  },

  ".cm-selectionBackground": {
    backgroundColor: PALETTE.systemLightBlue,
  },

  "::selection": {
    backgroundColor: PALETTE.systemLightBlue,
  },

  ".cm-error-line": {
    backgroundColor: `${PALETTE.systemErrorRed}22`, // subtle but visible
  },
});
		const view = new EditorView({
			doc: startDoc,
			extensions: [
				basicSetup,
				javascript(),
				EditorView.lineWrapping,
				accessibleLightTheme,
				EditorView.contentAttributes.of(
					ariaLabelledBy ? { "aria-labelledby": ariaLabelledBy } : { "aria-label": ariaLabel ?? "Code editor" },
				),
				errorCompartment.of([]),
				// themeCompartment.of(theme === "dark" ? [darkOverlay, errorHighlightTheme] : [lightTheme, errorHighlightTheme]),//dark mode
				EditorView.updateListener.of((update: ViewUpdate) => {
					if (update.docChanged) {
						const code = update.state.doc.toString();
						scriptProps[fieldName] = code;
						debouncedCallback();
					}
				}),

				EditorView.domEventHandlers({
					blur: () => {
						requestIdleCallback((): void => {
							let code = view.state.doc.toString();
							if (!code.trim()) code = DEFAULT_TEMPLATE;

							const error = validateCode(code);
							view.dispatch({
								effects: errorCompartment.reconfigure([]),
							});

							if (error) {
								view.dispatch({
									effects: errorCompartment.reconfigure([errorPlugin(error)]),
								});
								console.warn("Syntax error:", error.message);
								return;
							}

							scriptProps[fieldName] = code;
							callback();
						});
					},
				}),
			],
			parent: containerRef.current,
		});

		editorRef.current = view;

		return () => view.destroy();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// useEffect(() => {
	// 	if (!editorRef.current) return;
	// 	editorRef.current.dispatch({
	// 		effects: themeCompartment.reconfigure(theme === "dark" ? [darkOverlay, errorHighlightTheme] : [lightTheme, errorHighlightTheme]), //dark mode
	// 	});
	// }, [theme]);

	return <div id={id ?? editorId} ref={containerRef} className={className} />;
}
const PALETTE = {
	white: "#FFF",
	black: "#1A1A1A",
	trueBlack: "#000",
	transparent: "transparent",
	greyscale5: "#F2F2F2",
	greyscale20: "#CCC",
	greyscale60: "#666",
	greyscale70: "#4D4D4D",
	greyscale80: "#333",
	greyscale85: "#262626",
	systemLightGrey: "#E8E8E8",
	systemMidGrey: "#D1D1D1",
	systemYellow: "#FFD440",
	systemLightYellow: "#FEF6DC",
	systemGreen: "#118847",
	systemLightGreen: "#E5F0E9",
	systemLimeGreen: "#5F8129",
	serviceOntarioGreen: "#006c40",
	systemRed: "#CD0000",
	systemRedLight: "#FCEFF0",
	systemMidRed: "#6B0000",
	systemDarkRed: "#280000",
	systemErrorRed: "#d81a21",
	systemBlue: "#0066CC",
	systemLightBlue: "#C2E0FF",
	systemLightestBlue: "#E0F0FF",
	systemMidBlue: "#00478F",
	systemDarkBlue: "#002142",
	systemFocusBlue: "#009ADB",
	systemInformationBlue: "#E2F0F4",
	systemInformation: "#1080A6",
	systemPurple: "#551A8B",
	systemTeal: "rgba(207, 237, 237, 0.5)",
};
