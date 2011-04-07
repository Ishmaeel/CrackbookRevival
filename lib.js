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
  user_id: '0',
  dimmerThreshold: '20',
  dimmerDelay: '30',
  startTime: '480',
  endTime: '1080',
  weekdays: '"12345"'
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

function lzero(x) {
  // Add a leading zero to a number.
  return x > 9 ? x : '0' + x;
}

function renderTime(minutes) {
  return lzero((Math.floor(minutes / 60))) + ':' + lzero(minutes % 60);
}

function parseTime(s) {
  var components = s.split(':');
  var hr = parseInt(components[0], 10) | 0;
  if (hr < 0 || hr >= 24) hr = 0;
  var min = parseInt(components[1], 10) | 0;
  if (min < 0 || min >= 60) hr = 0;
  var r = hr * 60 + min;
  if (r >= 60*24)
    r = 0;
  return r;
}
