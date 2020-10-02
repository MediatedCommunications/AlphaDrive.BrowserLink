let initialized = false;
let enhancedNodes = [];
const observerConfig = { attributes: false, childList: true, subtree: true };
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

window.addEventListener('click', (event) => {    
  if (!event.target.classList.contains('fasterlaw-icon')) {
    document.querySelectorAll('.fasterlaw-actions-container').forEach(container => container.classList.remove('open'));
  }  
});

const observerCallback = function (mutationsList, observer) {
  if (observer) {
    observer.disconnect();
  }

  let isNewUI = false;

  const ifRewrite =
    document.querySelector('#momane_enhance').getAttribute('data-value') ===
    'true';
  if (!ifRewrite) {
    return;
  }

  let nodes = document.querySelectorAll("a[e-form='documentNameForm']");

  if (nodes.length < 1) {
    nodes = document.querySelectorAll('tr a[href*="/download"]');
    isNewUI = true;
  }

  if (nodes.length > 0 && !isNewUI) {
    nodes.forEach((node) => {
      if (enhancedNodes.includes(node)) {
        return;
      }

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

  if (nodes.length > 0 && isNewUI) {
    nodes.forEach((node) => {
      if (enhancedNodes.includes(node)) {
        return;
      }

      node.addEventListener('click', (event) => {
        let IsDisabled =
          document
            .querySelector('#momane_ifOpen')
            .getAttribute('data-value') === 'true';
        if (!IsDisabled) {
          event.preventDefault();
          window.location = `alphadrive://localhost/Remoting/custom_actions/documents/edit?subject_url=/api/v4/documents/${docID}`;
        }
      });

      const p = node.parentNode;
      const pTd = node.closest('td');
      const pTr = pTd.closest('tr');
      const targetViewElement = pTr.querySelector('cc-document-actions').parentNode;
      const docID = p.getAttribute('id');
      const link = p.parentNode.querySelector('.fa-external-link-square');

      targetViewElement.style.display = 'flex';
      targetViewElement.style.alignItems = 'center';
      targetViewElement.style.overflow = 'visible';
      targetViewElement.style.position = 'relative';

      if (!p.querySelector('.momane_out')) {
        let fasterLawIcon = createFasterLawIcon(docID, link);
        fasterLawIcon.classList.add('new-ui');
        targetViewElement.append(fasterLawIcon);
      }
    });
  }

  if (nodes.length > 0) {
    initialized = true;
    nodes.forEach((node) => enhancedNodes.push(node));
  }

  if (observer) {
    observer.observe(document.body, observerConfig);
  }
};

const initInterval = setInterval(initialize, 1500);

function initialize() {
  observerCallback();

  if (initialized) {
    const observer = new MutationObserver(observerCallback);
    observer.observe(document.body, observerConfig);
    clearInterval(initInterval);
  }
}

function createFasterLawIcon(docID, link) {
  const fasterLawIcon = document.createElement('div');
  fasterLawIcon.classList.add('fasterlaw-icon');

  const actionsContainer = document.createElement('div');
  actionsContainer.classList.add('fasterlaw-actions-container');

  const actionsTitle = document.createElement('div');
  actionsTitle.classList.add('fasterlaw-actions-title', 'action');
  actionsTitle.innerHTML = '<div class="title-icon"></div> Faster Suite';

  /**
   * COMPARE ACTION
   */
  const compareAction = document.createElement('div');
  compareAction.classList.add('action');
  compareAction.setAttribute(
    'title',
    'Compare this document using Faster Suite'
  );
  compareAction.innerHTML = 'Compare';
  compareAction.addEventListener('click', function () {
    window.location = `alphadrive://localhost/Remoting/custom_actions/documents/compare?subject_url=/api/v4/documents/${docID}`;
  });

  /**
   * COPY LINK WITH FS ACTION
   */
  const copyLinkAction = document.createElement('div');
  copyLinkAction.classList.add('action');
  copyLinkAction.setAttribute(
    'title',
    'Copy a link to this document using Faster Suite'
  );
  copyLinkAction.innerHTML = 'Copy Link';
  copyLinkAction.addEventListener('click', function () {
    window.location = `alphadrive://localhost/Remoting/custom_actions/documents/share/link?subject_url=/api/v4/documents/${docID}`;
  });

  /**
   * EDIT DOCUMENT ACTION
   */
  const openWithFasterLawAction = document.createElement('div');
  openWithFasterLawAction.classList.add('action');
  openWithFasterLawAction.setAttribute(
    'title',
    `Open this document with Faster Suite`
  );
  openWithFasterLawAction.innerHTML = 'Edit Document';
  openWithFasterLawAction.addEventListener('click', function () {
    window.location = `alphadrive://localhost/Remoting/custom_actions/documents/edit?subject_url=/api/v4/documents/${docID}`;
  });

  const openWithClioAction = document.createElement('div');
  openWithClioAction.classList.add('action');
  openWithClioAction.setAttribute(
    'title',
    'Open this document with Clio Launcher'
  );
  openWithClioAction.innerHTML = 'Open With Clio';
  openWithClioAction.addEventListener('click', function () {
    link.click();
  });

  /**
   * DOWNLOAD ACTION
   */
  const downloadAction = document.createElement('div');
  downloadAction.classList.add('action');
  downloadAction.setAttribute('title', 'Download this document');
  downloadAction.innerHTML = 'Download';
  downloadAction.addEventListener('click', function () {
    window.open(`https://app.clio.com/iris/documents/${docID}/download`);
  });   

  /**
   * LOCATE ACTION
   */
  const openFolderAction = document.createElement('div');
  openFolderAction.classList.add('action');
  openFolderAction.setAttribute(
    'title',
    `Open this document's folder using Faster Suite`
  );
  openFolderAction.innerHTML = `Locate`;
  openFolderAction.addEventListener('click', function () {
    window.location = `alphadrive://localhost/Remoting/custom_actions/documents/locate?subject_url=/api/v4/documents/${docID}`;
  });  

  actionsContainer.appendChild(actionsTitle);
  actionsContainer.appendChild(compareAction);
  actionsContainer.appendChild(copyLinkAction);
  actionsContainer.appendChild(openWithFasterLawAction);    
  actionsContainer.appendChild(openFolderAction);
  actionsContainer.appendChild(downloadAction);  
  actionsContainer.appendChild(openWithClioAction);  
  fasterLawIcon.appendChild(actionsContainer);

  fasterLawIcon.addEventListener('click', function () {
    document.querySelectorAll('.fasterlaw-actions-container').forEach(container => {
      if(container !== actionsContainer){
        container.classList.remove('open')
      }
    });
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
