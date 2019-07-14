function getTabById(tabId, cb) {
	chrome.tabs.get(tabId, cb);
}

function updateToolbarButton(tab) {
	// Updates the toolbar button for a tab to reflect the tab's login status.
	const setTitleIcon = function (title, icon) {
		chrome.browserAction.setTitle({title: 'Faster Law: ' + title});
		chrome.browserAction.setIcon({path: icon});
	};

	chrome.storage.local.get('options', items => {
		if (tab === null || tab === undefined) {
			// There's code in Firefox that can be called before the defaults are set
			// and before the tab is even established. Catch that, and handle it or
			// else it can crash things.
			setTitleIcon('Faster Law is ready', {
				19: 'assets/images/icon-0128.png',
				38: 'assets/images/icon-0128.png'
			});
			return;
		}

		if ($.isEmptyObject(items)) {
			// Firefox 56 bug. The default settings didn't get created properly when
			// upgrading from the legacy extension. This can be removed when everybody
			// is safely beyond 56 (and the ESR)
			setDefaultOptions({});
		}

		if (items && items.options && items.options.recap_disabled) {
			setTitleIcon('Faster Law is temporarily disabled', {
				19: 'assets/images/icon-0128.png',
				38: 'assets/images/icon-0128.png'
			});
		} else {
			// Is it a PACER URL?
			const court = PACER.getCourtFromUrl(tab.url);
			if (!court) {
				// Not a PACER URL. Show gray.
				setTitleIcon('Faster Suite Browser Link', {
					19: 'assets/images/icon-0128.png',
					38: 'assets/images/icon-0128.png'
				});
			} else if (PACER.isAppellateCourt(court)) {
				// Appellate court. Show warning.
				setTitleIcon('Faster Suite Browser Link', {
					19: 'assets/images/icon-0128.png',
					38: 'assets/images/icon-0128.png'
				});
			} else {
				// It's a valid PACER URL. Therefore either show the nice blue icon or
				// show the blue icon with a warning, if receipts are disabled.
				chrome.cookies.get(
					{
						url: tab.url,
						name: 'PacerPref'
					},
					pref_cookie => {
						if (pref_cookie && pref_cookie.value.match(/receipt=N/)) {
							// Receipts are disabled. Show the warning.
							setTitleIcon('Faster Suite Browser Link', {
								19: 'assets/images/icon-0128.png',
								38: 'assets/images/icon-0128.png'
							});
						} else {
							// At PACER, and things look good!
							setTitleIcon('Faster Suite Browser Link', {
								19: 'assets/images/icon-0128.png',
								38: 'assets/images/icon-0128.png'
							});
						}
					}
				);
			}
		}
	});
}
