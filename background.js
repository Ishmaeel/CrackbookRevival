var HITNUM_FONT = '12px Arial Bold';
var HITNUM_COLOR = "rgb(255,255,255)";
var HITNUM_POS_X = 3;
var HITNUM_POS_Y = 12;
var NOTIFICATION_THRESHOLD = 20;
var NOTIFICATION_HIT_INTERVAL = 10;
var DIMMER_THRESHOLD = 50;

var NOTIFICATION_OBJ = webkitNotifications.createNotification(
        'images/Hamburger-128px.png',
        'Time to get back to work!',
        "");

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

// Returns today's date as an ISO8601 string (e.g., 2011-03-04)
function todayAsString() {
  return new Date().toISOString().slice(0, 10);
}

function historyVisitedHandler(histItem) {
  if (!histItem.url)
    return;
  var domain = normalizedDomain(histItem.url);
  if (isJunkDomain(domain))
    hit(domain);
}

function updateIcon(inJunk) {
  // TODO: store current state, do not change unnecessarily
  // TODO: animate transition
  if (inJunk)
    drawIcon("hamburger-19px.png");
  else
    drawIcon("carrot-19px.png");
}

function tabUpdatedHandler(tabId, changeInfo, tab) {
  var isJunk = isJunkDomain(normalizedDomain(tab.url))
  updateIcon(isJunk);
  if (isJunk && getTodaysHits() > DIMMER_THRESHOLD)
    dim(tabId);
}

function tabSelectionChangedHandler(tabId, selectInfo) {
  chrome.tabs.get(tabId, function(tab) {
    updateIcon(isJunkDomain(normalizedDomain(tab.url)));
  });
}

function hit(domain) {
  // Get number of hits today.
  var hist = getHitHistory();
  var today = todayAsString();
  if (!hist[today])
    hist[today] = 0;
  hist[today] += 1;

  // Save incremented hit.
  setHitHistory(hist);
  
  // TODO: store hit on associated domain
  var hits = hist[today];

  chrome.browserAction.setBadgeText({text: "" + hits});
  setTimeout("chrome.browserAction.setBadgeText({text: ''})", 3000);

  if (hits < DIMMER_THRESHOLD && hits > NOTIFICATION_THRESHOLD
      && (hits % NOTIFICATION_HIT_INTERVAL == 0)) {
    // If hits >= DIMMER_THRESHOLD, the notification need not be shown any
    // more.
    NOTIFICATION_OBJ.show(); // TODO: check if repeated notifications work
    window.setTimeout('NOTIFICATION_OBJ.cancel()', 3000);
  }
}

function dim(tabId) {
  chrome.tabs.executeScript(tabId, { file: "dimmer.js" });
}

function initIcon() {
  // TODO: check the current tab
  updateIcon(false);
}

function initExtension() {
  chrome.history.onVisited.addListener(historyVisitedHandler);
  chrome.tabs.onUpdated.addListener(tabUpdatedHandler);
  chrome.tabs.onSelectionChanged.addListener(tabSelectionChangedHandler);
  initIcon();
}
