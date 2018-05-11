let disabled = false;
let lastShowTime = Date.now();
const maxGap = 800;
chrome.storage.local.get("IsDisabled", i => {
    disabled = i.IsDisabled === undefined ? false : i.IsDisabled;
    saveOpt(disabled);
});

function saveOpt(disa) {
    disabled = disa;
    let icon = disa ? "icon-0064-disabled.png" : "icon-0064.png";
    let tooltip = disa ? "AlphaDrive WILL NOT open Clio file links" : "AlphaDrive will open Clio file links";
    setBA(icon, tooltip)
}


function setBA(icon, toolTip) {
    chrome.browserAction.setIcon({
        path: {
            "64": icon,
        }
    });
    chrome.browserAction.setTitle({
        title: toolTip
    });
}


const msg = {
    disable: {
        title: "AlphaDrive Browser Extension is Disabled",
        msg: "The file you requested is being downloaded."
    },
    enable: {
        title: "AlphaDrive Browser Extension is Enabled",
        msg: "The file you requested is being opened."
    }
};


const cn = chrome.notifications;


chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
    switch (req.cmd) {
        case "notify":
            notify();
            break;
    }
});

function notify() {
    if (Date.now() - lastShowTime < maxGap) {
        return
    }
    lastShowTime = Date.now();
    let title = disabled ? msg.disable.title : msg.enable.title;
    let message = disabled ? msg.disable.msg : msg.enable.msg;
    let opt = {
        type: "basic",
        title: title,
        iconUrl: "icon-0064.png",
        message: message
    };
    cn.create("", opt);
}