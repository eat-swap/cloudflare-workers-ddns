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
		if (!parseOK || !dto.hasOwnProperty("token") || dto["token"] != env.CLIENT_TOKEN || !dto.hasOwnProperty("name")) {
			return new Response(`HTTP 400 Bad Request\nIP: ${IP}\n`, {
				status: 400
			});
		}

		const name: string = dto["name"];
		const [existingDns, existingDnsOK] = await cloudflare_api.listDNS(env.ZONE_IDENTIFIER, env.API_TOKEN, name);
		if (!existingDnsOK || !existingDns.success) {
			return new Response(JSON.stringify(existingDns), {status: 500});
		}

		let resp: any, ok: boolean;
		switch (existingDns.result.length) {
			case 0: // to create
				 [resp, ok] = await createDNS(env.ZONE_IDENTIFIER, env.API_TOKEN, name, IP);
				break;
			case 1: // to update
				[resp, ok] = await updateDNS(env.ZONE_IDENTIFIER, env.API_TOKEN, name, IP, existingDns.result[0].id);
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
