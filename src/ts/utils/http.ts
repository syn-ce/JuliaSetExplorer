const baseURL = '...';

export async function httpGET(url: string) {
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

export const httpPOST = (url: string, data: object) => {
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
};

export const httpPostNewCommunityJulia = (filename: string) => {
    httpPOST(baseURL + '/new_community_julia', { filename });
};
