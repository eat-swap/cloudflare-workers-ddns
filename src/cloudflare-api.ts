export {}

const ENDPOINT = "https://api.cloudflare.com/client/v4/";

async function callApi(method: string, path: string, payload: any, token: string) {
    const req = new Request(ENDPOINT + path, {
        method: method,
        headers: new Headers({
            "Authorization": "Bearer " + token
        }),
        body: JSON.stringify(payload)
    });
    const resp = await fetch(req);
    console.log(await resp.text());
}