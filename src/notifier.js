// Public impure functions.  (See utils.js for details on defining services.)
function Notifier() {
  var showNotification = function(title, message, cb) {
    console.info(
      "FasterLaw: Running showNotification function. Expect a notification."
    );
    var notificationOptions = {
      type: "basic",
      title: title,
      message: message,
      iconUrl: chrome.extension.getURL("assets/images/icon-0128.png"),
      priority: 0
    };
    var notificationID = "faterlaw_notification";
    chrome.notifications.create(notificationID, notificationOptions, cb);
    // Make it go away when clicked.
    chrome.notifications.onClicked.addListener(function(notificationID) {
      chrome.notifications.clear(notificationID, function() {});
    });
  };
  return {
    // Shows a desktop notification for a few seconds (length depends on priority)
    show: function(title, message, cb) {
      showNotification(title, message, cb);
    },
    // Shows an upload message if upload notifications are enabled.
    showUpload: function(message, cb) {
      chrome.storage.local.get("options", function(items) {
        if (items.options.show_notifications) {
          showNotification("FasterLaw upload", message, cb);
        }
      });
    },
    // Shows a login status message if login status notifications are enabled.
    showStatus: function(active, message, cb) {
      chrome.storage.local.get("options", function(items) {
        if (items.options.show_notifications) {
          showNotification(
            active ? "FasterLaw is active" : "FasterLaw is inactive",
            message,
            cb
          );
        }
      });
    }
  };
}
