(function() {
  let currentVersion = chrome.runtime.getManifest().version;
  window.postMessage(
    {
      sender: "recap-extension",
      message_name: "version",
      message: currentVersion
    },
    "*"
  );
})();
