let disabled = false;
let lastShowTime = Date.now();
const maxGap = 800;
chrome.storage.local.get("IsDisabled", i => {
  disabled = i.IsDisabled === undefined ? false : i.IsDisabled;
  saveOpt(disabled);
});

function saveOpt(disa) {
  disabled = disa;
  let icon = "icon-0128.png";
  let tooltip = disa
    ? "Faster Suite WILL NOT open Clio file links"
    : "Faster Suite will open Clio file links";
  setBA(icon, tooltip);
}

function setBA(icon, toolTip) {
  chrome.browserAction.setIcon({
    path: {
      "64": icon
    }
  });
  chrome.browserAction.setTitle({
    title: "Faster Suite Browser Link"
  });
}

const msg = {
  disable: {
    title: "Faster Suite Browser Extension is Disabled",
    msg: "The file you requested is being downloaded."
  },
  enable: {
    title: "Faster Suite Browser Extension is Enabled",
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
    return;
  }
  lastShowTime = Date.now();
  let title = disabled ? msg.disable.title : msg.enable.title;
  let message = disabled ? msg.disable.msg : msg.enable.msg;
  let opt = {
    type: "basic",
    title: title,
    iconUrl: "icon-0128.png",
    message: message
  };
  cn.create("", opt);
}

// Make services callable from content scripts.
exportInstance(Notifier);
exportInstance(Recap);

function setDefaultOptions(details) {
  chrome.storage.local.get("options", function(items) {
    console.debug(
      "Faster Law: Attempted to get 'options' key from local storage. Got: " +
        items
    );
    let defaults = {
      external_pdf: false,
      recap_disabled: true,
      recap_link_popups: true,
      show_notifications: true,
      enhance_doc: true,

      // Radio button
      ia_style_filenames: false,
      lawyer_style_filenames: true
    };
    if ($.isEmptyObject(items)) {
      chrome.storage.local.set({ options: defaults });
    } else {
      for (let key in defaults) {
        if (!(key in items.options)) {
          items.options[key] = defaults[key];
        }
      }
      chrome.storage.local.set({ options: items.options });
    }
  });
}

chrome.runtime.onInstalled.addListener(setDefaultOptions);

// Watches all the tabs so we can update their toolbar buttons on navigation.
chrome.tabs.onUpdated.addListener(function(tabId, details, tab) {
  updateToolbarButton(tab);
});
chrome.tabs.onActivated.addListener(function(activeInfo) {
  getTabById(activeInfo.tabId, updateToolbarButton);
});
