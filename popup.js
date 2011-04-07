// Mark the domain of the selected tab as junk.
function markAsJunk() {
  chrome.tabs.getSelected(null, function (tab) {
    var junkDomains = getLocal('junkDomains');
    var domain = normalizedDomain(tab.url);
    junkDomains.push(domain);
    setLocal('junkDomains', junkDomains);
    document.getElementById('mark_junk_button').style.display = "none";
    bgPage().updateIcon(true);
    bgPage().submitConfigChange();
  });
}
