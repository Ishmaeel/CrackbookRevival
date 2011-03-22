function markAsJunk() {
  chrome.tabs.getSelected(null, function (tab) {
    var junkDomains = getJunkDomains();
    junkDomains.push(normalizedDomain(tab.url));
    setJunkDomains(junkDomains);
    document.getElementById('mark_junk_button').style.display = "none";
  });
}
