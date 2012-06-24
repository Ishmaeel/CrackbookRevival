var STATS = {};

window.onload = function() {
  collectStats();
}

function collectStats() {
  var place = document.getElementById('statsplaceholder')
  var junkDomains = getLocal('junkDomains');
  for (var i = 0; i < junkDomains.length; i++) {
    var domain = junkDomains[i];
    var div = document.createElement('div');
    div.setAttribute('id', 'domain-' + domain);
    place.parentNode.insertBefore(div, place);
    findDirectHits(domain);
  }
}

function findHistoryItems(domain) {
  var monthAgo = new Date().getTime() - 1000*3600*24*7*30;
  chrome.history.search({
    text: domain,
    startTime: monthAgo,
    maxResults: 1000
  }, function(historyitems) {
    console.log(historyitems);
    RESULT = historyitems;
  });
}

function domainVariants(domain) {
  return [
    'http://' + domain,
    'http://www.' + domain,
    'https://' + domain,
    'https://www.' + domain
  ];
}

function findDirectHits(domain) {
  var by_date = {};
  STATS[domain] = by_date;
  domainVariants(domain).forEach(function(url) {
    chrome.history.getVisits({ url: url },
      function(visitItems) {
        visitItems.forEach(function(item) {
          if (item.transition === 'typed') {
            var dt = new Date(item.visitTime);
            var key = (dt.getMonth() + 1) + "-" + dt.getDate();
            if (!by_date.hasOwnProperty(key)) {
              by_date[key] = 0;
            }
            by_date[key] += 1;
          }
        });
      }
    );
  });
}
