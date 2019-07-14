const sl = chrome.storage.local;
document.querySelector('#openInAD').addEventListener('change', e => {
	const {checked} = e.target;
	sl.set({IsDisabled: !checked});
	localStorage.IsDisabled = !checked;
	console.log(
		$(e.target)
			.parent()
			.prev()
			.text(),
		checked
	);

	chrome.extension.getBackgroundPage().saveOpt(!checked);
	chrome.tabs.query({}, tabs => {
		tabs.forEach(tab => {
			chrome.tabs.sendMessage(tab.id, {cmd: 'changeOpen', open: checked});
		});
	});
});

document.querySelector('#autoSave').addEventListener('change', e => {
	const {checked} = e.target;
	console.log(
		$(e.target)
			.parent()
			.prev()
			.text(),
		checked
	);
	console.log('Changed:', checked);
	sl.get('options', i => {
		const opt = i.options;
		opt.recap_disabled = !checked;
		sl.set({
			options: opt
		});
	});
});

document.querySelector('#notifySave').addEventListener('change', e => {
	const {checked} = e.target;
	console.log(
		$(e.target)
			.parent()
			.prev()
			.text(),
		checked
	);
	sl.get('options', i => {
		const opt = i.options;
		opt.show_notifications = checked;
		sl.set({
			options: opt
		});
	});
});

document.querySelector('#enhanceDoc').addEventListener('change', e => {
	const {checked} = e.target;
	console.log(
		$(e.target)
			.parent()
			.prev()
			.text(),
		checked
	);
	sl.get('options', i => {
		const opt = i.options;
		opt.enhance_doc = checked;
		sl.set({
			options: opt
		});
	});
});

sl.get(['IsDisabled', 'options'], i => {
	const IsDisabled = i.IsDisabled === undefined ? false : i.IsDisabled;
	const autoSave =
    i.options.recap_disabled === undefined ? false : i.options.recap_disabled;
	const notifySave =
    i.options.show_notifications === undefined ?
    	false :
    	i.options.show_notifications;
	const enhanceDoc =
    i.options.enhance_doc === undefined ? false : i.options.enhance_doc;
	document.querySelector('#openInAD').checked = !IsDisabled;
	document.querySelector('#notifySave').checked = notifySave;
	document.querySelector('#autoSave').checked = !autoSave;
	document.querySelector('#enhanceDoc').checked = enhanceDoc;
});
