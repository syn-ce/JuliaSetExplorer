const baseURL = 'https://fractals-ddns.ddns.net:54543';
export async function httpGET(url) {
    let response = await fetch(url);
    let data = await response.json();
    let status = response.status;
    return { data, status };
}
export async function httpGetRandomCommunityJulia() {
    return httpGET(baseURL + '/random_community_julia');
}
export async function httpGetRandomSelectedJulia() {
    return httpGET(baseURL + '/random_selected_julia');
}
export const httpPOST = (url, data) => {
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
};
export const httpPostNewCommunityJulia = (filename) => {
    httpPOST(baseURL + '/new_community_julia', { filename });
};
