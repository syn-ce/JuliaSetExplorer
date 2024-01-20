const baseURL = 'http://192.168.0.232:2023';

export async function httpGET(url: string) {
    console.log('test');
    let response = await fetch(url);
    let data = await response.json();
    let status = response.status;
    return { data, status };
}

export async function httpGetRandomJulia() {
    return httpGET(baseURL + '/random_julia');
}

export const httpPOST = (url: string, data: object) => {
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
};

export const httpPostNewJulia = (filename: string) => {
    httpPOST(baseURL + '/new_julia', { filename });
};
