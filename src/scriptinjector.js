function injectScript(ownerdoc, file, node) {
  var th = ownerdoc.getElementsByTagName(node)[0];
  var s = ownerdoc.createElement("script");
  s.setAttribute("type", "text/javascript");
  s.setAttribute("src", file);
  if (th) {
    th.appendChild(s);
  }
}

function rewritePage() {
  injectScript(document, chrome.extension.getURL("clio-docs.js"), "body");
  clearInterval(PageRewriterInterval);
  return;
}

chrome.storage.local.get(["IsDisabled", "options"], i => {
  let IsDisabled = i.IsDisabled === undefined ? false : i.IsDisabled;
  let hid = document.createElement("span");
  hid.setAttribute("id", "momane_ifOpen");
  hid.setAttribute("data-value", IsDisabled);
  let enhanceDom = document.createElement("span");
  enhanceDom.setAttribute("id", "momane_enhance");
  enhanceDom.setAttribute("data-value", i.options.enhance_doc);
  let c = setInterval(() => {
    if (document.body) {
      clearInterval(c);
      document.body.appendChild(hid);
      document.body.appendChild(enhanceDom);
    }
  }, 10);
});

var PageRewriterInterval = setInterval(rewritePage, 1000);
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  switch (req.cmd) {
    case "changeOpen":
      document
        .getElementById("momane_ifOpen")
        .setAttribute("data-value", !req.open);
      break;
    case "changeAutoSave":
      document
        .getElementById("momane_ifSave")
        .setAttribute("data-value", !req.autoSave);
      break;
    case "changeNotifySave":
      document
        .getElementById("momane_ifNotify")
        .setAttribute("data-value", !req.notifySave);
      break;
  }
});

function messageToBack(msg) {
  chrome.runtime.sendMessage(msg);
}

window.addEventListener(
  "message",
  function(message) {
    if (self === top) {
      let detail = message.data;
      if (detail.cmd === "showToast") {
        messageToBack({ cmd: "notify" });
      }
    } else {
      sendMessageToTop(message.data);
    }
  },
  false
);

function sendMessageToTop(detail) {
  window.parent.postMessage(detail, "*");
}
