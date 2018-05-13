function injectScript(ownerdoc, file, node) {
  var th = ownerdoc.getElementsByTagName(node)[0];
  var s = ownerdoc.createElement('script');
  s.setAttribute('type', 'text/javascript');
  s.setAttribute('src', file);
  th.appendChild(s);
}


function rewritePage() {
  injectScript(document, chrome.extension.getURL('script.js'), 'body');
  clearInterval(PageRewriterInterval);
  return;
}

chrome.storage.local.get("IsDisabled", i => {
  let IsDisabled = i.IsDisabled === undefined ? false : i.IsDisabled;
  let hid = document.createElement("span");
  hid.setAttribute("id", "momane_ifOpen");
  hid.setAttribute("data-value", IsDisabled);
  document.body.appendChild(hid);
});


var PageRewriterInterval = setInterval(rewritePage, 1000);
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.cmd === "changeOpen") {
    document.getElementById("momane_ifOpen").setAttribute("data-value", !req.open)
  }
});

function messageToBack(msg) {
  chrome.runtime.sendMessage(msg);
}


window.addEventListener("message", function (message) {
  if (self === top) {
    let detail = message.data;
    if (detail.cmd === "showToast") {
      messageToBack({cmd: "notify"});
    }
  } else {
    sendMessageToTop(message.data);
  }

}, false);


function sendMessageToTop(detail) {
  window.parent.postMessage(detail, "*");
}
