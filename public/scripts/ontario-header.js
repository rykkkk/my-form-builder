/**
 * Defer a function to the next macrotask.
 * @param {Function} fn
 */
function deferInFn(fn) {
	if (typeof fn === 'function') {
		setTimeout(fn, 0);
	}
}

/* ===========================
	Header
=========================== */
(function () {
	'use strict';

	if (!('addEventListener' in window) || !document.documentElement.classList) {
		return;
	}

	/* ---------------------------
	    DOM lookups
	--------------------------- */
	const navSelector = document.getElementById('ontario-navigation');
	const openBtnToggler = document.getElementById('ontario-header-menu-toggler');
	const closeBtnToggler = document.getElementById('ontario-header-nav-close-button');

	// Topics/Menu icons
	const desktopMenuIcon = document.getElementById('ontario-header-menu-icon'); // desktop caret icon <use>
	const mobileMenuIcon = document.getElementById('ontario-header-menu-icon-mobile'); // mobile hamburger icon <use>

	// Sign-in controls
	const signInIcon = document.getElementById('ontario-header-sign-in-icon'); // caret icon <use>
	const signInBtn = document.getElementById('ontario-header-sign-in-toggler');
	const signInNavigation = document.getElementById('ontario-sign-in-navigation');
	const signInClose = document.getElementById('ontario-header-sign-in-nav-toggler');

	// Mobile menu / tabs
	const mobileMenu = document.getElementById('ontario-mobile-menu');
	const mobileTabs = Array.from(document.querySelectorAll('.ontario-mobile-menu__tab'));
	const mobilePanels = Array.from(document.querySelectorAll('.ontario-mobile-menu__panel'));
	const mobileTopicsTab = document.getElementById('ontario-mobile-menu-tab-topics');
	const mobileSignInTab = document.getElementById('ontario-mobile-menu-tab-sign-in');
	const mobileTopicsPanel = document.getElementById('ontario-mobile-menu-panel-topics');
	const mobileSignInPanel = document.getElementById('ontario-mobile-menu-panel-sign-in');
	const mobileCloseBtn = mobileMenu ? mobileMenu.querySelector('.ontario-mobile-menu-close') : null;

	const body = document.body;
	const appHeader = document.querySelector('.ontario-application-header');

	/* ---------------------------
	   Class/flag constants
	--------------------------- */
	const isReadyClass = 'ontario-navigation--is-ready';
	const isActiveClass = 'ontario-navigation--open';
	const mobileMenuActiveClass = 'ontario-mobile-navigation--open';
	const signInActiveClass = 'ontario-sign-in-navigation--open';

	// Track desktop listeners so we don't double-attach
	let desktopListenersAttached = false;

	/* ---------------------------
		Breakpoint detection
	--------------------------- */
	/**
	 * Desktop breakpoint media query.
	 */
	const desktopMediaQuery = '(min-width: 1168px)';

	/**
	 * Media query list object for detecting viewport changes.
	 */
	const desktopMediaQueryList = window.matchMedia(desktopMediaQuery);

	/**
	 * Determine whether the current viewport is below the desktop breakpoint.
	 * Uses matchMedia for parity with CSS breakpoints.
	 * @returns {boolean} true when in mobile/tablet range, false on desktop.
	 */
	function isMobile() {
		return !desktopMediaQueryList.matches;
	}

	/* ---------------------------
	   SVG <use> helper
	--------------------------- */

	/**
	 * Sets the SVG <use> reference for both modern (href) and legacy (xlink:href) attributes to ensure broad compatibility across browsers.
	 */
	function setUseHref(useEl, val) {
		if (!useEl) return;
		useEl.setAttribute('href', val);
		// legacy attribute, provided for broad compatibility
		useEl.setAttribute('xlink:href', val);
	}

	/* ---------------------------
		Keyboard Navigation State
	--------------------------- */
	/**
	 * Track current focused index for arrow key navigation in desktop menus
	 */
	const keyboardNavState = {
		desktopMenu: {
			currentIndex: null,
			isArrowNavigating: false,
		},
		signInMenu: {
			currentIndex: null,
			isArrowNavigating: false,
		},
		mobileTopics: {
			currentIndex: null,
			isArrowNavigating: false,
		},
		mobileSignIn: {
			currentIndex: null,
			isArrowNavigating: false,
		},
	};

	/**
	 * ARIA live region for screen reader announcements
	 */
	let ariaLiveRegion = null;

	/**
	 * Create or get the ARIA live region for menu announcements
	 */
	function getAriaLiveRegion() {
		if (!ariaLiveRegion) {
			ariaLiveRegion = document.createElement('div');
			ariaLiveRegion.setAttribute('aria-live', 'polite');
			ariaLiveRegion.setAttribute('aria-atomic', 'true');
			ariaLiveRegion.className = 'ontario-show-for-sr';
			document.body.appendChild(ariaLiveRegion);
		}
		return ariaLiveRegion;
	}

	/**
	 * Announce menu item position to screen readers
	 */
	function getMenuItemAnnouncementText(element) {
		if (!element) return '';
		const ariaLabel = element.getAttribute('aria-label');
		return (ariaLabel || element.innerText || element.textContent || '').trim();
	}

	/**
	 * Announce menu item position to screen readers
	 */
	function announceMenuItem(index, total, itemText) {
		const region = getAriaLiveRegion();
		region.textContent = `${itemText}, ${index + 1} of ${total}`;
	}

	/* ---------------------------
		Focus-trap helpers
	--------------------------- */
	const focusTraps = {
		mobile: null,
		desktop: null,
	};

	/**
	 * Clear a specific focus trap if it exists.
	 * @param {'mobile'|'desktop'} context - Which focus context to clear.
	 */
	function clearFocusTrapFor(context) {
		const cleanup = focusTraps[context];
		if (cleanup) {
			cleanup();
			focusTraps[context] = null;
		}
	}

	/**
	 * Set or replace a focus trap for a given context.
	 * Automatically clears any existing trap for that context.
	 * @param {'mobile'|'desktop'} context - Focus context.
	 * @param {Element|null} panel - The element whose contents will be trapped.
	 * @param {Element|null} loopTarget - The element to loop focus back to.
	 * @param {Object} navState - Optional navigation state for arrow key support.
	 * @param {boolean} isMobileMenu - Whether this is a mobile menu.
	 */
	function setFocusTrapFor(context, panel, loopTarget, navState, isMobileMenu = false) {
		clearFocusTrapFor(context);
		focusTraps[context] = trapFocus(panel, loopTarget, navState, isMobileMenu);
	}

	/**
	 * Aliases for readability — keeps existing code compatible
	 * while making the intent clear.
	 */
	const setMobileFocusTrap = (panel, loopTarget, navState) => setFocusTrapFor('mobile', panel, loopTarget, navState, true);
	const clearMobileFocusTrap = () => clearFocusTrapFor('mobile');
	const setDesktopFocusTrap = (panel, loopTarget, navState) => setFocusTrapFor('desktop', panel, loopTarget, navState, false);
	const clearDesktopFocusTrap = () => clearFocusTrapFor('desktop');

	/**
	 * Return focusable elements inside a panel (visible only).
	 * @param {Element|null} panel
	 * @returns {Element[]}
	 */
	function getFocusables(panel) {
		if (!panel) return [];
		return Array.from(panel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter(
			el => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length),
		);
	}

	/**
	 * Handle arrow key navigation within a menu
	 * @param {KeyboardEvent} e - The keyboard event
	 * @param {Element} panel - The menu panel
	 * @param {Object} navState - The navigation state object
	 */
	function handleArrowNavigation(e, panel, navState) {
		if (!['ArrowDown', 'ArrowUp'].includes(e.key)) return;

		const focusable = getFocusables(panel);
		if (!focusable.length) return;

		e.preventDefault();
		navState.isArrowNavigating = true;

		// Initialize index if needed
		if (navState.currentIndex === null) {
			const activeElement = document.activeElement;
			const focusedIndex = focusable.findIndex(el => el === activeElement);
			navState.currentIndex = focusedIndex !== -1 ? focusedIndex : 0;
		}

		// Move in the requested direction with wrapping
		if (e.key === 'ArrowDown') {
			navState.currentIndex = (navState.currentIndex + 1) % focusable.length;
		} else {
			navState.currentIndex = (navState.currentIndex - 1 + focusable.length) % focusable.length;
		}

		focusable[navState.currentIndex].focus();

		// Announce to screen readers
		const itemText = getMenuItemAnnouncementText(focusable[navState.currentIndex]);
		announceMenuItem(navState.currentIndex, focusable.length, itemText);

		// Reset flag after focus
		setTimeout(() => {
			navState.isArrowNavigating = false;
		}, 0);
	}

	/**
	 * Reset keyboard navigation state
	 * @param {Object} navState - The navigation state object
	 */
	function resetNavState(navState) {
		navState.currentIndex = null;
		navState.isArrowNavigating = false;
	}

	/**
	 * Trap keyboard focus within a panel and loop to a target element when tabbing wraps.
	 * Enhanced with arrow key navigation support.
	 * @param {Element|null} panel
	 * @param {Element|null} loopTarget
	 * @param {Object} navState - Optional navigation state for arrow key support
	 * @param {boolean} isMobileMenu - Whether this is a mobile menu (different arrow behavior)
	 * @returns {Function} cleanup
	 */
	function trapFocus(panel, loopTarget, navState, isMobileMenu = false) {
		if (!panel) return () => {};

		function handler(e) {
			const focusable = getFocusables(panel);
			if (!focusable.length) return;

			const first = focusable[0];
			const last = focusable[focusable.length - 1];
			const active = document.activeElement;

			if (!panel.contains(active)) return;

			// Mobile menu: Handle Left/Right arrows to switch tabs from anywhere
			if (isMobileMenu && ['ArrowLeft', 'ArrowRight'].includes(e.key)) {
				e.preventDefault();
				// Find current active tab
				const currentTab = document.querySelector('.ontario-mobile-menu__tab[aria-selected="true"]');
				if (currentTab) {
					const allTabs = Array.from(document.querySelectorAll('.ontario-mobile-menu__tab'));
					const currentIndex = allTabs.indexOf(currentTab);
					let newIndex = currentIndex;

					if (e.key === 'ArrowRight') {
						newIndex = (currentIndex + 1) % allTabs.length;
					} else if (e.key === 'ArrowLeft') {
						newIndex = (currentIndex - 1 + allTabs.length) % allTabs.length;
					}

					// Trigger tab switch
					if (newIndex === 0) {
						showTopicsMenu(true);
					} else if (newIndex === 1) {
						showSignInMenu(true);
					}
				}
				return;
			}

			// Mobile menu: Only handle ArrowUp/Down for menu items, not tabs
			if (isMobileMenu && ['ArrowUp', 'ArrowDown'].includes(e.key)) {
				const isOnTab = active.getAttribute('role') === 'tab';

				// If on tab button and pressing down arrow, move to first menu item
				if (isOnTab && e.key === 'ArrowDown' && navState) {
					e.preventDefault();
					const activePanel = document.querySelector('.ontario-mobile-menu__panel--active');
					if (activePanel) {
						const menuItems = Array.from(activePanel.querySelectorAll('a[role="menuitem"]')).filter(
							el => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length),
						);
						if (menuItems.length > 0) {
							menuItems[0].focus();
							navState.currentIndex = 0;
						}
					}
					return;
				}

				// If on first menu item and pressing up arrow, wrap to last item
				if (!isOnTab && e.key === 'ArrowUp' && navState) {
					const activePanel = document.querySelector('.ontario-mobile-menu__panel--active');
					if (activePanel) {
						const menuItems = Array.from(activePanel.querySelectorAll('a[role="menuitem"]')).filter(
							el => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length),
						);
						const currentIndex = menuItems.findIndex(el => el === active);
						// If we're on the first menu item, wrap to the last item
						if (currentIndex === 0) {
							e.preventDefault();
							const lastIndex = menuItems.length - 1;
							if (lastIndex >= 0) {
								menuItems[lastIndex].focus();
								navState.currentIndex = lastIndex;
								const itemText = getMenuItemAnnouncementText(menuItems[lastIndex]);
								announceMenuItem(navState.currentIndex, menuItems.length, itemText);
							}
							return;
						}
					}
				}

				// Navigate within menu items (not tabs)
				if (!isOnTab && navState) {
					// Get only the active panel for arrow navigation
					const activePanel = document.querySelector('.ontario-mobile-menu__panel--active');

					if (activePanel) {
						// Navigate only through menu items in the active panel
						const menuItems = Array.from(activePanel.querySelectorAll('a[role="menuitem"]')).filter(
							el => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length),
						);

						if (menuItems.length > 0) {
							e.preventDefault();
							navState.isArrowNavigating = true;

							// Initialize index if needed
							if (navState.currentIndex === null) {
								const focusedIndex = menuItems.findIndex(el => el === active);
								navState.currentIndex = focusedIndex !== -1 ? focusedIndex : 0;
							}

							// Move in the requested direction with wrapping
							if (e.key === 'ArrowDown') {
								navState.currentIndex = (navState.currentIndex + 1) % menuItems.length;
							} else {
								navState.currentIndex = (navState.currentIndex - 1 + menuItems.length) % menuItems.length;
							}

							menuItems[navState.currentIndex].focus(); // Announce to screen readers
							const itemText = getMenuItemAnnouncementText(menuItems[navState.currentIndex]);
							announceMenuItem(navState.currentIndex, menuItems.length, itemText);

							// Reset flag after focus
							setTimeout(() => {
								navState.isArrowNavigating = false;
							}, 0);
						}
					}
					return;
				}
				// If on tab, let the tab's own arrow handler deal with it
				return;
			} // Desktop menu: Handle ArrowDown/Up for navigation
			if (!isMobileMenu && ['ArrowDown', 'ArrowUp'].includes(e.key) && navState) {
				handleArrowNavigation(e, panel, navState);
				return;
			}

			// Handle Tab navigation
			if (e.key !== 'Tab') return;

			// Sync currentIndex with Tab navigation
			if (navState && !navState.isArrowNavigating) {
				if (isMobileMenu) {
					const activePanel = document.querySelector('.ontario-mobile-menu__panel--active');
					const menuItems = activePanel
						? Array.from(activePanel.querySelectorAll('a[role="menuitem"]')).filter(el => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length))
						: [];
					const focusedIndex = menuItems.findIndex(el => el === active);
					navState.currentIndex = focusedIndex !== -1 ? focusedIndex : null;
				} else {
					const focusedIndex = focusable.findIndex(el => el === active);
					if (focusedIndex !== -1) {
						navState.currentIndex = focusedIndex;
					}
				}
			}

			if (e.shiftKey) {
				if (isMobileMenu && active.getAttribute('role') === 'tab') {
					e.preventDefault();
					if (openBtnToggler && typeof openBtnToggler.focus === 'function') {
						openBtnToggler.focus();
					}
					return;
				}
				// Shift+Tab from first item
				if (active === first) {
					e.preventDefault();
					if (isMobileMenu) {
						// Mobile: loop to last item
						last.focus();
					} else {
						// Desktop: close menu and return to button
						closeAllPanelsDesktop();
						if (loopTarget && typeof loopTarget.focus === 'function') {
							loopTarget.focus();
						}
					}
				}
			} else {
				// Tab from active tab button in mobile - go to first menu item
				if (isMobileMenu && active.getAttribute('role') === 'tab') {
					e.preventDefault();
					const activePanel = document.querySelector('.ontario-mobile-menu__panel--active');
					if (activePanel) {
						const menuItems = activePanel.querySelectorAll('a[role="menuitem"]');
						if (menuItems.length > 0) {
							menuItems[0].focus();
							if (navState) {
								navState.currentIndex = 0;
							}
						}
					}
					return;
				}

				// Tab from last item
				if (active === last) {
					e.preventDefault();
					if (isMobileMenu) {
						// Mobile: go back to the active tab button
						const activeTab = document.querySelector('.ontario-mobile-menu__tab[aria-selected="true"]');
						if (activeTab) {
							activeTab.focus();
							if (navState) {
								navState.currentIndex = null;
							}
						}
					} else {
						// Desktop: close menu and return to button
						closeAllPanelsDesktop();
						if (loopTarget && typeof loopTarget.focus === 'function') {
							loopTarget.focus();
						}
					}
				}
			} // Update index after Tab completes
			if (navState) {
				setTimeout(() => {
					const newActive = document.activeElement;
					const newIndex = focusable.findIndex(el => el === newActive);
					if (newIndex !== -1) {
						navState.currentIndex = newIndex;
					}
				}, 0);
			}

			if (navState) {
				setTimeout(() => {
					const newActive = document.activeElement;
					if (isMobileMenu) {
						const activePanel = document.querySelector('.ontario-mobile-menu__panel--active');
						const menuItems = activePanel
							? Array.from(activePanel.querySelectorAll('a[role="menuitem"]')).filter(el => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length))
							: [];
						const newIndex = menuItems.findIndex(el => el === newActive);
						navState.currentIndex = newIndex !== -1 ? newIndex : null;
					} else {
						const newIndex = focusable.findIndex(el => el === newActive);
						if (newIndex !== -1) {
							navState.currentIndex = newIndex;
						}
					}
				}, 0);
			}
		}

		document.addEventListener('keydown', handler, true);
		return () => document.removeEventListener('keydown', handler, true);
	}

	/* ---------------------------
		State readers
	--------------------------- */
	/**
	 * True if the desktop topics menu is currently open.
	 * @returns {boolean}
	 */
	function isDesktopMenuOpen() {
		return !!(navSelector && !navSelector.hidden && navSelector.classList.contains(isActiveClass));
	}

	/**
	 * True if the mobile menu is currently open.
	 * @returns {boolean}
	 */
	function isMobileMenuOpen() {
		return !!(mobileMenu && !mobileMenu.hidden && mobileMenu.classList.contains(mobileMenuActiveClass));
	}

	/* ---------------------------
		Icon/ARIA sync
	--------------------------- */
	/**
	 * Synchronize header toggler icons and aria-expanded state with the current DOM state.
	 */
	function syncMenuButtonIcons() {
		const desktopSvg = desktopMenuIcon && (desktopMenuIcon.closest ? desktopMenuIcon.closest('svg') : null);

		const isApplicationHeader = !!appHeader; // application header pages
		const isOntarioHeader = !appHeader; // Ontario.ca header pages

		const mobileOpen = isMobileMenuOpen();
		const desktopOpen = isDesktopMenuOpen();

		if (isApplicationHeader) {
			// Application header: always hamburger <-> X on all sizes
			const open = mobileOpen || desktopOpen;
			setUseHref(desktopMenuIcon, open ? '#ontario-icon-close' : '#ontario-icon-menu');
		}

		if (isOntarioHeader) {
			// Ontario header: caret on desktop; mobile hamburger when mobile icon available (fallback to menuIcon)
			if (isMobile()) {
				setUseHref(mobileMenuIcon, mobileOpen ? '#ontario-icon-close' : '#ontario-icon-menu');

				if (openBtnToggler) openBtnToggler.setAttribute('aria-expanded', mobileOpen ? 'true' : 'false');
			} else {
				if (desktopMenuIcon) setUseHref(desktopMenuIcon, '#ontario-icon-dropdown-arrow');
				if (desktopSvg) desktopSvg.classList.toggle('ontario-icon--rotated', desktopOpen);
			}
		}

		// sign-in icon handling (no change)
		const signInOpen = !!(signInNavigation && !signInNavigation.hidden && signInNavigation.classList.contains(signInActiveClass));
		if (signInIcon) setUseHref(signInIcon, '#ontario-icon-dropdown-arrow');
		const signInSvg = signInIcon && (signInIcon.closest ? signInIcon.closest('svg') : null);
		if (signInSvg) signInSvg.classList.toggle('ontario-icon--rotated', !isMobile() && signInOpen);
		if (signInBtn) signInBtn.setAttribute('aria-expanded', signInOpen ? 'true' : 'false');
	}

	/* ---------------------------
		Mobile menu
	--------------------------- */
	/**
	 * Open the mobile menu, set focus trap, and update the icon state.
	 */
	function openMobileMenu(shouldFocusTab = false) {
		if (!mobileMenu) return;

		mobileMenu.hidden = false;
		mobileMenu.classList.add(mobileMenuActiveClass);
		showTopicsMenu(shouldFocusTab);

		document.addEventListener('mousedown', mobileOutsideHandler);

		// Reset navigation state and set focus trap on entire mobile menu (includes tabs)
		resetNavState(keyboardNavState.mobileTopics);
		setMobileFocusTrap(mobileMenu, openBtnToggler, keyboardNavState.mobileTopics);

		// Focus the first tab button only for keyboard-triggered opens
		if (shouldFocusTab && mobileTopicsTab) {
			setTimeout(() => {
				mobileTopicsTab.focus();
			}, 0);
		}

		syncMenuButtonIcons();
	}

	/**
	 * Close the mobile menu, remove focus trap, and update the icon state.
	 * @param {boolean} [suppressFocus=false] - When true do not move focus to the menu toggler.
	 */
	function closeMobileMenu(suppressFocus) {
		if (!mobileMenu) return;

		mobileMenu.hidden = true;
		mobileMenu.classList.remove(mobileMenuActiveClass);
		document.removeEventListener('mousedown', mobileOutsideHandler);

		if (!suppressFocus && openBtnToggler) openBtnToggler.focus();

		// Reset navigation states
		resetNavState(keyboardNavState.mobileTopics);
		resetNavState(keyboardNavState.mobileSignIn);
		clearMobileFocusTrap();
		syncMenuButtonIcons();
	}

	/**
	 * Close on outside click for the mobile menu.
	 * @param {Event} e
	 */
	function mobileOutsideHandler(e) {
		handleClickOutside(mobileMenu, openBtnToggler, mobileMenuActiveClass, closeMobileMenu, e);
	}

	/**
	 * Switch which mobile tab/panel is active and refresh focus trap.
	 * @param {Element} activePanel
	 * @param {Element} activeTab
	 */
	function switchMobilePanel(activePanel, activeTab, shouldFocusTab = false) {
		if (!mobileTopicsPanel || !mobileSignInPanel || !mobileTopicsTab || !mobileSignInTab) return;

		// Hide both
		mobileTopicsPanel.hidden = true;
		mobileSignInPanel.hidden = true;
		mobileTopicsPanel.classList.remove('ontario-mobile-menu__panel--active');
		mobileSignInPanel.classList.remove('ontario-mobile-menu__panel--active');

		mobileTopicsTab.setAttribute('aria-selected', 'false');
		mobileSignInTab.setAttribute('aria-selected', 'false');

		// Determine which navigation state to use
		let navState;

		// Show requested
		if (activePanel === mobileTopicsPanel && activeTab === mobileTopicsTab) {
			mobileTopicsPanel.hidden = false;
			mobileTopicsPanel.classList.add('ontario-mobile-menu__panel--active');
			mobileTopicsTab.setAttribute('aria-selected', 'true');
			navState = keyboardNavState.mobileTopics;
		} else if (activePanel === mobileSignInPanel && activeTab === mobileSignInTab) {
			mobileSignInPanel.hidden = false;
			mobileSignInPanel.classList.add('ontario-mobile-menu__panel--active');
			mobileSignInTab.setAttribute('aria-selected', 'true');
			navState = keyboardNavState.mobileSignIn;
		}

		// Reset navigation state for the new panel and set focus trap on entire menu
		resetNavState(navState);
		setMobileFocusTrap(mobileMenu, openBtnToggler, navState);

		// Focus the active tab button only when requested
		if (shouldFocusTab && activeTab) {
			setTimeout(() => {
				activeTab.focus();
			}, 0);
		}

		syncMenuButtonIcons();
	}

	/** Show the topics panel in the mobile menu. */
	function showTopicsMenu(shouldFocusTab = false) {
		switchMobilePanel(mobileTopicsPanel, mobileTopicsTab, shouldFocusTab);
	}

	/** Show the sign-in panel in the mobile menu. */
	function showSignInMenu(shouldFocusTab = false) {
		switchMobilePanel(mobileSignInPanel, mobileSignInTab, shouldFocusTab);
	}

	/* ---------------------------
	   Desktop helpers
	--------------------------- */
	/**
	 * Call a close handler when clicking outside a panel.
	 * @param {Element|null} panel
	 * @param {Element|null} toggler
	 * @param {string} activeClass
	 * @param {Function} closeHandler
	 * @param {Event} event
	 */
	function handleClickOutside(panel, toggler, activeClass, closeHandler, event) {
		const panelIsOpen = panel && !panel.hidden && panel.classList.contains(activeClass);
		const clickedPanel = panel && panel.contains(event.target);
		const clickedToggler = toggler && toggler.contains(event.target);

		if (panelIsOpen && !clickedPanel && !clickedToggler) {
			closeHandler();
		}
	}

	/**
	 * Reset a desktop panel and its button to closed state.
	 * @param {Element|null} panel
	 * @param {Element|null} btn
	 * @param {string} activeClass
	 * @param {string} openClass
	 * @param {Element|null} iconEl
	 * @param {string} openIcon
	 * @param {string} closeIcon
	 */
	function resetPanel(panel, btn, activeClass, openClass) {
		if (panel) {
			panel.classList.remove(activeClass);
			panel.hidden = true;
		}
		if (btn) {
			btn.setAttribute('aria-expanded', 'false');
			btn.classList.remove(openClass);
			btn.setAttribute('tabindex', '0');
		}
		// Icon state is handled by syncMenuButtonIcons()
	}

	/**
	 * Close panels on Escape (desktop only).
	 * Returns focus to the appropriate button.
	 * @param {KeyboardEvent} e
	 */
	function onEscapeDesktop(e) {
		if (e.key === 'Escape') {
			const topicsMenuOpen = isDesktopMenuOpen();
			const signInOpen = !!(signInNavigation && !signInNavigation.hidden && signInNavigation.classList.contains(signInActiveClass));

			closeAllPanelsDesktop();

			// Return focus to the button that opened the menu
			if (topicsMenuOpen && openBtnToggler) {
				openBtnToggler.focus();
			} else if (signInOpen && signInBtn) {
				signInBtn.focus();
			}
		}
	}

	/** Remove desktop listeners and clear the desktop focus trap. */
	function removeDesktopListeners() {
		document.removeEventListener('keydown', onEscapeDesktop);
		document.removeEventListener('mousedown', desktopOutsideHandler);
		clearDesktopFocusTrap();
	}

	/**
	 * Close panels when clicking outside (desktop only).
	 * @param {Event} e
	 */
	function desktopOutsideHandler(e) {
		handleClickOutside(navSelector, openBtnToggler, isActiveClass, closeAllPanelsDesktop, e);
		handleClickOutside(signInNavigation, signInBtn, signInActiveClass, closeAllPanelsDesktop, e);
	}

	/* ---------------------------
		Mobile tab keyboard init
	--------------------------- */
	function activateTab(index) {
		clearMobileFocusTrap();

		mobileTabs.forEach((tab, i) => {
			const selected = i === index;
			tab.setAttribute('aria-selected', selected ? 'true' : 'false');
			// Only active tab is focusable via Tab key
			tab.setAttribute('tabindex', selected ? '0' : '-1');
			if (selected) tab.focus();
		});

		mobilePanels.forEach((panel, i) => {
			if (i === index) {
				panel.classList.add('ontario-mobile-menu__panel--active');
				panel.removeAttribute('hidden');
			} else {
				panel.classList.remove('ontario-mobile-menu__panel--active');
				panel.setAttribute('hidden', '');
			}
		});

		const activePanel = mobilePanels[index];
		const loopTarget = mobileTabs[index];
		const navState = index === 0 ? keyboardNavState.mobileTopics : keyboardNavState.mobileSignIn;
		resetNavState(navState);

		setMobileFocusTrap(mobileMenu, loopTarget, navState);
		syncMenuButtonIcons();
	}

	mobileTabs.forEach((tab, i) => {
		tab.addEventListener('click', () => activateTab(i));
		tab.addEventListener('keydown', e => {
			let newIndex = i;
			if (e.key === 'ArrowRight') newIndex = (i + 1) % mobileTabs.length;
			if (e.key === 'ArrowLeft') newIndex = (i - 1 + mobileTabs.length) % mobileTabs.length;
			if (e.key === 'Home') newIndex = 0;
			if (e.key === 'End') newIndex = mobileTabs.length - 1;

			// Enter or Space activates the tab
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				activateTab(i);
				return;
			}

			if (newIndex !== i) {
				e.preventDefault();
				activateTab(newIndex);
			}
		});
	});

	// Initialize first tab
	activateTab(0);

	// Wire up mobile tab buttons
	if (mobileTopicsTab && mobileSignInTab && mobileTopicsPanel && mobileSignInPanel) {
		mobileTopicsTab.addEventListener('click', showTopicsMenu);
		mobileSignInTab.addEventListener('click', showSignInMenu);
	}
	if (mobileCloseBtn) {
		mobileCloseBtn.addEventListener('click', closeMobileMenu);
	}
	if (mobileMenu) {
		mobileMenu.addEventListener('keydown', function (e) {
			if (e.key === 'Escape') closeMobileMenu();
		});
	}

	/* ---------------------------
	    Main toggles
	--------------------------- */
	let lastInputWasKeyboard = false;

	/**
	 * Click handler for the main Topics/Menu button.
	 * Routes to mobile or desktop behavior based on the current breakpoint.
	 */
	if (openBtnToggler) {
		let openMenuFromKeyboard = false;

		openBtnToggler.addEventListener('keydown', function (e) {
			if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
				openMenuFromKeyboard = true;
			}

			if (e.key === 'Escape') {
				if (isMobile() && isMobileMenuOpen()) {
					e.preventDefault();
					closeMobileMenu();
				}
				return;
			}
			if (e.key !== 'ArrowDown') return;
			e.preventDefault();
			if (isMobile()) {
				if (!isMobileMenuOpen()) {
					openMobileMenu(true);
					return;
				}
				if (mobileTopicsTab) {
					mobileTopicsTab.focus();
				}
				return;
			}
			if (!isDesktopMenuOpen()) return;
			focusFirstMenuItemInPanel(navSelector, keyboardNavState.desktopMenu);
		});

		openBtnToggler.addEventListener('click', function (e) {
			const shouldFocusFirstItem = openMenuFromKeyboard || lastInputWasKeyboard;
			openMenuFromKeyboard = false;

			if (isMobile()) {
				e.preventDefault();
				if (appHeader) {
					toggleDesktopMenu(shouldFocusFirstItem);
				} else {
					toggleMobileMenu(shouldFocusFirstItem);
				}
				return;
			}
			toggleDesktopMenu(shouldFocusFirstItem);
		});
	}

	/** Toggle mobile menu open/closed. */
	function toggleMobileMenu(shouldFocusTab = false) {
		if (mobileMenu && !mobileMenu.hidden) {
			closeMobileMenu();
		} else {
			openMobileMenu(shouldFocusTab);
		}
	}

	/** Toggle desktop topics menu open/closed. */
	function toggleDesktopMenu(shouldFocusFirstItem = false) {
		const expanded = openBtnToggler && openBtnToggler.getAttribute('aria-expanded') === 'true';

		closeAllPanelsDesktop(); // close everything first to normalize

		if (!expanded) {
			// Panel state
			if (navSelector) {
				navSelector.classList.add(isActiveClass);
				navSelector.hidden = false;
			}

			// Toggler state
			if (openBtnToggler) {
				openBtnToggler.classList.add('ontario-header__menu-toggle--is-open');
				openBtnToggler.setAttribute('aria-expanded', 'true');
				openBtnToggler.setAttribute('tabindex', '0');
			}

			if (closeBtnToggler) closeBtnToggler.setAttribute('aria-expanded', 'true');

			// Accessibility: remove sign-in from tab order while menu open
			if (signInBtn) signInBtn.setAttribute('tabindex', '-1');

			// Reset navigation state and focus first item
			resetNavState(keyboardNavState.desktopMenu);

			// Focus trap with arrow key navigation
			setDesktopFocusTrap(navSelector, openBtnToggler, keyboardNavState.desktopMenu);

			if (shouldFocusFirstItem) {
				focusFirstMenuItemInPanel(navSelector, keyboardNavState.desktopMenu);
			}

			// Attach desktop listeners once (avoid duplicates)
			if (!desktopListenersAttached) {
				document.addEventListener('keydown', onEscapeDesktop);
				document.addEventListener('mousedown', desktopOutsideHandler);
				desktopListenersAttached = true;
			}

			syncMenuButtonIcons();
		}
	}

	// Close button inside desktop topics menu
	if (closeBtnToggler) {
		closeBtnToggler.addEventListener('click', closeAllPanelsDesktop);
	}

	/**
	 * Open the desktop sign-in panel and set up listeners and focus trap.
	 */
	function openSignInPanel(shouldFocusFirstItem = false) {
		if (signInNavigation) {
			signInNavigation.hidden = false;
			signInNavigation.classList.add(signInActiveClass);
		}
		if (signInBtn) {
			signInBtn.setAttribute('aria-expanded', 'true');
			signInBtn.classList.add('ontario-header__sign-in-toggle--is-open');
			signInBtn.setAttribute('tabindex', '0');
		}

		if (openBtnToggler) openBtnToggler.setAttribute('tabindex', '-1');

		// Reset navigation state and focus first item
		resetNavState(keyboardNavState.signInMenu);

		// Focus trap with arrow key navigation
		setDesktopFocusTrap(signInNavigation, signInBtn, keyboardNavState.signInMenu);

		if (shouldFocusFirstItem) {
			focusFirstMenuItemInPanel(signInNavigation, keyboardNavState.signInMenu);
		}

		// Attach desktop listeners once (avoid duplicates)
		if (!desktopListenersAttached) {
			document.addEventListener('keydown', onEscapeDesktop);
			document.addEventListener('mousedown', desktopOutsideHandler);
			desktopListenersAttached = true;
		}

		syncMenuButtonIcons();
	}

	/**
	 * Sign-in button: open/close desktop sign-in panel, or ignore on mobile.
	 */
	if (signInBtn && signInNavigation && signInClose) {
		let openSignInFromKeyboard = false;

		signInBtn.addEventListener('keydown', function (e) {
			if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
				openSignInFromKeyboard = true;
			}
			if (e.key !== 'ArrowDown') return;
			if (!(signInNavigation && !signInNavigation.hidden && signInNavigation.classList.contains(signInActiveClass))) return;
			e.preventDefault();
			focusFirstMenuItemInPanel(signInNavigation, keyboardNavState.signInMenu);
		});

		signInBtn.addEventListener('click', function () {
			if (isMobile()) return;
			const shouldFocusFirstItem = openSignInFromKeyboard;
			openSignInFromKeyboard = false;
			const expanded = signInBtn.getAttribute('aria-expanded') === 'true';
			if (expanded) {
				closeAllPanelsDesktop();
			} else {
				closeAllPanelsDesktop();
				openSignInPanel(shouldFocusFirstItem);
			}
		});
		signInClose.addEventListener('click', closeAllPanelsDesktop);
	}

	function focusFirstMenuItemInPanel(panel, navState) {
		if (!panel) return;
		setTimeout(() => {
			const menuLinks = panel.querySelectorAll('a[role="menuitem"]');
			if (menuLinks.length > 0) {
				menuLinks[0].focus();
				if (navState) {
					navState.currentIndex = 0;
				}
			}
		}, 0);
	}

	/**
	 * Close all desktop panels (topics + sign-in), remove listeners, and sync icons.
	 */
	function closeAllPanelsDesktop() {
		// Remove desktop listeners if attached
		if (desktopListenersAttached) {
			document.removeEventListener('keydown', onEscapeDesktop);
			document.removeEventListener('mousedown', desktopOutsideHandler);
			desktopListenersAttached = false;
		}

		// Clear the desktop focus trap
		clearDesktopFocusTrap();

		// Reset navigation states
		resetNavState(keyboardNavState.desktopMenu);
		resetNavState(keyboardNavState.signInMenu);

		// Reset panels/buttons
		resetPanel(navSelector, openBtnToggler, isActiveClass, 'ontario-header__menu-toggle--is-open');

		resetPanel(signInNavigation, signInBtn, signInActiveClass, 'ontario-header__sign-in-toggle--is-open');

		if (closeBtnToggler) {
			closeBtnToggler.setAttribute('aria-expanded', 'false');
		}

		body.classList.remove(mobileMenuActiveClass);
		syncMenuButtonIcons();
	}

	// Desktop nav ready state
	if (navSelector && openBtnToggler) {
		navSelector.classList.add(isReadyClass);
	}

	/**
	 * Breakpoint change handler: closes open panels and resyncs icons.
	 * Ensures icons reflect the correct layout immediately after resize.
	 */
	function onBreakpointChange() {
		closeMobileMenu(true);
		closeAllPanelsDesktop();
		syncMenuButtonIcons();
	}

	// Listen for breakpoint changes
	desktopMediaQueryList.addEventListener('change', onBreakpointChange);

	// Normalize once on load so icons match the current layout
	onBreakpointChange();
})();

/* ===========================
	 Search
  =========================== */
(function () {
	'use strict';

	if (!('addEventListener' in window) || !document.documentElement.classList) {
		return;
	}

	var header = document.getElementById('ontario-header'),
		searchFormContainer = document.getElementById('ontario-search-form-container'),
		searchInputField = document.getElementById('ontario-search-input-field'),
		searchReset = document.getElementById('ontario-search-reset'),
		searchToggler = document.getElementById('ontario-header-search-toggler'),
		searchClose = document.getElementById('ontario-header-search-close'),
		searchOpenClass = 'ontario-header--search-open';

	if (!searchFormContainer || !searchInputField || !searchReset) {
		return;
	}

	// ESC clears the field; empty value keeps focus
	searchInputField.addEventListener('keyup', function (e) {
		if (e.key === 'Escape' || e.keyCode === KEYCODE.ESCAPE) {
			searchReset.click();
		}
		if (!e.target.value) {
			searchInputField.value = '';
			searchInputField.focus();
		}
	});

	/**
	 * Toggle the header search form open/closed and manage focus/ARIA.
	 * @param {'expand'|'collapse'} newState
	 */
	function toggleSearchForm(newState) {
		header.classList.toggle(searchOpenClass);
		if (newState === 'expand') {
			removeA11y(searchFormContainer);
			searchInputField.focus();
		} else {
			addA11y(searchFormContainer);
			searchToggler.focus();
		}
	}

	searchToggler.addEventListener('click', function () {
		toggleSearchForm('expand');
	});

	searchClose.addEventListener('click', function () {
		toggleSearchForm('collapse');
	});

	searchClose.addEventListener('keyup', function (e) {
		if (e.key === 'Enter' || e.keyCode === KEYCODE.ENTER) {
			toggleSearchForm('collapse');
		}
	});
})();
