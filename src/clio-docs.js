let docNodesSearchCompleted = false;
let docNodesSearchTries = 0;

let toast = document.createElement('div');
toast.setAttribute('id', 'momane_toast');
toast.setAttribute(
  'style',
  'color: white;z-index:65536;display:none;position: fixed;top: 5px;right: 10px;width: 400px;padding: 10px;background-color: gray;border: 1px solid gray;box-shadow: black 1px 1px 10px 1px;font-size: 13px;'
);
document.body.appendChild(toast);

window.addEventListener(
  'message',
  function (message) {
    if (self === top) {
      let detail = message.data;
      if (detail.cmd === 'showToast') {
        showToast(' ');
      }
    } else {
      sendMessageToTop(message.data);
    }
  },
  false
);

const clioDocsRewriterInterval = setInterval(clioDocsRewriter, 1000);

function clioDocsRewriter() {
  docNodesSearchTries += 1;

  const ifRewrite =
    document.querySelector('#momane_enhance').getAttribute('data-value') ===
    'true';
  if (!ifRewrite) {
    return;
  }

  let nodes = document.querySelectorAll("a[e-form='documentNameForm']");

  if (nodes.length > 1 || docNodesSearchTries >= 100) {
    clearInterval(clioDocsRewriterInterval);
  }

  console.log(nodes, docNodesSearchTries);

  if (nodes) {
    nodes.forEach((node) => {
      let scope = window.angular.element(node).scope();
      let p = node.parentNode;
      const docID = getDocID(node);
      const link = p.querySelector('.external-application-links');

      if (!p.querySelector('.momane_out')) {
        let fasterLawIcon = createFasterLawIcon(docID, link);
        p.prepend(fasterLawIcon);       
      }
      scope.itemClicked = newDownloadItem(scope.itemClicked);
    });
  }
}

function createFasterLawIcon(docID, link) {
  const fasterLawIcon = document.createElement('div');
  fasterLawIcon.classList.add('fasterlaw-icon');

  const actionsContainer = document.createElement('div');
  actionsContainer.classList.add('fasterlaw-actions-container');

  const openWithClioAction = document.createElement('div');
  openWithClioAction.classList.add('action');
  openWithClioAction.setAttribute(
    'title',
    'Open this document with Clio Launcher'
  );
  openWithClioAction.innerHTML = 'Open with Clio';
  openWithClioAction.addEventListener('click', function () {
    link.click();
  });  

  const downloadAction = document.createElement('div');
  downloadAction.classList.add('action');
  downloadAction.setAttribute('title', 'Download this document');
  downloadAction.innerHTML = 'Download';
  downloadAction.addEventListener('click', function () {
    window.open(`https://app.clio.com/iris/documents/${docID}/download`);
  });  

  const compareAction = document.createElement('div');
  compareAction.classList.add('action');
  compareAction.setAttribute(
    'title',
    'Compare this document using Faster Suite'
  );
  compareAction.innerHTML = 'Compare this document';
  compareAction.addEventListener('click', function () {
    window.location = `alphadrive://localhost/Remoting/custom_actions/documents/compare?subject_url=/api/v4/documents/${docID}`;
  });

  const copyLinkAction = document.createElement('div');
  copyLinkAction.classList.add('action');
  copyLinkAction.setAttribute(
    'title',
    'Copy a link to this document using Faster Suite'
  );
  copyLinkAction.innerHTML = 'Copy a link';
  copyLinkAction.addEventListener('click', function () {
    window.location = `alphadrive://localhost/Remoting/custom_actions/documents/share/link?subject_url=/api/v4/documents/${docID}`;
  });

  const openFolderAction = document.createElement('div');
  openFolderAction.classList.add('action');
  openFolderAction.setAttribute(
    'title',
    `Open this document's folder using Faster Suite`
  );
  openFolderAction.innerHTML = `Open folder`;
  openFolderAction.addEventListener('click', function () {
    window.location = `alphadrive://localhost/Remoting/custom_actions/documents/locate?subject_url=/api/v4/documents/${docID}`;
  });

  const openWithFasterLawAction = document.createElement('div');
  openWithFasterLawAction.classList.add('action');
  openWithFasterLawAction.setAttribute(
    'title',
    `Open this document with Faster Suite`
  );
  openWithFasterLawAction.innerHTML = 'Open document';
  openWithFasterLawAction.addEventListener('click', function () {
    window.location = `alphadrive://localhost/Remoting/custom_actions/documents/edit?subject_url=/api/v4/documents/${docID}`;
  });

  actionsContainer.appendChild(openWithFasterLawAction);
  actionsContainer.appendChild(openFolderAction);
  actionsContainer.appendChild(copyLinkAction);
  actionsContainer.appendChild(compareAction);
  actionsContainer.appendChild(downloadAction);
  actionsContainer.appendChild(openWithClioAction);

  fasterLawIcon.appendChild(actionsContainer);

  fasterLawIcon.addEventListener('click', function () {
    actionsContainer.classList.toggle('open');
  });

  return fasterLawIcon;
}

function createIcon(name, icon, title, url) {
  let dom = document.createElement('a');
  dom.setAttribute('class', `${name} fa ${icon}`);
  dom.style.cursor = 'pointer';
  dom.style.color = '#2A579A';
  dom.title = title;
  dom.href = url;
  return dom;
}

function newDownloadItem(oldDownloadItem) {
  return function (child) {
    const docId = child.id;
    let IsDisabled =
      document.querySelector('#momane_ifOpen').getAttribute('data-value') ===
      'true';
    if (IsDisabled) {      
      window.location = `clio://launcher/edit/${child.id}`;      
    } else {
      window.location = `alphadrive://localhost/Remoting/custom_actions/documents/edit?subject_url=/api/v4/documents/${docId}`;
    }
  };
}

function showToast(text) {}

function sendMessageToTop(detail) {
  window.parent.postMessage(detail, '*');
}

function getOutLink(link) {
  try {
    return link.match(/\d+$/)[0];
  } catch (e) {
    return 0;
  }
}

function getDocID(node) {
  try {
    const tr = node.closest('tr');
    const id = tr.getAttribute('id');

    return id.match(/\d+$/)[0];
  } catch (e) {
    return 0;
  }
}
