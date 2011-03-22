function getTopUrls(historyItems) {
  var typedCounts = {};
  // Get URL data.
  var urls = [];
  for (var i = 0; i < historyItems.length; i++) {
    var h = historyItems[i];
    if (h.url && h.typedCount) {
      // TODO: filter https (probably not spam)
      urls.push(h.url);
      typedCounts[h.url] = h.typedCount;
    }
  }
  // Sort by typed count (descending).
  urls.sort(function(a, b) { return typedCounts[b] - typedCounts[a] });
  // Take top N.
  var topUrls = urls.slice(0, 5);
  return topUrls;
} // getTopUrls

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

function putUrlsOnPage(topUrls) {
  // Put on page.
  for (var i = 0; i < topUrls.length; i++) {
    var url = topUrls[i];
    var domain = normalizedDomain(url);
    addUrlField(domain);
  }

  // Remove placeholder, if any.
  var placeholder = document.getElementById("placeholder");
  if (placeholder)
    document.getElementById("topVisited").removeChild(placeholder);
} // putUrlsOnPage


function loadSavedUrls() {
  var junkDomains = getJunkDomains();
  putUrlsOnPage(junkDomains);
}


function loadTopUrls() {
  var weekAgo = new Date().getTime() - 1000*3600*24*7;
  chrome.history.search({ text: "", startTime: weekAgo,
                          maxResults: 1000 },
    function(historyItems) {
      var topUrls = getTopUrls(historyItems);
      putUrlsOnPage(topUrls);
    }
  );
} // loadTopUrls()


function saveSettings() {
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
  setJunkDomains(junkDomains);

  // Show status message.
  document.getElementById('saved_message').style['display'] = 'block';
} // saveSettings

function addNewDomain() {
  addUrlField('');
}
