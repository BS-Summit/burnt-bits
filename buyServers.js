/** @param {NS} ns **/
/*
 * Purchases the best server available with the
 * user's current money. If the server limit is
 * reached, replaces the worst server. Repeatable.
 */

var maxServers;
var servers;
export async function main(ns) {
	// Default Values
	maxServers = ns.getPurchasedServerLimit();
	servers = ns.getPurchasedServers();
	serverInfo(ns);
	await buyServers(ns);
}

function serverInfo(ns) {
	ns.tprint(`You have ${servers.length}/${maxServers} servers`);
	Object.entries(groupServers(ns)).map((ramServers) => {
		ns.tprint(`${ramServers[0]}GB: ${ramServers[1]}`);
	});
}

function groupServers(ns) {
	let groupedServers = {};
	servers.forEach((server) => {
		let ram = ns.getServerRam(server)[0];
		groupedServers[ram] = groupedServers[ram] || [];
		groupedServers[ram].push(server);
	});
	return groupedServers;
}

async function buyServers(ns) {
	let ram = ns.getPurchasedServerMaxRam();
	let shopServer = true;
	while (shopServer) {
		let myMoney = ns.getServerMoneyAvailable('home');
		let serverCost = ns.getPurchasedServerCost(ram);
		while (serverCost > myMoney && ram > 2) {
			ram = ram / 2;
			serverCost = ns.getPurchasedServerCost(ram);
		}
		shopServer = await ns.prompt(`Would you like to buy a ${ram}GB server for ${ns.nFormat(serverCost, "$0.00a")}`);
		if (shopServer) { shopServer = buyServer(ns, ram); }
	}
}

function buyServer(ns, ram) {
	if (servers.length == maxServers) {
		let success = removeWeakestServer(ns, ram);
		if (!success) { return false; }
	}
	let readableRam;
	if (ram == 1048576) {
		readableRam = "1PT"
	} else if (ram >= 1024) {
		let tempToReadableRam = Math.round((ram / 1024) * 10) / 10
		readableRam = tempToReadableRam.toString() + "TB"
	} else {
		readableRam = ram.toString() + "GB"
	}
	let server = ns.purchaseServer(`botnet-${readableRam}`, ram);
	servers.push(server);
	ns.tprint(`Purchased ${server}: ${ram}GB`);
	return true;
}

function removeWeakestServer(ns, newRam) {
	let groupedServers = groupServers(ns);
	let min = Math.min(...Object.keys(groupedServers));
	if (min >= newRam) {
		ns.tprint(`Your smallest server has ${min}GB RAM and you wanted to purchase ${newRam}GB server`);
		return false;
	}
	let smallest_server = groupedServers[min][0];
	ns.killall(smallest_server);
	ns.deleteServer(smallest_server);
	servers = ns.getPurchasedServers(true);
	return true;
}
