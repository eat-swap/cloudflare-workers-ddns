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

export async function listDNS(zone_id: string, token: string, name: string = "") {
	const path = `zones/${zone_id}/dns_records` + (name ? `?name=${name}` : "");
	let resp = await callApi("GET", path, null, token);
	const t = await resp.text();
	console.log(t);
	return t;
}
