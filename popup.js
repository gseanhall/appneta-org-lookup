import { getCache, setCache, searchCache } from './utils/cache.js';
import { fetchOrganizations, fetchUsers } from './utils/api.js';
import { checkAuthentication, triggerLogin } from './utils/auth.js';

chrome.storage.sync.get(['provisionUrl', 'signonUrl'], (items) => {
  const provisionUrl = items.provisionUrl || 'https://provision.pm.appneta.com';
  const signonUrl = items.signonUrl || 'https://signon.pm.appneta.com';

  document.getElementById('searchBtn').addEventListener('click', () => performSearch(provisionUrl, signonUrl));
  document.getElementById('userSearchBtn').addEventListener('click', () => performUserSearch(provisionUrl, signonUrl));
  document.getElementById('loginLink').addEventListener('click', (e) => {
    e.preventDefault();
    triggerLogin(signonUrl, provisionUrl);
  });

  async function performSearch(provisionUrl, signonUrl) {
    const searchInput = document.getElementById('searchInput').value.trim();
    if (!searchInput) {
      alert('Please enter a search value.');
      return;
    }

    const isAuthenticated = await checkAuthentication(provisionUrl);

    if (isAuthenticated) {
      const searchPromises = [
        fetchOrganizations(provisionUrl, searchInput, 'name'),
        fetchOrganizations(provisionUrl, searchInput, 'erpAccountId'),
        fetchOrganizations(provisionUrl, searchInput, 'supportSiteId')
      ];

      Promise.allSettled(searchPromises)
        .then(async (results) => {
          let combinedResults = [];
          let successfulSearches = 0;
          let vpnError = false;
          results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              result.value.forEach((org) => {
                org.matchedSearchType = ['name', 'erpAccountId', 'supportSiteId'][index];
              });
              combinedResults = combinedResults.concat(result.value);
              successfulSearches++;
            } else {
              if (result.reason.message === 'VPN') {
                vpnError = true;
              }
              console.error(`Error fetching results for ${['Name', 'ERP Account ID', 'Support Site ID'][index]}:`, result.reason);
            }
          });

          await setCache(`org_${searchInput}`, combinedResults);
          displayResults(combinedResults);

          if (combinedResults.length === 0 && successfulSearches > 0) {
            displayError('No results found.');
          } else if (vpnError && successfulSearches === 0) {
            displayError(`An error occurred while searching. Ensure you are connected to full tunnel VPN.`);
          } else if (successfulSearches > 0) {
            displayError('');
          }
        })
        .catch((err) => {
          console.error(err);
          displayError('An error occurred while performing the search.');
        });
    } else {
      const { orgs } = await searchCache(searchInput);
      if (orgs.length > 0) {
        displayResults(orgs);
        document.getElementById('cacheMessageContainer').style.display = 'block';
      } else {
        triggerLogin(signonUrl, provisionUrl);
      }
    }
  }

  async function performUserSearch(provisionUrl, signonUrl) {
    const userSearchInput = document.getElementById('userSearchInput').value.trim();
    if (!userSearchInput) {
      alert('Please enter a user search value.');
      return;
    }

    const isAuthenticated = await checkAuthentication(provisionUrl);

    if (isAuthenticated) {
      fetchUsers(provisionUrl, userSearchInput)
        .then(async (users) => {
          await setCache(`user_${userSearchInput}`, users);
          displayUserResults(users);
        })
        .catch(err => {
          console.error(err);
          displayError('An error occurred while performing the user search.');
        });
    } else {
      const { users } = await searchCache(userSearchInput);
      if (users.length > 0) {
        displayUserResults(users);
        document.getElementById('cacheMessageContainer').style.display = 'block';
      } else {
        triggerLogin(signonUrl, provisionUrl);
      }
    }
  }

  function displayUserResults(users) {
    const userResultsContainer = document.getElementById('userResultsContainer');
    userResultsContainer.innerHTML = ''; // Clear previous results
    users.forEach(user => {
      const userDetails = document.createElement('div');
      userDetails.classList.add('user-details');
      userDetails.innerHTML = `
        <h3>${user.firstName} ${user.lastName}</h3>
        <p>Email: ${user.emailAddress}</p>
        <p>Active: ${user.active ? 'Yes' : 'No'}</p>
        <p>Roles: ${user.pvUserSetting.roles}</p>
        <h4>Organizations:</h4>
      `;
      const orgList = document.createElement('ul');
      user.memberships.forEach(membership => {
        const orgItem = document.createElement('li');
        orgItem.textContent = `${membership.organization.displayName} (ID: ${membership.organization.id})`;
        orgList.appendChild(orgItem);
      });
      userDetails.appendChild(orgList);
      userResultsContainer.appendChild(userDetails);
    });
    userResultsContainer.style.display = 'block';
  }

  function displayError(errorMessage) {
    const errorContainer = document.getElementById('errorContainer');
    errorContainer.textContent = errorMessage;
    errorContainer.style.display = 'block';
  }

  function displayResults(organizations) {
    const resultsTable = document.getElementById('resultsTable');
    const resultsBody = document.getElementById('resultsBody');
    // Clear previous results
    resultsBody.innerHTML = '';

    // Add new results
    organizations.forEach(org => {
      const row = document.createElement('tr');

      const displayNameCell = document.createElement('td');
      displayNameCell.classList.add('truncate');
      const displayNameLink = document.createElement('a');
      displayNameLink.href = `https://${org.server}/pvc/?st=${org.orgId}`;
      displayNameLink.textContent = org.displayName;
      displayNameLink.target = '_blank';
      displayNameCell.appendChild(displayNameLink);
      row.appendChild(displayNameCell);

      const orgIdCell = document.createElement('td');
      orgIdCell.textContent = org.orgId;
      row.appendChild(orgIdCell);

      const parentIdCell = document.createElement('td');
      parentIdCell.textContent = org.parentId;
      row.appendChild(parentIdCell);

      const serverCell = document.createElement('td');
      const serverLink = document.createElement('a');
      serverLink.href = `https://${org.server}/pvc/organizationsHome.html`;
      serverLink.textContent = org.server;
      serverLink.target = '_blank';
      serverCell.appendChild(serverLink);
      row.appendChild(serverCell);

      const erpAccountIdCell = document.createElement('td');
      if (org.matchedSearchType === 'erpAccountId') {
        erpAccountIdCell.style.fontWeight = 'bold';
      }
      erpAccountIdCell.textContent = org.erpAccountId;
      row.appendChild(erpAccountIdCell);

      const supportSiteIdCell = document.createElement('td');
      if (org.matchedSearchType === 'supportSiteId') {
        supportSiteIdCell.style.fontWeight = 'bold';
      }
      supportSiteIdCell.textContent = org.supportSiteId;
      row.appendChild(supportSiteIdCell);

      resultsBody.appendChild(row);
    });

    resultsTable.style.display = 'table';
  }
  document.getElementById('searchInput').focus();
});
