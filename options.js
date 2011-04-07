function getTopDomains(historyItems) {
  var typedCounts = {};
  // Get URL data.
  var domains = [];
  for (var i = 0; i < historyItems.length; i++) {
    var h = historyItems[i];
    if (h.url && h.typedCount) {
      if (h.url.slice(0, 5) == 'https')
        continue; // https URLs are probably not spam
      var domain = normalizedDomain(h.url);
      domains.push(domain);
      typedCounts[domain] = h.typedCount;
    }
  }
  // Sort by typed count (descending).
  domains.sort(function(a, b) { return typedCounts[b] - typedCounts[a] });
  // Take top N.
  var topUrls = domains.slice(0, 5);
  return topUrls;
} // getTopDomains

function clearUrls() {
  var ul = document.getElementById("topVisited");
  while (ul.childNodes.length > 0)
    ul.removeChild(ul.firstChild);
}

function addUrlField(value) {
  var checkbox = document.createElement('input');
  checkbox.setAttribute('type', 'checkbox');
  checkbox.setAttribute('checked', 'checked');

  var input = document.createElement('input');
  input.setAttribute('type', 'text');
  input.value = value;

  var li = document.createElement('li');
  li.appendChild(checkbox);
  li.appendChild(input);

  var ul = document.getElementById("topVisited");
  var button_li = document.getElementById("add_domain_button").parentNode;
  // Insert field before the "add domain" button.
  ul.insertBefore(li, button_li);
}

function putDomainsOnPage(topUrls) {
  // Put on page.
  for (var i = 0; i < topUrls.length; i++) {
    var domain = normalizedDomain(topUrls[i]);
    addUrlField(domain);
  }

  // Remove placeholder, if any.
  var placeholder = document.getElementById("placeholder");
  if (placeholder)
    document.getElementById("topVisited").removeChild(placeholder);
} // putDomainsOnPage


function loadSavedUrls() {
  var junkDomains = getJunkDomains();
  putDomainsOnPage(junkDomains);
}


function loadTopUrls() {
  var weekAgo = new Date().getTime() - 1000*3600*24*7;
  chrome.history.search({ text: "", startTime: weekAgo,
                          maxResults: 1000 },
    function(historyItems) {
      var topUrls = getTopDomains(historyItems);
      setJunkDomains(topUrls);
      // Not calling submitConfigChange here to give the chance for the
      // user to clean the domain list.
      putDomainsOnPage(topUrls);
    }
  );
} // loadTopUrls()


function saveSettings() {
  /* Save settings from submitted form. */

  // Collect settings.
  var ul = document.getElementById("topVisited");

  junkDomains = [];
  for (var i = 0; i < ul.childNodes.length; i++) {
    if (ul.childNodes[i].nodeName == "LI") {
      var li = ul.childNodes[i];
      var checkbox = li.childNodes[0];
      var input = li.childNodes[1];
      if (checkbox.checked)
        junkDomains.push(normalizedDomain(input.value));
    }
  }

  var reporting = document.getElementById("upload_stats").checked;

  var dimmerThreshold = parseInt(document.getElementById("dimmerThreshold").value);
  if (!dimmerThreshold || dimmerThreshold <= 0)
    dimmerThreshold = getLocal('dimmerThreshold');

  var dimmerDelay = parseInt(document.getElementById("dimmerDelay").value);
  if (!dimmerDelay || dimmerDelay <= 0)
    dimmerDelay = getLocal('dimmerDelay');

  // TODO: better validation
  var startTime = parseTime(document.getElementById("startTime").value);
  var endTime = parseTime(document.getElementById("endTime").value);

  var weekdays = "";
  for (var i = 0; i < 7; i++)
    if (document.getElementById("weekday-" + i).checked)
      weekdays += i;

  // Save settings.
  setLocal('reporting', reporting);
  setLocal('dimmerThreshold', dimmerThreshold);
  setLocal('dimmerDelay', dimmerDelay);
  setLocal('junkDomains', junkDomains);
  setLocal('startTime', startTime);
  setLocal('endTime', endTime);
  setLocal('weekdays', weekdays);

  bgPage().submitConfigChange();

  // Show status message.
  document.getElementById('saved_message').style['display'] = 'inline';
} // saveSettings

function addNewDomain() {
  addUrlField('');
}
