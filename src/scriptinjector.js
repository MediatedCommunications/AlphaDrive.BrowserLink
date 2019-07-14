function injectScript(ownerdoc, file, node) {
	const th = ownerdoc.getElementsByTagName(node)[0];
	const s = ownerdoc.createElement('script');
	s.setAttribute('type', 'text/javascript');
	s.setAttribute('src', file);
	if (th) {
		th.append(s);
	}
}

function rewritePage() {
	injectScript(document, chrome.extension.getURL('script.js'), 'body');
	clearInterval(PageRewriterInterval);
}

chrome.storage.local.get(['IsDisabled', 'options'], i => {
	const IsDisabled = i.IsDisabled === undefined ? false : i.IsDisabled;
	const hid = document.createElement('span');
	hid.setAttribute('id', 'momane_ifOpen');
	hid.setAttribute('data-value', IsDisabled);
	const enhanceDom = document.createElement('span');
	enhanceDom.setAttribute('id', 'momane_enhance');
	enhanceDom.setAttribute('data-value', i.options.enhance_doc);
	const c = setInterval(() => {
		if (document.body) {
			clearInterval(c);
			document.body.append(hid);
			document.body.append(enhanceDom);
		}
	}, 10);
});

var PageRewriterInterval = setInterval(rewritePage, 1000);
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
	switch (req.cmd) {
		case 'changeOpen':
			document
				.querySelector('#momane_ifOpen')
				.setAttribute('data-value', !req.open);
			break;
		case 'changeAutoSave':
			document
				.querySelector('#momane_ifSave')
				.setAttribute('data-value', !req.autoSave);
			break;
		case 'changeNotifySave':
			document
				.querySelector('#momane_ifNotify')
				.setAttribute('data-value', !req.notifySave);
			break;
	}
});

function messageToBack(msg) {
	chrome.runtime.sendMessage(msg);
}

window.addEventListener(
	'message',
	message => {
		if (self === top) {
			const detail = message.data;
			if (detail.cmd === 'showToast') {
				messageToBack({cmd: 'notify'});
			}
		} else {
			sendMessageToTop(message.data);
		}
	},
	false
);

function sendMessageToTop(detail) {
	window.parent.postMessage(detail, '*');
}
