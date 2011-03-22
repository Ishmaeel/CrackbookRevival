//
// Helper functions.
//

function normalizedDomain(url) {
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

function getHitHistory() {
  if (!('hitHistory' in localStorage)) {
    localStorage.setItem('hitHistory', '{}');
  }
  var s = localStorage.getItem('hitHistory');
  return JSON.parse(s);
}

function setHitHistory(hist) {
  localStorage.setItem('hitHistory', JSON.stringify(hist));
}

function getJunkDomains() {
  if (!('junkDomains' in localStorage)) {
    localStorage.setItem('junkDomains', '[]');
  }
  var s = localStorage.getItem('junkDomains');
  return JSON.parse(s);
}

function setJunkDomains(domains) {
  localStorage.setItem('junkDomains', JSON.stringify(domains));
}

function initIcon() {
  var hist = getHitHistory();
  var today = todayAsString();
  if (!hist[today])
    hist[today] = 0;
  drawIcon(hist[today]);
}

