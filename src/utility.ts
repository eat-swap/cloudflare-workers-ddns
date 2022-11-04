export {}

function parseJSON(str: string): readonly [any, boolean] {
	let jsonObj: any;
	try {
		jsonObj = JSON.parse(str)
		return [jsonObj, true] as const;
	} catch (err) {
		return [null, false] as const;
	}
}