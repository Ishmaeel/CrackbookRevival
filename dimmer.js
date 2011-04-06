/* Dim the current page for 30 seconds */

(function() { // avoid polluting the local namespace

  DIMMER_DIV_ID = '_crackbook_dimmer_';
  DIMMER_TEXT1 = "Enough junk for today, don't you think?";
  DIMMER_TEXT2 = "Wait %d seconds for the content to appear.";
  DIMMER_TEXT3 = "Stay on the page. The timer restarts if you switch away from this tab.";

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

  function setTimer(dimmer) {
    // Clear old timer.
    var timerIdInput = document.getElementById(DIMMER_DIV_ID + "timerId");
    if (timerIdInput) {
      timerId = parseInt(timerIdInput.value);
      clearTimeout(timerId);
    }

    // Set timer.
    var timerId = setTimeout(timeoutFn, _dimmer_delay_ * 1000);

    // Store timer ID.
    if (!timerIdInput) {
      var timerIdInput = document.createElement("input");
      timerIdInput.id = DIMMER_DIV_ID + "timerId";
      timerIdInput.type = "hidden";
      dimmer.appendChild(timerIdInput);
    }
    timerIdInput.value = timerId;
  }

  function maximizeDimmer(dimmer) {
    if (dimmer.style.display != 'none') {
      // Grow dimmer to the size of the document.
      dimmer.style.width = window.innerWidth + "px";
      dimmer.style.height = document.height + "px";
      // Make sure that if the document changes size in the future,
      // the dimmer will be resized too.
      setTimeout(function() { maximizeDimmer(dimmer); }, 1000);
    }
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
    dimmer.appendChild(text1);

    var text2 = document.createElement("div");
    text2.innerHTML = DIMMER_TEXT2.replace('%d', _dimmer_delay_);
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
    dimmer.style.position = "absolute";
    dimmer.style.top = "0px";
    dimmer.style.left = "0px";

    // Background.
    dimmer.style.background = "#001000";
    dimmer.style.opacity = "0.95";
    dimmer.style.zIndex = "99999";

    document.body.insertBefore(dimmer, document.body.firstChild);

    maximizeDimmer(dimmer);

    return dimmer;
  }

  // Actions

  function create(dimmer_el) {
    if (!dimmer_el) {
      var dimmer = addDimmer();
      setTimer(dimmer);
    }
  }

  function create_suspended(dimmer_el) {
    if (!dimmer_el) {
      var dimmer = addDimmer();
    }
  }

  function suspend(dimmer_el) {
    if (dimmer_el) {
      clearTimer(dimmer_el);
    }
  }

  function resume(dimmer_el) {
    if (dimmer_el && dimmer_el.style.display != "none") {
      setTimer(dimmer_el);

      var text3 = document.getElementById(DIMMER_DIV_ID + 'stayput');
      text3.style.display = "block";
    }
  }

  // Dispatch by action name.

  var action_fns = {
    create: create,
    suspend: suspend,
    resume: resume,
    create_suspended: create_suspended
  };

  var action_fn = action_fns[_dimmer_action_];

  var dimmer_el = document.getElementById(DIMMER_DIV_ID);
  action_fn(dimmer_el);

  delete _dimmer_action_;
  delete _dimmer_delay_;

})();
