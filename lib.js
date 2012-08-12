var DAY_STARTING_HOUR = 6; // AM

//
// Helper functions.
//

function trimProtocol(url) {
  var p = url.indexOf('://');
  if (p > -1) {
    url = url.slice(p + '://'.length);
  }
  return url;
}

function trimWWW(url) {
  if (url.slice(0, 4) == 'www.')
    url = url.slice(4);
  return url;
}

function trimPath(url) {
  p = url.indexOf('/');
  if (p > -1)
    domain = url.slice(0, p);
  else
    domain = url;
  return domain;
}

// Returns today's date as an ISO8601 string (e.g., 2011-03-04)
function todayAsString() {
  var now = new Date();
  var dt = new Date(now - DAY_STARTING_HOUR * 3600 * 1000);
  return dt.getFullYear() + "-" + lzero(dt.getMonth() + 1) + "-" + lzero(dt.getDate());
}

//
// Local storage functions.
//

var_defaults = {
  junkDomains: '[]',
  valueSites: '["ocw.mit.edu"]',
  reporting: 'true',
  checkActiveTab: 'true',
  user_id: '0',
  dimmerThreshold: '0',
  dimmerDelay: '3.0',
  dimmerDelayGrowthPercent: '0.5',
  redirectProbability: '2',
  startTime: '0',
  endTime: '' + 24*60-1,
  weekdays: '"12345"',
  day: '""',
  dayHits: '0'
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

function getTodaysHits() {
  if (getLocal('day') == todayAsString()) {
      return getLocal('dayHits');
  } else {
      return 0;
  }
}

function lookupJunkDomain(url) {
  var junkDomains = getLocal('junkDomains');
  var normalized_url = trimWWW(trimProtocol(url.trim()));
  for (var i = 0; i < junkDomains.length; i++) {
    if (normalized_url.indexOf(junkDomains[i]) == 0)
      return junkDomains[i];
  }
  return null;
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

function pickRandomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}
