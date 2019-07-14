function newDownloadItem(oldDownloadItem) {
	return function (child) {
		const docId = child.id;
		const IsDisabled =
      document.querySelector('#momane_ifOpen').getAttribute('data-value') ===
      'true';
		if (IsDisabled) {
			// OldDownloadItem(child);
			window.location = `clio://launcher/edit/${child.id}`;
			// SendMessageToTop({
			//   cmd: "showToast"
			// });
		} else {
			// SendMessageToTop({
			//   cmd: "showToast"
			// });
			window.location = `alphadrive://localhost/Remoting/custom_actions/documents/edit?subject_url=/api/v4/documents/${docId}`;
		}
	};
}

let Tries = 0;

const toast = document.createElement('div');
toast.setAttribute('id', 'momane_toast');
toast.setAttribute(
	'style',
	'color: white;z-index:65536;display:none;position: fixed;top: 5px;right: 10px;width: 400px;padding: 10px;background-color: gray;border: 1px solid gray;box-shadow: black 1px 1px 10px 1px;font-size: 13px;'
);
document.body.append(toast);

window.addEventListener(
	'message',
	message => {
		if (self === top) {
			const detail = message.data;
			if (detail.cmd === 'showToast') {
				showToast(' ');
			}
		} else {
			sendMessageToTop(message.data);
		}
	},
	false
);

function showToast(text) {}

function rewritePage() {
	const ifRewrite =
    document.querySelector('#momane_enhance').getAttribute('data-value') ===
    'true';
	if (!ifRewrite) {
		return;
	}

	const Done = false;
	Tries += 1;

	const nodes = document.querySelectorAll('a[e-form=\'documentNameForm\']');
	if (nodes) {
		nodes.forEach(node => {
			const scope = window.angular.element(node).scope();
			const p = node.parentNode;
			const docID = getDocID(node);
			if (!p.querySelector('.momane_out')) {
				const outIcon = createIcon(
					'momane_out',
					'fa-external-link-square',
					'Open this document with Clio Launcher',
					`clio://launcher/edit/${docID}`
				);
				const downloadIcon = createIcon(
					'momane_download',
					'fa-download',
					'Download this document',
					p.baseURI
				);
				const compareIcon = createIcon(
					'momane_compare',
					'fa-adjust',
					'Compare this document using Faster Suite',
					`alphadrive://localhost/Remoting/custom_actions/documents/compare?subject_url=/api/v4/documents/${docID}`
				);
				const copyIcon = createIcon(
					'momane_link',
					'fa-link',
					'Copy a link to this document using Faster Suite',
					`alphadrive://localhost/Remoting/custom_actions/documents/share/link?subject_url=/api/v4/documents/${docID}`
				);
				const locateIcon = createIcon(
					'momane_search',
					'fa-folder-open',
					'Open this document\'s folder using Faster Suite',
					`alphadrive://localhost/Remoting/custom_actions/documents/locate?subject_url=/api/v4/documents/${docID}`
				);
				const fasterLaw = createIcon(
					'momane_fastlaw',
					'fasterlaw',
					'Open this document with Faster Suite',
					`alphadrive://localhost/Remoting/custom_actions/documents/edit?subject_url=/api/v4/documents/${docID}`
				);
				// OutIcon.setAttribute("ng-click", scope.itemClicked);
				downloadIcon.addEventListener('click', () => {
					const {id} = scope.child;
					window.open(`https://app.clio.com/iris/documents/${id}/download`);
				});

				const link = p.querySelector('.external-application-links');
				outIcon.addEventListener('click', () => {
					link.click();
				});

				p.prepend(outIcon);
				p.prepend(downloadIcon);
				p.prepend(compareIcon);
				p.prepend(copyIcon);
				p.prepend(locateIcon);
				p.prepend(fasterLaw);
				link.style.display = 'none';
			}

			scope.itemClicked = newDownloadItem(scope.itemClicked);
		});
	}

	if (Done || Tries >= 100) {
		clearInterval(PageRewriterInterval);
	}
}

function createIcon(name, icon, title, url) {
	const dom = document.createElement('a');
	dom.setAttribute('class', `${name} fa ${icon}`);
	dom.style.cursor = 'pointer';
	dom.style.color = '#2A579A';
	dom.title = title;
	dom.href = url;
	return dom;
}

var PageRewriterInterval = setInterval(rewritePage, 1000);

function sendMessageToTop(detail) {
	window.parent.postMessage(detail, '*');
}

function getOutLink(link) {
	try {
		return link.match(/\d+$/)[0];
	} catch (error) {
		return 0;
	}
}

function getDocID(node) {
	try {
		const tr = node.closest('tr');
		const id = tr.getAttribute('id');

		return id.match(/\d+$/)[0];
	} catch (error) {
		return 0;
	}
}
