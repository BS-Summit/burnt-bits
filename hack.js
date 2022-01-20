/** @param {NS} ns **/
/*
 * args[0] - server name
 * args[1] - threads to attack with
 * args[2] - calculated server min security
 * args[3] - calculated server max money
 */
export async function main(ns, args) {
	await hackServer(ns, ns.args[0], ns.args[1], ns.args[2], ns.args[3]);
}

async function hackServer(ns, server, threads, security, money) {
	ns.disableLog('getServerSecurityLevel');
	let serverSecurityThreshold = security;
	let serverMoneyThreshold = money;
	let opts = { threads: threads, stock: true };
	while (true) {
		if (ns.getServerSecurityLevel(server) > serverSecurityThreshold) {
			await ns.weaken(server, opts);
		} else if (ns.getServerMoneyAvailable(server) < serverMoneyThreshold) {
			await ns.grow(server, opts);
		} else {
			await ns.hack(server, opts);
		}
	}
}
