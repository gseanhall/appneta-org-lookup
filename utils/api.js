export function fetchOrganizations(provisionUrl, searchInput, searchType) {
  const queryParams = new URLSearchParams({
    [searchType]: searchInput
  });

  return fetch(`${provisionUrl}/api/v1/organization?${queryParams.toString()}`)
    .then(response => {
      if (response.status === 404) {
        return [];
      }

      if (response.status === 403) {
        throw new Error('VPN');
      }

      if (!response.ok) {
        throw new Error('Failed to fetch organizations.');
      }

      return response.json();
    });
}

export function fetchUsers(provisionUrl, searchInput) {
  const queryParams = new URLSearchParams({ email: searchInput });
  return fetch(`${provisionUrl}/api/v1/user?${queryParams.toString()}`)
    .then(response => {
      if (!response.ok) throw new Error('Failed to fetch users.');
      return response.json();
    });
}
