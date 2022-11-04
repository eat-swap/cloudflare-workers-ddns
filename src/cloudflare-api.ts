export {}

const ENDPOINT = "https://api.cloudflare.com/client/v4/";

export async function callApi(method: string, path: string, payload: any, token: string): Promise<Response> {
	const req = new Request(ENDPOINT + path, {
		method: method,
		headers: new Headers({
			"Authorization": "Bearer " + token
		}),
		body: payload ? JSON.stringify(payload) : null
	});
	return fetch(req);
}