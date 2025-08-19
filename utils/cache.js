export function getCache(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      resolve(result[key]);
    });
  });
}

export function setCache(key, value) {
  return new Promise((resolve) => {
    const data = {};
    data[key] = value;
    chrome.storage.local.set(data, () => {
      resolve();
    });
  });
}

export async function searchCache(searchTerm) {
  const lowerCaseSearchTerm = searchTerm.toLowerCase();
  const allData = await new Promise(resolve => chrome.storage.local.get(null, resolve));

  const orgResults = new Map();
  const userResults = new Map();

  for (const key in allData) {
    if (key.startsWith('org_')) {
      const orgs = allData[key];
      orgs.forEach(org => {
        if (
          org.displayName?.toLowerCase().includes(lowerCaseSearchTerm) ||
          org.erpAccountId?.toLowerCase().includes(lowerCaseSearchTerm) ||
          org.supportSiteId?.toLowerCase().includes(lowerCaseSearchTerm)
        ) {
          orgResults.set(org.orgId, org);
        }
      });
    } else if (key.startsWith('user_')) {
      const users = allData[key];
      users.forEach(user => {
        if (
          user.firstName?.toLowerCase().includes(lowerCaseSearchTerm) ||
          user.lastName?.toLowerCase().includes(lowerCaseSearchTerm) ||
          user.emailAddress?.toLowerCase().includes(lowerCaseSearchTerm)
        ) {
          userResults.set(user.emailAddress, user);
        }
      });
    }
  }

  return {
    orgs: Array.from(orgResults.values()),
    users: Array.from(userResults.values())
  };
}
