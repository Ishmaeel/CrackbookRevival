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
  document.getElementById("topVisited").appendChild(li);
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

  // Save settings.
  setLocal('reporting', reporting);
  setLocal('junkDomains', junkDomains);
  bgPage().registerConfigChange(domains);

  // Show status message.
  document.getElementById('saved_message').style['display'] = 'block';
} // saveSettings

function addNewDomain() {
  addUrlField('');
}
