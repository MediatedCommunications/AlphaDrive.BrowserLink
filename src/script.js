function newDownloadItem(oldDownloadItem) {
  return function(child) {
    const docId = child.id;
    let IsDisabled =
      document.querySelector("#momane_ifOpen").getAttribute("data-value") ===
      "true";
    if (IsDisabled) {
      // oldDownloadItem(child);
      window.location = `clio://launcher/edit/${child.id}`;
      // sendMessageToTop({
      //   cmd: "showToast"
      // });
    } else {
      // sendMessageToTop({
      //   cmd: "showToast"
      // });
      window.location = `alphadrive://localhost/Remoting/custom_actions/documents/edit?subject_url=/api/v4/documents/${docId}`;
    }
  };
}

var Tries = 0;

let toast = document.createElement("div");
toast.setAttribute("id", "momane_toast");
toast.setAttribute(
  "style",
  "color: white;z-index:65536;display:none;position: fixed;top: 5px;right: 10px;width: 400px;padding: 10px;background-color: gray;border: 1px solid gray;box-shadow: black 1px 1px 10px 1px;font-size: 13px;"
);
document.body.appendChild(toast);

window.addEventListener(
  "message",
  function(message) {
    if (self === top) {
      let detail = message.data;
      if (detail.cmd === "showToast") {
        showToast(" ");
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
    document.querySelector("#momane_enhance").getAttribute("data-value") ===
    "true";
  if (!ifRewrite) {
    return;
  }
  var Done = false;
  Tries += 1;

  let nodes = document.querySelectorAll('a[href*="/download"]');
  // let nodes = document.querySelectorAll("a[e-form='documentNameForm']");
  console.log(nodes);
  console.log(getDocID(nodes[0]));
  
  if (nodes) {
    nodes.forEach(node => {
      let scope = window.angular.element(node).scope();
      let p = node.parentNode;
      const docID = getDocID(node);
      if (!p.querySelector(".momane_out")) {
        let outIcon = createIcon(
          "momane_out",
          "fa-external-link-square",
          "Open this document with Clio Launcher",
          `clio://launcher/edit/${docID}`
        );
        let downloadIcon = createIcon(
          "momane_download",
          "fa-download",
          "Download this document",
          p.baseURI
        );
        let compareIcon = createIcon(
          "momane_compare",
          "fa-adjust",
          "Compare this document using Faster Suite",
          `alphadrive://localhost/Remoting/custom_actions/documents/compare?subject_url=/api/v4/documents/${docID}`
        );
        let copyIcon = createIcon(
          "momane_link",
          "fa-link",
          "Copy a link to this document using Faster Suite",
          `alphadrive://localhost/Remoting/custom_actions/documents/share/link?subject_url=/api/v4/documents/${docID}`
        );
        let locateIcon = createIcon(
          "momane_search",
          "fa-folder-open",
          "Open this document's folder using Faster Suite",
          `alphadrive://localhost/Remoting/custom_actions/documents/locate?subject_url=/api/v4/documents/${docID}`
        );
        let fasterLaw = createIcon(
          "momane_fastlaw",
          "fasterlaw",
          "Open this document with Faster Suite",
          `alphadrive://localhost/Remoting/custom_actions/documents/edit?subject_url=/api/v4/documents/${docID}`
        );
        // outIcon.setAttribute("ng-click", scope.itemClicked);
        downloadIcon.onclick = function() {
          let id = scope.child.id
          window.open(`https://app.clio.com/iris/documents/${id}/download`)
        };
        // let link = p.querySelector(".external-application-links");
        outIcon.onclick = function() {
          link.click();
        };
        p.prepend(outIcon);
        p.prepend(downloadIcon);
        p.prepend(compareIcon);
        p.prepend(copyIcon);
        p.prepend(locateIcon);
        p.prepend(fasterLaw);
        // link.style.display = "none";
      }
      
      // scope.itemClicked = newDownloadItem(scope.itemClicked);
    });
  }

  if (Done || Tries >= 100) {
    clearInterval(PageRewriterInterval);
  }
}

function createIcon(name, icon, title, url) {
  let dom = document.createElement("a");
  dom.setAttribute("class", `${name} fa ${icon}`);
  dom.style.cursor = "pointer";
  dom.style.color = "#2A579A";
  dom.title = title;
  dom.href = url;
  return dom;
}

var PageRewriterInterval = setInterval(rewritePage, 1000);

function sendMessageToTop(detail) {
  window.parent.postMessage(detail, "*");
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
    const tr = node.closest("tr");
    const id = tr.getAttribute("id");

    return id.match(/\d+$/)[0];
  } catch (e) {
    return 0;
  }
}
