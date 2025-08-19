export function triggerLogin(signonUrl, provisionUrl) {
  const loginUrl = `${signonUrl}/signon/login.html?redirectUrl=${provisionUrl}/api/v1/swagger-html`;
  chrome.tabs.create({ url: loginUrl }, () => {
    alert('Please log in, then try again.');
    window.close();
  });
}

export async function checkAuthentication(provisionUrl) {
  try {
    const response = await fetch(`${provisionUrl}/api/v1/organization?name=test`);
    return response.status !== 401;
  } catch (error) {
    return false;
  }
}
