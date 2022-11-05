import * as utils from "./utility"

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

export async function listDNS(zone_id: string, token: string, name: string = "", type: string = "") {
	const path = `zones/${zone_id}/dns_records`
		+ (name ? `?name=${name}` : "")
		+ (type ? `${name ? "&" : "?"}type=${type}` : "");
	const resp = await callApi("GET", path, null, token);
	return utils.parseJSON(await resp.text());
}

export async function createDNS(zone_id: string, token: string, name: string, address: string) {
	const path = `zones/${zone_id}/dns_records`;
	const payload = {
		type: address.includes(":") ? "AAAA" : "A",
		name: name,
		content: address,
		ttl: 120,
	};
	const resp = await callApi("POST", path, payload, token);
	return utils.parseJSON(await resp.text());
}

export async function updateDNS(zone_id: string, token: string, name: string, address: string, record_id: string) {
	const path = `zones/${zone_id}/dns_records/${record_id}`;
	const payload = {
		type: address.includes(":") ? "AAAA" : "A",
		name: name,
		content: address,
		ttl: 120,
	};
	const resp = await callApi("PUT", path, payload, token);
	return utils.parseJSON(await resp.text());
}

export async function listZone(token: string) {
	const resp = await callApi("GET", "zones", null, token);
	return utils.parseJSON(await resp.text());
}
