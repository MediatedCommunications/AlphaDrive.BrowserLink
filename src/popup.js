const sl = chrome.storage.local;
document.querySelector("#openInAD").onchange = e => {
  let checked = e.target.checked;
  sl.set({ IsDisabled: !checked });
  localStorage.IsDisabled = !checked;
  console.log(
    $(e.target)
      .parent()
      .prev()
      .text(),
    checked
  );

  chrome.extension.getBackgroundPage().saveOpt(!checked);
  chrome.tabs.query({}, tabs => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, { cmd: "changeOpen", open: checked });
    });
  });
};

document.querySelector("#autoSave").onchange = e => {
  let checked = e.target.checked;
  console.log(
    $(e.target)
      .parent()
      .prev()
      .text(),
    checked
  );
  console.log("Changed:", checked);
  sl.get("options", i => {
    let opt = i.options;
    opt.recap_disabled = !checked;
    sl.set({
      options: opt
    });
  });
};

document.querySelector("#notifySave").onchange = e => {
  let checked = e.target.checked;
  console.log(
    $(e.target)
      .parent()
      .prev()
      .text(),
    checked
  );
  sl.get("options", i => {
    let opt = i.options;
    opt.show_notifications = checked;
    sl.set({
      options: opt
    });
  });
};

document.querySelector("#enhanceDoc").onchange = e => {
  let checked = e.target.checked;
  console.log(
    $(e.target)
      .parent()
      .prev()
      .text(),
    checked
  );
  sl.get("options", i => {
    let opt = i.options;
    opt.enhance_doc = checked;
    sl.set({
      options: opt
    });
  });
};

sl.get(["IsDisabled", "options"], i => {
  let IsDisabled = i.IsDisabled === undefined ? false : i.IsDisabled;
  let autoSave =
    i.options.recap_disabled === undefined ? false : i.options.recap_disabled;
  let notifySave =
    i.options.show_notifications === undefined
      ? false
      : i.options.show_notifications;
  let enhanceDoc =
    i.options.enhance_doc === undefined ? false : i.options.enhance_doc;
  document.querySelector("#openInAD").checked = !IsDisabled;
  document.querySelector("#notifySave").checked = notifySave;
  document.querySelector("#autoSave").checked = !autoSave;
  document.querySelector("#enhanceDoc").checked = enhanceDoc;
});
