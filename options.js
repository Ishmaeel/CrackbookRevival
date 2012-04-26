var TOP_DOMAINS_NUM = 6;
var MSG_SAVED_DELAY = 2*1000;

function getTopDomains(historyItems) {
  var typedCounts = {};
  // Get URL data.
  var domains = [];
  for (var i = 0; i < historyItems.length; i++) {
    var h = historyItems[i];
    if (h.url && h.typedCount) {
      if (h.url.slice(0, 5) == 'https')
        continue; // https URLs are probably not junk

      var url = trimWWW(trimProtocol(h.url.trim()));
      var domain = trimPath(url);

      // Special case for Google Reader.
      // TODO: test me
      var components = url.split('/');
      if (components.length > 1 && components[0].indexOf('google.') != -1 && components[1] == 'reader') {
        domain = components[0] + '/' + components[1];
      }

      domains.push(domain);
      typedCounts[domain] = h.typedCount;
    }
  }
  // Sort by typed count (descending).
  domains.sort(function(a, b) { return typedCounts[b] - typedCounts[a] });
  // Take top N.
  var topUrls = domains.slice(0, TOP_DOMAINS_NUM);
  return topUrls;
} // getTopDomains

function clearUrls() {
  var ul = document.getElementById("siteBlacklist");
  while (ul.childNodes.length > 0)
    ul.removeChild(ul.firstChild);
}

function addUrlField(ulId, value) {
  var checkbox = document.createElement('input');
  checkbox.setAttribute('type', 'checkbox');
  checkbox.setAttribute('checked', 'checked');

  var input = document.createElement('input');
  input.setAttribute('type', 'text');
  input.setAttribute('class', 'domain');
  input.value = value;

  var li = document.createElement('li');
  li.setAttribute('class', 'domain');
  li.appendChild(checkbox);
  li.appendChild(input);

  var ul = document.getElementById(ulId);
  var button_li = ul.children[ul.children.length - 1];
  // Insert field before the "add domain" button.
  ul.insertBefore(li, button_li);
}

function clearDomainsFromPage(ulId) {
  var ul = document.getElementById(ulId);
  for (var i = ul.children.length-1; i >= 0; i--) {
    var li = ul.children[i];
    if (li.getAttribute('class') == 'domain')
      ul.removeChild(li);
  }
}

function putDomainsOnPage(ulId, placeholderId, domains) {
  // Put on page.
  for (var i = 0; i < domains.length; i++) {
    addUrlField(ulId, domains[i]);
  }

  // Remove placeholder, if any.
  var placeholder = document.getElementById(placeholderId);
  if (placeholder) {
    document.getElementById(ulId).removeChild(placeholder);
  }
} // putDomainsOnPage


function loadSavedUrls() {
  putDomainsOnPage("siteBlacklist", "blacklistPlaceholder", getLocal("junkDomains"));
}

function loadTopUrls() {
  var weekAgo = new Date().getTime() - 1000*3600*24*7;
  chrome.history.search({ text: "", startTime: weekAgo,
                          maxResults: 1000 },
    function(historyItems) {
      var topUrls = getTopDomains(historyItems);
      setLocal('junkDomains', topUrls);
      // Not calling submitConfigChange here to give the chance for the
      // user to clean the domain list.
      putDomainsOnPage("siteBlacklist", "blacklistPlaceholder", topUrls);
    }
  );
} // loadTopUrls()


function bindControlHandlers() {
  document.getElementById('add_domain_button').onclick = addNewDomain;
  document.getElementById('save_button').onclick = saveSettings;
  document.getElementById('crackbookLink').onclick = function() {
    chrome.tabs.create({url: 'http://crackbook.info'});
  }
}


function showSettings() {
  // Threshold & delay
  document.getElementById("dimmerThreshold").value = getLocal('dimmerThreshold');
  document.getElementById("dimmerDelay").value = getLocal('dimmerDelay').toFixed(2);
  document.getElementById("dimmerDelayGrowthPercent").value = getLocal('dimmerDelayGrowthPercent').toFixed(1);
  document.getElementById("dimmerTransparent").value = getLocal('dimmerTransparent');

  // Junk domains.
  clearDomainsFromPage('siteBlacklist');
  if (getLocal('junkDomains').length == 0) {
    loadTopUrls();
  } else {
    loadSavedUrls();
  }

  // Schedule
  document.getElementById("startTime").value = renderTime(getLocal('startTime'));
  document.getElementById("endTime").value = renderTime(getLocal('endTime'));

  var currentWeekdays = getLocal('weekdays');
  for (var i = 0; i < 7; i++) {
    document.getElementById("weekday-" + i).checked = currentWeekdays.indexOf("" + i) != -1;
  }

  // Reporting
  if (getLocal('reporting'))
    document.getElementById("upload_stats").checked = true;
}


function saveSettings() {
  /* Save settings from submitted form. */

  // Junk domains
  var ul = document.getElementById("siteBlacklist");
  junkDomains = [];
  for (var i = 0; i < ul.childNodes.length; i++) {
    if (ul.childNodes[i].nodeName == "LI") {
      var li = ul.childNodes[i];
      var checkbox = li.childNodes[0];
      var input = li.childNodes[1];
      if (checkbox.checked && input.value.indexOf('.') != -1) {
        var url = trimWWW(trimProtocol(input.value.trim()));
        junkDomains.push(url);
      }
    }
  }

  // Threshold & delay
  var dimmerThreshold = parseInt(document.getElementById("dimmerThreshold").value);
  if (isNaN(dimmerThreshold) || dimmerThreshold < 0) {
    dimmerThreshold = getLocal('dimmerThreshold');
  }

  var dimmerDelay = parseFloat(document.getElementById("dimmerDelay").value);
  if (isNaN(dimmerDelay) || dimmerDelay < 0) {
    dimmerDelay = getLocal('dimmerDelay');
  }

  var dimmerDelayGrowthPercent = parseFloat(document.getElementById("dimmerDelayGrowthPercent").value);
  if (isNaN(dimmerDelayGrowthPercent) || dimmerDelayGrowthPercent < 0) {
    dimmerDelayGrowthPercent = getLocal('dimmerDelayGrowthPercent');
  }

  var dimmerTransparent = document.getElementById("dimmerTransparent").checked;

  // TODO: better validation
  var startTime = parseTime(document.getElementById("startTime").value);
  var endTime = parseTime(document.getElementById("endTime").value);

  var weekdays = "";
  for (var i = 0; i < 7; i++)
    if (document.getElementById("weekday-" + i).checked)
      weekdays += i;

  var reporting = document.getElementById("upload_stats").checked;

  // Write settings to storage.
  setLocal('reporting', reporting);
  setLocal('dimmerThreshold', dimmerThreshold);
  setLocal('dimmerDelay', dimmerDelay);
  setLocal('dimmerDelayGrowthPercent', dimmerDelayGrowthPercent);
  setLocal('dimmerTransparent', dimmerTransparent);
  setLocal('junkDomains', junkDomains);
  setLocal('startTime', startTime);
  setLocal('endTime', endTime);
  setLocal('weekdays', weekdays);

  bgPage().submitConfigChange();
  bgPage().updateIcon(null, true);

  // Re-render saved settings so that invalid settings can be seen.
  showSettings();

  // Show status message.
  var msg = document.getElementById('saved_message');
  msg.style['display'] = 'inline';
  window.setTimeout(function() {
    msg.style.display = 'none';
    window.close();
  }, MSG_SAVED_DELAY);

} // saveSettings


function addNewDomain() {
  addUrlField('');
}


window.onload = function() {
  bindControlHandlers();
  showSettings();
}


// Google Analytics
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-6080477-5']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();
