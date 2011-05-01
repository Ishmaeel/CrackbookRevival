var HITNUM_FONT = '12px Arial Bold';
var HITNUM_COLOR = "rgb(255,255,255)";
var HITNUM_POS_X = 3;
var HITNUM_POS_Y = 12;
var NOTIFICATION_TEXT = 'Time to get back to work!';
var API_URL = 'http://crackbook.info/api/';

// TODO: the following should be configurable

var NOTIFICATION_THRESHOLD = 5;
var NOTIFICATION_HIT_INTERVAL = 5;

function drawIcon(img_name) {
  img_path = "images/" + img_name;
  chrome.browserAction.setIcon({ path: img_path });
} // drawIcon

function drawTextOnBg(canvas, image, value) {
  var ctx = canvas.getContext('2d');

  ctx.drawImage(image, 0, 0);

  ctx.font = HITNUM_FONT;
  ctx.fillStyle = HITNUM_COLOR;
  ctx.fillText("" + value, HITNUM_POS_X, HITNUM_POS_Y);

  var imageData = ctx.getImageData(0, 0, 19, 19);
  chrome.browserAction.setIcon({imageData: imageData});
} // drawTextOnBg

var iconState = null;

function updateIcon(active, inJunk) {
  if (active == null) // null or undefined
    active = extensionActive();
  if (inJunk == null) { // null or undefined
    chrome.tabs.getSelected(null, function(selectedTab) {
      var junkDomain = lookupJunkDomain(selectedTab.url);
      updateIcon(active, !!junkDomain);
    });
    return;
  }

  var newIcon = null;

  newIcon = inJunk ? 'hamburger' : 'carrot';
  if (!active)
    newIcon += '-inactive';
  newIcon += '-19px.png';
    
  if (iconState != newIcon) {
    iconState = newIcon;
    drawIcon(newIcon);
  }
}

function extensionActive() {
  var now = new Date();
  // Check weekday.
  if (getLocal('weekdays').indexOf("" + now.getDay()) == -1)
    return false;
  // Check time.
  var nowMins = parseTime(now.getHours() + ":" + now.getMinutes());
  var startTime = getLocal('startTime');
  var endTime = getLocal('endTime');
  if (startTime <= endTime) {
    return (startTime <= nowMins) && (nowMins <= endTime);
  } else {
    // Handle the case when, e.g. the end time is in the night (14:00-3:00).
    return (startTime <= nowMins) || (nowMins <= endTime);
  }
}

function shouldDimPage() {
  return getTodaysHits() > getLocal('dimmerThreshold');
}

function toQueryString(obj) {
  // Convert an object to a query string.
  var components = [];
  for (k in obj) {
    var v = obj[k];
    components.push(k + '=' + encodeURIComponent(v));
  }
  return components.join('&');
}

function ajaxPost(url, fields) {
  fields['user_id'] = getLocal('user_id');
  fields['timestamp'] = new Date().valueOf();
  var xhr = new XMLHttpRequest();
  xhr.open("POST", url, true);
  xhr.send(toQueryString(fields));
}

function registerHit(domain, blocked, active) {
  var params = {domain: domain, blocked: blocked, active: active};
  if (getLocal('reporting'))
    ajaxPost(API_URL + 'register_hit', params);
}

function submitConfigChange() {
  if (getLocal('reporting'))
    ajaxPost(API_URL + 'register_configuration', {
        domains: JSON.stringify(getLocal('junkDomains')),
        dimmer_threshold: getLocal('dimmerThreshold'),
        dimmer_delay: getLocal('dimmerDelay'),
        start_time: getLocal('startTime'),
        end_time: getLocal('endTime'),
        weekdays: getLocal('weekdays')
    });
}

/*
 * Dimmer state transitions for junk pages
 *
 * onTabUpdated:
 *  - tab active --> enable dimmer
 *  - tab inactive --> enable dimmer, suspend timer
 *
 * onTabSelectionChanged:
 *  - previous tab is junk -> suspend timer on previous tab
 *  - new tab is junk -> restart timer on new tab
 *
 * onWindowFocusChanged:
 *  - suspend timer on previous tab
 *  - restart timer on active tab
 *
 */

var lastDimmedTabId = null;

function tabUpdatedHandler(tabId, changeInfo, tab) {
  // In practice events seem to always come in doubles, 'loading' and
  // 'complete'. Here the intent is to eliminate the duplicates under the
  // assumption that a 'complete' update always follows a 'loading' update.
  if (changeInfo.status == 'complete')
    return;

  var junkDomain = lookupJunkDomain(tab.url);
  var active = extensionActive();
  var shouldDim = shouldDimPage();
  updateIcon(active, !!junkDomain);

  if (junkDomain) {
    if (active) {
      // Do not increment the counter if the extension is not active.
      incrementJunkCounter(junkDomain);
    }
    registerHit(junkDomain, shouldDim, active);
    if (active && shouldDim) {
      chrome.tabs.getSelected(null, function(selectedTab) {
        var tabIsActive = selectedTab.id == tabId;
        if (tabIsActive)
          lastDimmedTabId = tabId;
        invokeDimmer(tabId, tabIsActive ? "create" : "create_suspended");
      });
    }
  }
}

function tabSelectionChangedHandler(tabId, selectInfo) {
  if (lastDimmedTabId) {
    invokeDimmer(lastDimmedTabId, "suspend");
    lastDimmedTabId = null;
  }

  chrome.tabs.get(tabId, function(tab) {
    var junkDomain = lookupJunkDomain(tab.url);
    updateIcon(null, !!junkDomain);
    if (junkDomain && shouldDimPage()) {
      invokeDimmer(tabId, "resume");
      lastDimmedTabId = tabId;
    }
  });
}

function windowFocusChangedHandler(windowId) {
  if (lastDimmedTabId) {
    invokeDimmer(lastDimmedTabId, "suspend");
    lastDimmedTabId = null;
  }

  if (windowId != chrome.windows.WINDOW_ID_NONE) {
    chrome.tabs.getSelected(windowId, function(tab) {
      var junkDomain = lookupJunkDomain(tab.url);
      updateIcon(null, !!junkDomain);
      if (junkDomain && shouldDimPage()) {
        invokeDimmer(tab.id, "resume");
        lastDimmedTabId = tab.id;
      }
    });
  }
}

function showNotification() {
  var notification_obj = webkitNotifications.createNotification(
          'images/hamburger-128px.png',
          NOTIFICATION_TEXT,
          "");
  notification_obj.show();
  window.setTimeout(function() { notification_obj.cancel() }, 3000);
}

function incrementJunkCounter(domain) {
  var today = todayAsString();
  var day = getLocal('day');
  var hits = getLocal('dayHits');
  if (day == today) {
    hits += 1;
  } else {
    setLocal('day', today);
    hits = 1;
  }
  setLocal('dayHits', hits);

  chrome.browserAction.setBadgeText({text: "" + hits});
  setTimeout(function() { chrome.browserAction.setBadgeText({text: ''}) },
      3000);

  // Show notification if needed.
  if (hits > NOTIFICATION_THRESHOLD
      && (hits % NOTIFICATION_HIT_INTERVAL == 0))
    // If hits >= dimmerThreshold, the notification is not needed any
    // more as the dimmer kicks in.
    if (hits < getLocal('dimmerThreshold'))
      showNotification();
}

function invokeDimmer(tabId, action) {
  // Dim the page and start (or restart) the timer.
  //
  // Actions:
  // - "create": a dimmer is created on the page if it is not already there and a timer is started
  // - "create_suspended": a dimmer is created on the page if it is not already there, no timer is started
  // - "suspend": the countdown is suspended if there is a dimmer on the page
  // - "resume": the countdown is resumed if there is a dimmer on the page

  // TODO: just pass a JSON dictionary
  var primer_code = ("var _dimmer_action_ = '" + action + "';" +
                  " var _dimmer_delay_ = " + getLocal('dimmerDelay') + ";");
  chrome.tabs.executeScript(tabId, { code: primer_code }, function() {
    // Set desired action and then invoke the script.
    chrome.tabs.executeScript(tabId, { file: "dimmer.js" });
  });
}

function initIcon() {
  updateIcon(null, false);
}

function initUserID() {
  var user_id = getLocal('user_id');
  if (user_id == 0)
    setLocal('user_id', Math.floor(Math.random() * 256*256*256*127));
}

function initExtension() {
  initUserID();
  chrome.tabs.onUpdated.addListener(tabUpdatedHandler);
  chrome.tabs.onSelectionChanged.addListener(tabSelectionChangedHandler);
  chrome.windows.onFocusChanged.addListener(windowFocusChangedHandler);
  initIcon();

  if (getLocal('junkDomains').length == 0)
    chrome.tabs.create({ url: "options.html" });
}
