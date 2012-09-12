MIN_HISTORY_LENGTH = 4 * 24 * 3600 * 1000;  // 4 days

window.onload = function() {
  if (enoughLogData()) {
    drawLogPlot();
  } else {
    $('#logPlot-container').html(
      "Crackbook has less than 4 days of activity logs. Please come back later.");
  }

  $('#show-browser-history-visits').click(function() {
    $('#browser-history-visits').show();
    $('#browser-hist').hide();
    // TODO: Show "Loading..."
    var histPlot = createPlot($('#histPlot'));
    collectHistoryData(histPlot);
    return true;
  });
};

/**
 * Draws a plot.
 */
function createPlot(el) {

  // Helper for returning the weekends in a period
  // Copied from flot samples.
  function weekendAreas(axes) {
    var markings = [];
    var d = new Date(axes.xaxis.min);
    // go to the first Saturday
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 1) % 7));
    d.setUTCSeconds(0);
    d.setUTCMinutes(0);
    d.setUTCHours(0);
    var i = d.getTime();
    do {
      // when we don't set yaxis, the rectangle automatically
      // extends to infinity upwards and downwards
      markings.push({ xaxis: { from: i, to: i + 2 * 24 * 60 * 60 * 1000 } });
      i += 7 * 24 * 60 * 60 * 1000;
    } while (i < axes.xaxis.max);

    return markings;
  }

  var options = {
    xaxis: { mode: "time", timeformat: "%b %d", minTickSize: [1, "day"] },
    selection: { mode: "x" },
    grid: { markings: weekendAreas },
    legend: { position: "nw" }
  };

  var plot = $.plot(el, [], options);

  el.bind("plotselected", function (event, ranges) {
    // Zoom into selected area.
    var options = plot.getOptions();
    options.xaxes[0].min = ranges.xaxis.from;
    options.xaxes[0].max = ranges.xaxis.to;
    plot.clearSelection();
    plot.setupGrid();
    plot.draw();
  });

  $(el).next("div.zoomout").click(function(e) {
    // Zoom out to view the entire dataset.
    e.preventDefault();
    var options = plot.getOptions();
    options.xaxes[0].min = options.xaxes[0].datamin;
    options.xaxes[0].max = options.xaxes[0].datamax;
    plot.setupGrid();
    plot.draw();
  });

  return plot;
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
 * Adds an entry to the plot, given a dictionary of hits by date.
 */
function addPlotRow(histPlot, plotData, domain, hitsByDate) {
  addMissingZeroes(hitsByDate);
  var row = mapToPairList(hitsByDate);

  // TODO: ensure order stability of entries
  plotData.push({
    label: domain,
    data: row
  });
  redrawPlot(histPlot, plotData);
}

/**
 * Adds zeroes for days where no hits have been logged.
 *
 * <p>Modifies the list in place.
 *
 * @param hitsByDate a map of date -> hitcount.
 */
function addMissingZeroes(hitsByDate) {
  var min = null;
  for (var k in hitsByDate) {
    if (hitsByDate.hasOwnProperty(k)) {
      var t = parseInt(k, 10);
      if (min === null || t < min) {
        min = t;
      }
    }
  }

  var max = new Date().getTime();  // the current moment is the upper bound
  var dt = new Date(min);
  while (dt.getTime() < max) {
    if (!hitsByDate.hasOwnProperty(dt.getTime())) {
      hitsByDate[dt.getTime()] = 0;
    }
    dt.setDate(dt.getDate() + 1);
  }
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

/**
 * Returns true if there is enough internal log data to show a decent plot.
 */
function enoughLogData() {
  return (new Date() - earliestLogTimestamp()) > MIN_HISTORY_LENGTH;
}

function earliestLogTimestamp() {
  var timestamp = null;
  var hitLogKeys = getLocal('hitLogKeys');
  hitLogKeys.forEach(function(key) {
    var entries = loadHits(key);
    entries.forEach(function(entry) {
      if (timestamp === null || entry.timestamp < timestamp) {
        timestamp = entry.timestamp;
      }
    });
  });
  return (timestamp !== null) ? new Date(timestamp * 1000) : new Date();
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
