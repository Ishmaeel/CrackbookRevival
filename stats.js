window.onload = function() {
  drawLogPlot();

  var histPlot = createPlot($('#histPlot'));
  collectHistoryData(histPlot);
};

/**
 * Draws a plot.
 */
function createPlot(el) {
  var options = {
    xaxis: { mode: "time", timeformat: "%b %d" },
    selection: { mode: "x" }
    //grid: { markings: weekendAreas }
  };
  return $.plot(el, [], options);
}

/**
 * Redraws a given plot with the given data.
 */
function redrawPlot(histPlot, plotData) {
  histPlot.setData(plotData);
  histPlot.setupGrid();
  histPlot.draw();
}

/**
 * Adds an entry to the plot, given 
 */
function addPlotRow(histPlot, plotData, domain, hitsByDate) {
  var row = mapToPairList(hitsByDate);
  
  // TODO: ensure order stability of entries
  plotData.push({
    label: domain,
    data: row
  });
  redrawPlot(histPlot, plotData);
}

/**
 * Convert a dictionary (object) to a list of pairs (in ascending key order).
 */
function mapToPairList(row) {
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
  return d;
}

function markHit(timestamp, hitsByDate) {
  var dt = new Date(timestamp);
  clearTime(dt);
  var histKey = dt.getTime();
  if (!hitsByDate.hasOwnProperty(histKey)) {
    hitsByDate[histKey] = 0;
  }
  hitsByDate[histKey] += 1;
}

/**
 * Collects history data asynchronously and shows it on the given plot.
 */
function collectHistoryData(histPlot) {
  var plotData = [];
  var junkDomains = getLocal('junkDomains');
  junkDomains.forEach(function(domain) {
    findDirectHits(domain, function(visitItems) {
      var hitsByDate = {};
      visitItems.forEach(function(item) {
        markHit(item.visitTime, hitsByDate);
      });
      addPlotRow(histPlot, plotData, domain, hitsByDate);
    });
  });
}

/**
 * Draws plot of hits, according to the internal Crackbook log.
 */
function drawLogPlot() {
  var logPlot = createPlot($('#logPlot'));

  var domainStats = {};
  // Initialize domainStats.
  var junkDomains = getLocal('junkDomains');
  junkDomains.forEach(function(domain) {
    domainStats[domain] = {};
  });

  var hitLogKeys = getLocal('hitLogKeys');
  hitLogKeys.forEach(function(key) {
    var entries = loadHits(key);
    entries.forEach(function(entry) {
      var hitsByDate = domainStats[entry.domain];
      markHit(entry.timestamp * 1000, hitsByDate);
    });
  });

  var plotData = [];
  junkDomains.forEach(function(domain) {
    addPlotRow(logPlot, plotData, domain, domainStats[domain]);
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
 * <p>Finds only direct hits (usually caused by user typing in a domain). Checks common variants of
 * the domain.
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
 * Finds Chrome history items by text-matching on the given domain.
 */
function findHistoryItems(domain, callback) {
  var monthAgo = new Date().getTime() - 1000*3600*24*7*30;
  chrome.history.search({
    text: domain,
    startTime: monthAgo,
    maxResults: 1000
  }, function(historyitems) {
    // TODO
  });
}
