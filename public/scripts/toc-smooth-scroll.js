(function () {
	const links = document.querySelectorAll('.ontario-page-navigation-item__link');

	for (const link of links) {
		link.addEventListener('click', clickHandler);
	}

	function clickHandler(e) {
		e.preventDefault();

		const href = this.getAttribute('href');
		const element = document.querySelector(href);

		if (element) {
			element.scrollIntoView({ behavior: 'smooth' });
		}

		history.pushState(null, null, href);
	}

	// Handle initial page load - scroll to anchor if present in URL hash
	function scrollToAnchorOnLoad() {
		const hash = window.location.hash;
		if (hash) {
			const targetId = hash.substring(1); // Remove the '#' prefix
			const targetElement = document.getElementById(targetId);

			if (targetElement) {
				// Use a small delay to ensure the DOM is fully rendered
				setTimeout(function () {
					targetElement.scrollIntoView({ behavior: 'smooth' });
				}, 100);
			}
		}
	}

	// Run on page load
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', scrollToAnchorOnLoad);
	} else {
		scrollToAnchorOnLoad();
	}
})();
