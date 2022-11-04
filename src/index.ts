import * as cloudflare_api from "./cloudflare-api";
import {Env} from "./env";

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

		// Check entry point

		return new Response(IP + "\n" + await cloudflare_api.listDNS(env.ZONE_IDENTIFIER, env.API_TOKEN, "example.claimfinal.cf"));
	},
};
