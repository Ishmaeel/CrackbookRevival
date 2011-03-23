/* Dim the current page for 60 seconds */

(function() { // avoid polluting the local namespace

  DIMMER_DIV_ID = '_crackbook_dimmer_';
  DIMMER_TEXT1 = "Enough junk for today, <em>don't you think?</em>";
  DIMMER_TEXT2 = "Wait one minute for the content to appear.";

  if (!document.getElementById(DIMMER_DIV_ID)) {

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
    dimmer.style.width = window.innerWidth + "px"; // TODO: handle resizing
    dimmer.style.height = document.height + "px";
    dimmer.style.top = "0px";
    dimmer.style.left = '0px';

    // Background.
    dimmer.style.background = "#001000";
    dimmer.style.opacity = "0.95";
    dimmer.style.zIndex = "99999";

    document.body.appendChild(dimmer);

    var timeoutFn = function() {
      document.body.removeChild(dimmer);
    }
    setTimeout(timeoutFn, 60000);
  }
})();
