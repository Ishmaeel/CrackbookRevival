/* Dim the current page for 30 seconds */

(function() { // avoid polluting the local namespace

  DIMMER_DIV_ID = '_crackbook_dimmer_';
  DIMMER_TEXT1 = "Enough junk for today, don't you think?";
  DIMMER_TEXT2 = "Wait half a minute for the content to appear.";
  DIMMER_DELAY = 30 * 1000;

  var timeoutFn = function() {
    var dimmer = document.getElementById(DIMMER_DIV_ID);
    dimmer.style.display = "none";
    // Disable the dimmer, and do not dim this page again.
  }

  function setTimer(dimmer) {
    // Clear old timer.
    var timerIdInput = document.getElementById(DIMMER_DIV_ID + "timerId");
    if (timerIdInput) {
      timerId = parseInt(timerIdInput.value);
      clearTimeout(timerId);
    }

    // Set timer.
    var timerId = setTimeout(timeoutFn, DIMMER_DELAY);

    // Store timer ID.
    if (!timerIdInput) {
      var timerIdInput = document.createElement("input");
      timerIdInput.id = DIMMER_DIV_ID + "timerId";
      timerIdInput.type = "hidden";
      dimmer.appendChild(timerIdInput);
    }
    timerIdInput.value = timerId;
  }

  function addDimmer() {
    var dimmer = document.createElement('div');
    dimmer.id = DIMMER_DIV_ID;

    // TODO: add a picture

    // Message
    dimmer.style.color = "#ffffff";
    dimmer.style.paddingTop = window.innerHeight / 2 - 30 + "px";
    dimmer.style.fontSize = '30px';

    var text1 = document.createElement("div");
    text1.innerHTML = DIMMER_TEXT1;
    text1.style.textAlign = "center";

    var text2 = document.createElement("div");
    text2.innerHTML = DIMMER_TEXT2;
    text2.style.textAlign = "center";
    text2.style.paddingTop = "50px";
    text2.style.fontSize = "20px";

    dimmer.appendChild(text1);
    dimmer.appendChild(text2);

    // Positioning.
    dimmer.style.position = 'absolute';
    dimmer.style.width = window.innerWidth + "px"; // TODO: handle window resizing
    dimmer.style.height = document.height + "px"; // TODO: handle height changes
    dimmer.style.top = "0px";
    dimmer.style.left = '0px';

    // Background.
    dimmer.style.background = "#001000";
    dimmer.style.opacity = "0.95";
    dimmer.style.zIndex = "99999";

    document.body.appendChild(dimmer);
    setTimer(dimmer);
  }

  var dimmer_el = document.getElementById(DIMMER_DIV_ID);
  if (!dimmer_el) {
    addDimmer();
  } else {
    if (dimmer_el.style.display != "none") // dimmer not removed yet
      setTimer(dimmer_el);
  }
})();
