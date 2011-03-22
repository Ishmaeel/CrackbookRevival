var HITNUM_FONT = '12px Arial Bold';
var HITNUM_COLOR = "rgb(255,255,255)";
var HITNUM_POS_X = 3;
var HITNUM_POS_Y = 12;
var NOTIFICATION_THRESHOLD = 20;
var NOTIFICATION_HIT_INTERVAL = 10;

var NOTIFICATION_OBJ = webkitNotifications.createNotification(
        'images/Hamburger-128px.png',
        'Time to get back to work!',
        "");

function drawIcon(value) {
  var canvas = document.getElementById("iconCanvas");
  
  var image = new Image();
  image.src = "images/hamburger.png";
  image.onload = function() { drawTextOnBg(canvas, image, value); };
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

// Returns today's date as an ISO8601 string (2011-03-04)
function todayAsString() {
  return new Date().toISOString().slice(0, 10);
}

function onVisitedHandler(histItem) {
  if (!histItem.url)
    return;
  var domains = getJunkDomains();
  for (var i = 0; i < domains.length; i++) {
    if (histItem.url.indexOf(domains[i]) == 0) {
      hit(domains[i]);
      return;
    }
  }
}

function hit(domain) {
  // Update icon.
  var hist = getHitHistory();
  var today = todayAsString();
  if (!hist[today])
    hist[today] = 0;
  hist[today] += 1;
  setHitHistory(hist); // Save incremented hit.
  drawIcon(hist[today]);

  // TODO: store hit on associated domain

  // Show notification if needed.
  if (hist[today] > NOTIFICATION_THRESHOLD
      && (hist[today] % NOTIFICATION_HIT_INTERVAL == 0)) {
    NOTIFICATION_OBJ.show(); // TODO: check if repeated notifications work
  }

  // TODO: disable page for 30 to 60 seconds
}

function initExtension() {
  chrome.history.onVisited.addListener(onVisitedHandler);
  initIcon();
}


