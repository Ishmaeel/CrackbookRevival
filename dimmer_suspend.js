(function() { // avoid polluting the local namespace

  DIMMER_DIV_ID = '_crackbook_dimmer_';

  function clearTimer(dimmer) {
    // Clear old timer.
    var timerIdInput = document.getElementById(DIMMER_DIV_ID + "timerId");
    if (timerIdInput) {
      timerId = parseInt(timerIdInput.value);
      clearTimeout(timerId);
      dimmer.removeChild(timerIdInput);
    }
  }

  var dimmer_el = document.getElementById(DIMMER_DIV_ID);
  if (dimmer_el) {
    clearTimer(dimmer_el);
  }

})();
