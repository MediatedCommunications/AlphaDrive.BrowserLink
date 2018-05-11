function newDownloadItem(oldDownloadItem) {
    return function (child) {
        let IsDisabled = document.querySelector("#momane_ifOpen").getAttribute("data-value") === "true";
        if (IsDisabled) {
            oldDownloadItem(child);
            sendMessageToTop({cmd: "showToast"});
        } else {
            sendMessageToTop({cmd: "showToast"});
            let newlink = 'alphadrive://localhost/Remoting/AlphaDrive.Services.Remoting.IDocumentServiceUI/rest/ShellExecuteDocument?Document1Id=' + child.id + '&Document1IdType=DocumentID';
            window.location = newlink;
        }

    }

}

var Tries = 0;


let toast = document.createElement("div");
toast.setAttribute("id", "momane_toast");
toast.setAttribute("style", "color: white;z-index:65536;display:none;position: fixed;top: 5px;right: 10px;width: 400px;padding: 10px;background-color: gray;border: 1px solid gray;box-shadow: black 1px 1px 10px 1px;font-size: 13px;");
document.body.appendChild(toast);


window.addEventListener("message", function (message) {
    if (self === top) {
        let detail = message.data;
        if (detail.cmd === "showToast") {
            showToast(" ");
        }
    } else {
        sendMessageToTop(message.data);
    }

}, false);


function showToast(text) {
    // let theToast = document.querySelector("#momane_toast");
    // theToast.style.display = "block";
    // theToast.innerHTML = text;
    // setTimeout(() => {
    //     theToast.style.display = "none";
    // }, 5000)
    // messageToBack({cmd:"notify"});
}

function rewritePage() {

    var Done = false;
    Tries += 1;

    var nodes = document.evaluate("//div[@ng-view]", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE);
    for (var index = 0; index < nodes.snapshotLength; ++index) {
        Done = true;

        var node = nodes.snapshotItem(index);
        var scope = window.angular.element(node).scope();
        scope.downloadItem = newDownloadItem(scope.downloadItem);
    }

    if (Done || Tries >= 10) {
        clearInterval(PageRewriterInterval);
    }

}

var PageRewriterInterval = setInterval(rewritePage, 1000);


function sendMessageToTop(detail) {
    window.parent.postMessage(detail, "*");
}
