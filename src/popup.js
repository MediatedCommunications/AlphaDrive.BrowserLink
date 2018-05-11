
document.querySelector("#openInAD").onchange = (e) => {
    let checked = e.target.checked;
    chrome.storage.local.set({"IsDisabled": !checked});
    localStorage.IsDisabled = !checked;

    chrome.extension.getBackgroundPage().saveOpt(!checked);


    chrome.tabs.query({}, tabs => {
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {cmd: "changeOpen", open: checked});
        })
    });
};

chrome.storage.local.get("IsDisabled", i => {
    let IsDisabled = i.IsDisabled === undefined ? false : i.IsDisabled;
    document.querySelector("#openInAD").checked = !IsDisabled;
});
