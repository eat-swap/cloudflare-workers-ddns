import * as cloudflare_api from "./cloudflare-api";
import {Env} from "./env";
import * as utils from "./utility"
import {createDNS, updateDNS} from "./cloudflare-api";

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext
	): Promise<Response> {
		const IP: string = request.headers.get("cf-connecting-ip") || "Unknown";

		// Check insecure HTTP
		if (request.url.startsWith("http://")) {
			return new Response(`${IP}, please use HTTPS!`, {
				headers: {
					"Location": "https" + request.url.substring(4)
				},
				status: 308
			});
		}

		// Check entry point & method
		const path = request.url.substring(request.url.indexOf("/", 8));
		if (path != env.ENTRYPOINT || request.method != "POST") {
			return new Response(`HTTP 451 Unavailable For Legal Reasons\nIP: ${IP}\n`, {
				status: 451
			});
		}

		const [dto, parseOK] = utils.parseJSON(await request.text());
		if (!parseOK || !dto.hasOwnProperty("token") || !dto.hasOwnProperty("name")) {
			return new Response(`HTTP 400 Bad Request\nIP: ${IP}\n`, {
				status: 400
			});
		}

		const name: string = (dto.name.endsWith(".") ? dto.name.slice(0, -1) : dto.name);
		const token: string = dto.token;
		const domain = name.slice(name.lastIndexOf(".", name.lastIndexOf(".") - 1) + 1);

		let resp: any, ok: boolean;
		// Find Zone
		[resp, ok] = await cloudflare_api.listZone(token);
		if (!ok) {
			return new Response(JSON.stringify(resp), {status: 500});
		}

		let zone_id: string = "";
		for (let i = 0; i < resp.result.length; ++i) {
			if (resp.result[i].name == domain) {
				zone_id = resp.result[i].id;
				break;
			}
		}
		if (!zone_id) {
			return new Response(`No such zone found: ${domain}`, {status: 400});
		}

		const [existingDns, existingDnsOK] = await cloudflare_api.listDNS(zone_id, token, name);
		if (!existingDnsOK || !existingDns.success) {
			return new Response(JSON.stringify(existingDns), {status: 500});
		}

		switch (existingDns.result.length) {
			case 0: // to create
				 [resp, ok] = await createDNS(zone_id, token, name, IP);
				break;
			case 1: // to update
				[resp, ok] = await updateDNS(zone_id, token, name, IP, existingDns.result[0].id);
				break;
			default:
				return new Response("more than 1 record found", {status: 409});
		}
		if (!ok) {
			return new Response(JSON.stringify(resp), {status: 500});
		}
		return new Response(JSON.stringify(resp), {status: 200});
	},
};
