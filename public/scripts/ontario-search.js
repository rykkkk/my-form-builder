// Variables for Search Typeahead pattern
const searchInputElement = document.getElementById('search-autocomplete');
const suggestionList = document.getElementById('suggestion-list');
const searchIcon = document.querySelector('.ontario-search__submit');
const lang = document.documentElement.lang || 'en';
const selectedSuggestionElementClass = 'ontario-search-autocomplete__suggestion-list--selected';
let suggestions = [];

// Variables for Search Container
const searchContainer = document.querySelector('.ontario-search__input-container');
const inputSuggestionContainer = document.querySelector('.ontario-search__input-suggestion-container');
const resetButtonAuto = document.getElementById('search-autocomplete-reset-button');

// Ensure reset button is initially hidden
resetButtonAuto.style.display = 'none';

/**
 * Function to handle search
 */
function handleSearch() {
	console.log('Searching...');
	clearSuggestions();
}

/**
 * Add a click listener to the search reset button to clear and focus the search input.
 *
 * @param {string} searchResetButtonId Id of the search reset button
 * @param {string} searchInputId Id of the search input
 */
function addSearchResetOnClickListener(searchResetButtonId, searchInputId) {
	const resetButton = document.getElementById(searchResetButtonId);
	resetButton.addEventListener('click', event => {
		event.preventDefault();
		const searchInput = document.getElementById(searchInputId);
		if (searchInput) {
			resetSearchInput(searchResetButtonId, searchInput);
		}
	});
}

/**
 * Add an input event listener to the search input to show/hide the search reset button.
 *
 * @param {string} searchResetButtonId Id of the search reset button
 * @param {string} searchInputId Id of the search input
 */
function addResetButtonOnSearchInputListener(searchResetButtonId, searchInputId) {
	const resetButton = document.getElementById(searchResetButtonId);
	const searchInput = document.getElementById(searchInputId);

	if (!resetButton || !searchInput) {
		console.warn('Reset button or search input not found.');
		return;
	}

	searchInput.addEventListener('input', function () {
		resetButton.style.display = searchInput.value.trim() !== '' ? 'block' : 'none';
	});
}

/**
 * Add suggestions to the search.
 *
 * @param {Array} customSuggestions The custom suggestions array
 */
function addSuggestions(customSuggestions) {
	searchInputElement.addEventListener('input', event => {
		const inputValue = event.target.value.trim();
		resetButtonAuto.style.display = inputValue !== '' ? 'block' : 'none';
		if (inputValue === '') {
			clearSuggestions();
		} else {
			suggestions = customSuggestions.filter(suggestion => suggestion.toLowerCase().startsWith(inputValue.toLowerCase()));
			if (suggestions.length > 0) {
				displaySuggestions(suggestions, inputValue);
				searchInputElement.setAttribute('aria-activedescendant', 'suggestion_0');
			} else {
				clearSuggestions();
			}
		}
	});
}

/**
 * Create bolded suggestion based on input value.
 *
 * @param {string} suggestion The suggestion text
 * @param {string} inputValue The input value
 * @returns {string} The bolded suggestion HTML
 */
function createBoldedSuggestion(suggestion, inputValue) {
	let boldedSuggestion = '';
	const maxIndex = Math.min(suggestion.length, inputValue.length);
	for (let j = 0; j < maxIndex; j++) {
		boldedSuggestion += suggestion[j].toLowerCase() === inputValue[j].toLowerCase() ? suggestion[j] : `<span style="font-weight: bold;">${suggestion[j]}</span>`;
	}
	if (maxIndex < suggestion.length) {
		boldedSuggestion += suggestion
			.slice(maxIndex)
			.split('')
			.map(char => `<span style="font-weight: bold;">${char}</span>`)
			.join('');
	}
	return boldedSuggestion;
}

/**
 * Update aria-live region with suggestion count and selected option.
 *
 * @param {number} selectedIndex The index of the selected suggestion
 * @param {string} lang The language of the message ('en' for English, 'fr' for French)
 */
function updateAriaLive(selectedIndex, lang) {
	const suggestionCount = suggestions.length;
	const selectedSuggestionNumber = selectedIndex + 1;
	const selectedSuggestion = suggestions[selectedIndex];
	let ariaLiveMessage;

	if (lang === 'fr') {
		ariaLiveMessage = `Option ${selectedSuggestionNumber} sur ${suggestionCount} : ${selectedSuggestion}`;
	} else {
		ariaLiveMessage = `Option ${selectedSuggestionNumber} of ${suggestionCount}: ${selectedSuggestion}`;
	}

	const ariaLiveRegion = document.getElementById('aria-live-region');
	if (ariaLiveRegion) {
		ariaLiveRegion.textContent = ariaLiveMessage;
	}
}

/**
 * Get suggestion item from selection list by index.
 *
 * @param {number} index The index of the suggestion item
 * @returns {Element|null} The suggestion list item or null if index is NaN
 */
function getSuggestionItemByIndex(index) {
	return suggestionList.querySelector(`.ontario-search-autocomplete__suggestion-list__list-item:nth-child(${index + 1})`);
}

/**
 * Navigate suggestions up or down.
 *
 * @param {string} direction The navigation direction ('ArrowUp' or 'ArrowDown')
 */
function navigateSuggestions(direction) {
	const selectedSuggestionElement = document.querySelector('.ontario-search-autocomplete__suggestion-list--selected');
	const selectedIndex = selectedSuggestionElement ? suggestions.findIndex(suggestion => suggestion === selectedSuggestionElement.textContent.trim()) : -1;
	const newIndex = direction === 'ArrowUp' ? (selectedIndex + 1 + suggestions.length) % suggestions.length : (selectedIndex - 1 + suggestions.length) % suggestions.length;

	suggestions.forEach((_, index) => {
		const listItem = getSuggestionItemByIndex(index);
		listItem.classList.remove(selectedSuggestionElementClass);
	});

	const newSelectedItem = getSuggestionItemByIndex(newIndex);
	newSelectedItem.classList.add(selectedSuggestionElementClass);
	newSelectedItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

	updateAriaLive(newIndex, lang);
}

/**
 * Select the currently highlighted suggestion.
 */
function selectSuggestion() {
	const selectedSuggestion = document.querySelector('#suggestion-list .ontario-search-autocomplete__suggestion-list--selected');
	if (selectedSuggestion) {
		searchInputElement.value = selectedSuggestion.textContent.trim();
		clearSuggestions();
		searchInputElement.focus();
		handleSearch();
	}
}

/**
 * Display suggestions based on the input value.
 *
 * @param {Array} suggestions The suggestions array
 * @param {string} inputValue The input value
 */
function displaySuggestions(suggestions, inputValue) {
	suggestionList.innerHTML = '';
	suggestions
		.slice(0, Math.min(Math.max(1, suggestions.length), 8))
		.sort((a, b) => a.localeCompare(b))
		.forEach(suggestion => {
			const listItem = document.createElement('li');
			listItem.classList.add('ontario-search-autocomplete__suggestion-list__list-item');
			listItem.setAttribute('role', 'option');
			listItem.setAttribute('aria-label', suggestion);
			listItem.setAttribute('tabindex', '0');
			listItem.setAttribute('aria-live', 'polite');
			listItem.setAttribute('aria-describedby', 'play-button-explanation');
			listItem.innerHTML = createBoldedSuggestion(suggestion, inputValue);
			suggestionList.appendChild(listItem);
		});
	suggestionList.style.display = 'block';
	suggestionList.setAttribute('aria-hidden', suggestions.length === 0 ? 'true' : 'false');
	searchContainer.classList.add('ontario-search-autocomplete__suggestion-list-open');
}

// Combined event listener for touchstart, mouseover, and click events on suggestion items
suggestionList.addEventListener('touchstart', handleSuggestionInteraction);
suggestionList.addEventListener('mouseover', handleSuggestionInteraction);
suggestionList.addEventListener('click', handleSuggestionInteraction);

/**
 * Handle suggestion interaction.
 *
 * @param {Event} event The interaction event
 */
function handleSuggestionInteraction(event) {
	const target = event.target.closest('.ontario-search-autocomplete__suggestion-list__list-item');
	if (target) {
		const selectedIndex = suggestions.findIndex(suggestion => suggestion === target.textContent.trim());
		suggestions.forEach((_, index) => {
			const listItem = getSuggestionItemByIndex(index);
			listItem.classList.remove(selectedSuggestionElementClass);
		});
		target.classList.add(selectedSuggestionElementClass);
		updateAriaLive(selectedIndex, lang);
		if (event.type === 'click') {
			selectSuggestion();
		}
	}
}

/**
 * Clear suggestions.
 */
function clearSuggestions() {
	suggestionList.innerHTML = '';
	suggestionList.setAttribute('aria-hidden', 'true');
	suggestionList.style.display = 'none';
	searchContainer.classList.remove('ontario-search-autocomplete__suggestion-list-open');
}

// Event listener for blur on search input
searchInputElement.addEventListener('blur', () => {
	searchInputElement.classList.remove('ontario-search-autocomplete--active');
});

// Event listener for focus on search input
searchInputElement.addEventListener('focus', () => {
	searchInputElement.classList.add('ontario-search-autocomplete--active');
});

// Event listener for keydown events
searchInputElement.addEventListener('keydown', handleKeyboardEvent);

/**
 * Handle keyboard events.
 *
 * @param {KeyboardEvent} event The keyboard event
 */
function handleKeyboardEvent(event) {
	const suggestionListVisible = suggestionList.getAttribute('aria-hidden') === 'false';
	const relevantKeys = ['Escape', 'ArrowDown', 'ArrowUp', 'Enter'];

	if (relevantKeys.includes(event.key)) {
		event.preventDefault();
	}

	const isResetButtonFocused = document.activeElement === resetButtonAuto;

	switch (event.key) {
		case 'Escape':
			if (suggestionListVisible) {
				resetSearchComponentAndOverlay();
				clearSuggestions();
			} else {
				searchInputElement.value = '';
				resetSearchComponentAndOverlay();
				clearSuggestions();
				resetButtonAuto.style.display = 'none';
			}
			break;
		case 'ArrowDown':
			navigateSuggestions('ArrowUp');
			break;
		case 'ArrowUp':
			navigateSuggestions('ArrowDown');
			break;
		case 'Enter':
			if (isResetButtonFocused) {
				event.preventDefault(); // Prevent form submission when Enter is pressed on the reset button
				resetSearchInput('search-autocomplete-reset-button', searchInputElement);
			} else if (!suggestionListVisible) {
				event.preventDefault(); // Prevent form submission when Enter is pressed outside of the suggestions
				document.getElementById('search-autocomplete-submit-button').click();
			} else {
				selectSuggestion();
			}
			break;
	}
}

/**
 * Reset the search input.
 *
 * @param {string} searchResetButtonId The id of the search reset button
 * @param {Element} searchInput The search input element
 */
function resetSearchInput(searchResetButtonId, searchInput) {
	const searchResetButton = document.getElementById(searchResetButtonId);
	searchInput.value = '';
	searchResetButton.style.display = 'none';
	searchInput.focus();
	suggestionList.setAttribute('aria-hidden', 'true');
	suggestionList.style.display = 'none';
	searchContainer.classList.remove('ontario-search-autocomplete__suggestion-list-open');
}

/**
 * Check if the device is mobile.
 *
 * @returns {boolean} True if the device is mobile, otherwise false
 */
function isMobileDevice() {
	return window.matchMedia('(max-width: 768px)').matches;
}

/**
 * Create the overlay.
 */
function createOverlay() {
	if (!document.querySelector('.ontario-search__overlay')) {
		const overlay = document.createElement('div');
		overlay.classList.add('ontario-search__overlay');
		document.body.appendChild(overlay);
	}
}

/**
 * Remove the overlay.
 */
function removeOverlay() {
	const overlay = document.querySelector('.ontario-search__overlay');
	if (overlay) {
		overlay.parentNode.removeChild(overlay);
	}
}

/**
 * Reset the search component and overlay.
 */
function resetSearchComponentAndOverlay() {
	if (searchContainer) {
		searchContainer.style.position = '';
		if (inputSuggestionContainer) {
			inputSuggestionContainer.classList.remove('ontario-search__overlay-open');
		}
		removeOverlay();
		searchContainer.style.width = 'calc(100% - .125rem)';
	}
}

/**
 * Position the search component fixed at the top and create the overlay.
 */
function positionSearchComponentFixed() {
	const inputContainer = document.querySelector('.ontario-search__input-container');
	if (inputContainer) {
		inputContainer.style.position = 'fixed';
		inputContainer.style.width = 'calc(100% - 30px)';
		createOverlay();
		if (inputSuggestionContainer) {
			inputSuggestionContainer.classList.add('ontario-search__overlay-open');
		}
	}
}

/**
 * Check if the overlay is open.
 *
 * @returns {boolean} True if the overlay is open, otherwise false
 */
function isOverlayOpen() {
	return document.querySelector('.ontario-search__overlay') !== null;
}

/**
 * Add click listener to the document.
 */
function addDocumentClickListener() {
	document.addEventListener('click', event => {
		const target = event.target;
		// If the target is not within the search component, suggestion list, reset button, or search icon then clear the suggestions and remove the overlay
		if (!searchContainer.contains(target) && !suggestionList.contains(target) && target !== searchIcon) {
			resetSearchComponentAndOverlay();
			clearSuggestions();
		}
	});
}

/**
 * Add click listener to the overlay.
 */
function addOverlayClickListener() {
	const overlay = document.querySelector('.ontario-search__overlay');
	if (overlay) {
		overlay.addEventListener('click', () => {
			resetSearchComponentAndOverlay();
			clearSuggestions();
		});
	}
}

if (isMobileDevice()) {
	// Event listener for click on search input for mobile devices
	searchInputElement.addEventListener('click', () => {
		positionSearchComponentFixed();
		setTimeout(() => {
			window.scrollTo(0, 0); // Scroll to the top of the page after a short delay
		}, 300);
	});
}

searchIcon.addEventListener('click', () => {
	resetSearchComponentAndOverlay();
	clearSuggestions();
});

addDocumentClickListener();
addOverlayClickListener();
