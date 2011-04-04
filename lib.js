//
// Helper functions.
//

function normalizedDomain(url) {
  // 0. Trim whitespace.
  url = url.trim();
  // 1. Strip protocol.
  var p = url.indexOf('://');
  if (p > -1) {
    url = url.slice(p + '://'.length);
  }
  // 2. Strip path.
  p = url.indexOf('/');
  if (p > -1)
    domain = url.slice(0, p);
  else
    domain = url;

  // 3. Strip leading 'www'.
  if (domain.slice(0, 4) == 'www.')
    domain = domain.slice(4);

  return domain;
}

//
// Local storage functions.
//

var_defaults = {
  hitHistory: '{}',
  junkDomains: '[]',
  reporting: 'true',
  user_id: 0,
  dimmerThreshold: 50
};

function getLocal(varname) {
  if (!(varname in localStorage))
    localStorage.setItem(varname, var_defaults[varname]);
  var s = localStorage.getItem(varname);
  return JSON.parse(s);
}

function setLocal(varname, value) {
  localStorage.setItem(varname, JSON.stringify(value));
}

function getHitHistory() {
  // BBB
  return getLocal('hitHistory');
}

function setHitHistory(hist) {
  // BBB
  return setLocal('hitHistory', hist);
}

function getTodaysHits() {
  var hist = getHitHistory();
  var today = todayAsString();
  if (!hist[today])
    hist[today] = 0;
  return hist[today];
}

function getJunkDomains() {
  return getLocal('junkDomains');
}

function setJunkDomains(domains) {
  setLocal('junkDomains', domains);
}

function isJunkDomain(domain) {
  var junkDomains = getJunkDomains();
  for (var i = 0; i < junkDomains.length; i++)
    if (domain == junkDomains[i])
      return true;
  return false;
}

function bgPage() {
  return chrome.extension.getBackgroundPage();
}
