document.getElementById('save').addEventListener('click', saveOptions);

function saveOptions() {
  const provisionUrl = document.getElementById('provisionUrl').value;
  const signonUrl = document.getElementById('signonUrl').value;
  chrome.storage.sync.set({ provisionUrl: provisionUrl, signonUrl: signonUrl }, () => {
    alert('URLs saved');
  });
}

function restoreOptions() {
  chrome.storage.sync.get(['provisionUrl', 'signonUrl'], (items) => {
    document.getElementById('provisionUrl').value = items.provisionUrl || 'https://provision.pm.appneta.com';
    document.getElementById('signonUrl').value = items.signonUrl || 'https://signon.pm.appneta.com';
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
