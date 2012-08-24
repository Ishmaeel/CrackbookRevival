var STATS = {};
var PLOT_DATA = [];
var STATS_PLOT = null;

window.onload = function() {
    createPlot();
    collectPlotData();
};

/**
 * Draws a plot.
 */
function createPlot() {
  var options = {
    xaxis: { mode: "time", timeformat: "%b %d" },
    selection: { mode: "x" }
    //grid: { markings: weekendAreas }
  };
  STATS_PLOT = $.plot($("#plot"), [], options);
}

function redrawPlot(data) {
  STATS_PLOT.setData(data);
  STATS_PLOT.setupGrid();
  STATS_PLOT.draw();
}

function addPlotRow(domain, hits_by_date) {
  var row = hits_by_date;
  // Convert a histogram hash to a list of pairs.
  var keys = [];
  for (var k in row) {
    if (row.hasOwnProperty(k)) {
      keys.push(k);
    }
  }
  var sorted_keys = keys.sort();
  var d = [];
  for (var i = 0; i < sorted_keys.length; i++) {
    d.push([sorted_keys[i], row[sorted_keys[i]]]);
  }
  
  // TODO: ensure order stability
  PLOT_DATA.push({
    label: domain,
    data: d
  });
  redrawPlot(PLOT_DATA);
}

function collectPlotData() {
  var place = document.getElementById('statsplaceholder');
  var junkDomains = getLocal('junkDomains');
  junkDomains.forEach(function(domain) {
    findDirectHits(domain, function(visitItems) {
      var hitsByDate = {};
      visitItems.forEach(function(item) {
        if (item.transition === 'typed') {
          // TODO(gintas): Also count non-typed transitions?
          var dt = new Date(item.visitTime);
          clearTime(dt);
          var histKey = dt.getTime();
          if (!hitsByDate.hasOwnProperty(histKey)) {
            hitsByDate[histKey] = 0;
          }
          hitsByDate[histKey] += 1;
        }
      });
      addPlotRow(domain, hitsByDate);
    });
  });
}

function clearTime(dt) {
  dt.setUTCMilliseconds(0);
  dt.setUTCSeconds(0);
  dt.setUTCMinutes(0);
  dt.setUTCHours(0);
}


/**
 * Finds hits to a given domain.
 *
 * Checks common variants of the domain.
 */
function findDirectHits(domain, visitsHandler) {
  var variants = domainVariants(domain);
  var outstandingRequests = variants.length;
  var cumulativeVisits = [];
  variants.forEach(function(url) {
    chrome.history.getVisits({ url: url }, function(visits) {
      cumulativeVisits = cumulativeVisits.concat(visits);
      outstandingRequests--;
      if (outstandingRequests === 0) {
        visitsHandler(cumulativeVisits);
      }
    });
  });
}

/**
 * Returns variants of a given domain with.
 */
function domainVariants(domain) {
  return [
    'http://' + domain,
    'http://www.' + domain,
    'https://' + domain,
    'https://www.' + domain
  ];
}

/**
 * Finds history items by text-matching on the given domain.
 */
function findHistoryItems(domain) {
  var monthAgo = new Date().getTime() - 1000*3600*24*7*30;
  chrome.history.search({
    text: domain,
    startTime: monthAgo,
    maxResults: 1000
  }, function(historyitems) {
    RESULT = historyitems;
  });
}
