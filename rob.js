/** @param {NS} ns **/
/*
 * args[0] - server name
 * args[1] - threads to attack with
 */
export async function main(ns, args) {
	await hackServer(ns, ns.args[0], ns.args[1]);
}

async function hackServer(ns, server, threads) {
	ns.disableLog('getServerSecurityLevel');
	let opts = { threads: threads, stock: true };
	while (true) {
		await ns.hack(server, opts);
	}
}
