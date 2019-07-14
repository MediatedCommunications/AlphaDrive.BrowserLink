// Public impure functions.  (See utils.js for details on defining services.)
function Notifier() {
	const showNotification = function (title, message, cb) {
		console.info(
			'Faster Law: Running showNotification function. Expect a notification.'
		);
		const notificationOptions = {
			type: 'basic',
			title,
			message,
			iconUrl: chrome.extension.getURL('assets/images/icon-0128.png'),
			priority: 0
		};
		const notificationID = 'faterlaw_notification';
		chrome.notifications.create(notificationID, notificationOptions, cb);
		// Make it go away when clicked.
		chrome.notifications.onClicked.addListener(notificationID => {
			chrome.notifications.clear(notificationID, () => {});
		});
	};

	return {
		// Shows a desktop notification for a few seconds (length depends on priority)
		show(title, message, cb) {
			showNotification(title, message, cb);
		},
		// Shows an upload message if upload notifications are enabled.
		showUpload(message, cb) {
			chrome.storage.local.get('options', items => {
				if (items.options.show_notifications) {
					showNotification('Faster Law upload', message, cb);
				}
			});
		},
		// Shows a login status message if login status notifications are enabled.
		showStatus(active, message, cb) {
			chrome.storage.local.get('options', items => {
				if (items.options.show_notifications) {
					showNotification(
						active ? 'Faster Law is active' : 'Faster Law is inactive',
						message,
						cb
					);
				}
			});
		}
	};
}
