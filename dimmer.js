var BODY_POLL_MS = 30;
var DIMMER_DIV_ID = '_crackbook_dimmer_';
var DIMMER_TEXT1 = "Enough junk for today, don't you think?";
var DIMMER_TEXT2 = "Wait %d seconds for the content to appear.";
var DIMMER_TEXT3 = "The timer restarts if you switch away from this tab.";

var timeoutFn = function() {
  var dimmer = document.getElementById(DIMMER_DIV_ID);
  dimmer.style.display = "none";
  // Disable the dimmer, and do not dim this page again.
}

function clearTimer(dimmer) {
  // Clear old timer.
  var timerIdInput = document.getElementById(DIMMER_DIV_ID + "timerId");
  if (timerIdInput) {
    timerId = parseInt(timerIdInput.value);
    clearTimeout(timerId);
    dimmer.removeChild(timerIdInput);
  }
}

function setTimer(dimmer, delay) {
  // Clear old timer.
  var timerIdInput = document.getElementById(DIMMER_DIV_ID + "timerId");
  if (timerIdInput) {
    timerId = parseInt(timerIdInput.value);
    clearTimeout(timerId);
  }

  // Set timer.
  var timerId = setTimeout(timeoutFn, delay * 1000);

  // Store timer ID.
  if (!timerIdInput) {
    var timerIdInput = document.createElement("input");
    timerIdInput.id = DIMMER_DIV_ID + "timerId";
    timerIdInput.type = "hidden";
    dimmer.appendChild(timerIdInput);
  }
  timerIdInput.value = timerId;
}

function addDimmer(delay, appearance) {
  var dimmer = document.createElement('div');
  dimmer.id = DIMMER_DIV_ID;

  // TODO: add a picture

  // Message
  dimmer.style.color = "#ffffff";
  dimmer.style.paddingTop = window.innerHeight / 2 - 30 + "px";
  dimmer.style.fontSize = '36px';
  dimmer.style.fontFamily = 'Georgia';
  dimmer.style.fontVariant = 'normal';

  var text1 = document.createElement("div");
  text1.innerHTML = DIMMER_TEXT1;
  text1.style.textAlign = "center";
  dimmer.appendChild(text1);

  var text2 = document.createElement("div");
  text2.innerHTML = DIMMER_TEXT2.replace('%d', delay);
  text2.style.textAlign = "center";
  text2.style.paddingTop = "50px";
  text2.style.fontSize = "20px";
  dimmer.appendChild(text2);

  var text3 = document.createElement("div");
  text3.innerHTML = DIMMER_TEXT3;
  text3.id = DIMMER_DIV_ID + 'stayput';
  text3.style.display = "none";
  text3.style.textAlign = "center";
  text3.style.paddingTop = "10px";
  text3.style.fontSize = "14px";
  text3.style.color = "#aaaaaa";
  dimmer.appendChild(text3);

  // Positioning.
  dimmer.style.position = "fixed";
  dimmer.style.top = "0px";
  dimmer.style.left = "0px";
  dimmer.style.width = "100%";
  dimmer.style.height = "100%";

  // Background.
  dimmer.style.background = "#001000";
  if (appearance && appearance.transparent) {
    dimmer.style.opacity = "0.95";
  }
  dimmer.style.zIndex = "99999";

  document.body.insertBefore(dimmer, document.body.firstChild);

  return dimmer;
}

// Actions

function create(dimmer_el, delay, appearance) {
  if (!dimmer_el) {
    var dimmer = addDimmer(delay, appearance);
    setTimer(dimmer, delay);
  }
}

function create_suspended(dimmer_el, delay, appearance) {
  if (!dimmer_el) {
    var dimmer = addDimmer(delay, appearance);
  }
}

function suspend(dimmer_el, delay) {
  if (dimmer_el) {
    clearTimer(dimmer_el);
  }
}

function resume(dimmer_el, delay) {
  if (dimmer_el && dimmer_el.style.display != "none") {
    setTimer(dimmer_el, delay);

    var text3 = document.getElementById(DIMMER_DIV_ID + 'stayput');
    text3.style.display = "block";
  }
}

/* Dims the current page for a given time in seconds

   'action' is one of the following:
     - "create": a dimmer is created on the page if it is not already there and a timer is started
     - "create_suspended": a dimmer is created on the page if it is not already there, no timer is started
     - "suspend": the countdown is suspended if there is a dimmer on the page, no-op otherwise
     - "resume": the countdown is resumed if there is a dimmer on the page, no-op otherwise
   
   'delay' is delay time in seconds.
 */
function dim(action, delay, appearance) {
  // Dispatch by action name.
  var action_fns = {
    create: create,
    suspend: suspend,
    resume: resume,
    create_suspended: create_suspended
  };

  var action_fn = action_fns[action];

  var dimmer_el = document.getElementById(DIMMER_DIV_ID);
  action_fn(dimmer_el, delay, appearance);
}

/* Forwarder function for calls using executeScript() */
function invoke_dimmer(args) {
  console.debug(args);
  dim(args.action, args.delay, args.appearance);
}

// On initial load, check if this page is supposed to be dimmed.
chrome.extension.sendRequest({}, function(response) {
  if (response.should_dim) {
    function delayedDimmerFn() {
      if (document.body != null) {
        // The body of the document has started loading, the dimmer can be shown.
        invoke_dimmer(response);
      } else {
        // The body is not yet available.
        setTimeout(delayedDimmerFn, BODY_POLL_MS);
      }
    }
    // Start polling.
    delayedDimmerFn();
  }
});
