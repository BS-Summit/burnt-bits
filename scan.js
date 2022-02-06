/** @param {NS} ns **/
//	scan.js
//	Scans all servers in the network, and collects information about them, including
//	a breadcrumb trail usable to backtrace to the home server. 
export async function main(ns) {
	var serverList = new Object();
	let originServer = "home";
	let currentServer = "home";
	let serverInfo = serverDetails(ns, originServer, currentServer);
	//	ns.tprint(serverDetails(ns, originServer, currentServer)) // Testing print

	serverList.currentServer = serverInfo;

	let scanResults = ns.scan("home");

	//	Whenever we want to add servers to the scanList, we want to make sure we keep
	//	track of which server's scan found them, so that we're able to later trace
	//	back to our home server.
	let scanList = addOriginToScanned(ns, originServer, scanResults);
	// 	ns.tprint(addOriginToScanned(ns, originServer, scanResults)) //	Testing print

	//	While we have entries in our scanList we want to itterate through them, removing
	//	one element at a time and if they haven't been added to the serverList yet, we 
	//	want to add them, set them as the current originServer, and then scan from them 
	//	for new servers to be added to the scanList.
	while (scanList.length > 0) {
		//	We remove an entry from our scanList to check and potentially scan from it.
		let serverArray = scanList.pop();
		currentServer = serverArray[1]
		//	Checks to see if we already have this server recorded.
		if (!serverList.hasOwn(currentServer)) {
			originServer = serverArray[0]
			//	Gathers the server's details and associates the server with it's details.
			serverInfo = serverDetails(ns, originServer, currentServer);
			serverList.currentServer = serverInfo;
			//	Scans for new servers.
			scanResults = ns.scan(currentServer);
			for (let scanIndex = scanResults.length - 1; scanIndex >= 0; i--) {
				//	We can safely remove any servers we already have in our list from the 
				//	scan results.
				if (serverList.hasOwn(scanResults[scanIndex])) {
					scanResults.splice(scanIndex, 1)
				}
			}
			//	If we have any remaining servers in our scanResults array, we add them to 
			//	the scanList.
			if (scanResults.length > 0) {
				scanList = scanList.concat(addOriginToScanned(ns, originServer, scanResults));
			}
		}
	}
	//	ns.tprint(serverList["home", "n00dles", "foodnstuff"]) //	Testing print
}

//	Creates and returns an object formatted as a dictionary with the relevant details
//	of the server provided, including the originServer which was used to connect
// 	to the new server. This origin server is important for the future network mapping
//	function, as it will allow us to trace back every server to "home", providing
//	a followable path for reaching the server.
export async function serverDetails(ns, originServer, currentServer) {
	//	Collect the info for the return.
	var requiredPorts = ns.getServerNumPortsRequired(currentServer);
	var rootStatus = ns.hasRootAccess(currentServer);
	var requiredHackSkill = ns.getServerRequiredHackingLevel(currentServer);
	var minimumSecurity = ns.getServerMinSecurityLevel(currentServer);
	var maximumMoney = ns.getServerMaxMoney(currentServer);
	var totalRam = ns.getServerMaxRam(currentServer);
	//	Store the info for the return
	var serverDetailsArray = {
		OriginServer: originServer,
		RequiredPorts: requiredPorts,
		RootStatus: rootStatus,
		RequiredHackSkill: requiredHackSkill,
		BackdoorStatus: false,
		MinimumSecurity: minimumSecurity,
		MaximumMoney: maximumMoney,
		TotalRam: totalRam
	};
	//	ns.tprint(serverDetailsArray) //	Testing print
	//	Return the array
	return (serverDetailsArray);
}

//	Takes the origin server and an array of results from a scan, then returns an
//	array of paired arrays including the origin server and the scanned servers.
export async function addOriginToScanned(ns, originServer, scanResults) {
	//	ns.tprint(scanResults) //	Testing print
	var resultsList = []
	for (let scannedServer of scanResults) {
		resultsList.push[originServer, scannedServer]
	}
	return (resultsList)
}

//=======================================================================================//
//	Past this point is just example code from my previous script. My new script is 
//	intended to replace this older code with a more functionable, more readable, and 
//	more dynamic script which can provide important information to enable greater 
//	functionality in my other scripts.
//=======================================================================================//

//	Takes in the server list, attempts gain root access to those it doesn't already have.
//	Returns the server list, minus all that were unable to be rooted. 
export async function rootHack(ns, tServerList) {
	let rootList = [];
	for (let i = 0; i < tServerList.length; i++) {
		let serv = tServerList[i];
		if (ns.serverExists(serv) & ns.hasRootAccess(serv) == false) rootList.push(serv);
	}
	for (let i = rootList.length - 1; i >= 0; i--) {
		let target = rootList[i];
		let t = ns.getServerNumPortsRequired(target);
		let d = 0;
		if (ns.fileExists('BruteSSH.exe')) { ns.brutessh(target); d++ }
		if (ns.fileExists('FTPCrack.exe')) { ns.ftpcrack(target); d++ }
		if (ns.fileExists('relaySMTP.exe')) { ns.relaysmtp(target); d++ }
		if (ns.fileExists('HTTPWorm.exe')) { ns.httpworm(target); d++ }
		if (ns.fileExists('SQLInject.exe')) { ns.sqlinject(target); d++ }
		if (t <= d) {
			ns.nuke(target);
			ns.tprint(`${target} rooted.`);
		} else {
			ns.tprint(`${target} requires ${t - d} more root tools.`);
			let remove = tServerList.indexOf(target);
			if (remove > -1) { tServerList.splice(remove, 1); }
		}
	}
	return (tServerList);
}

export async function exampleMain(ns) {
	var serverList = new Set();
	var hackList = [];
	var deadList = [];
	var botList = [];
	var rootedServerList = [];

	var scanned = ns.scan("home");
	var ownedList = ns.getPurchasedServers();
	serverList.add("home");

	//	Start at home, look for servers, add them to list, itterate on list 
	//	until there are no servers left to check.
	while (scanned.length > 0) {
		const server = scanned.pop();
		if (!serverList.has(server)) {
			serverList.add(server);
			scanned = scanned.concat(ns.scan(server));
		}
	}
	//	Remove purchased servers & home from serverList
	ownedList.forEach(serv => { serverList.delete(serv) })
	serverList.delete("home");
	serverList = Array.from(serverList);

	//	Gain root access to any servers that we can.
	rootedServerList = (await rootHack(ns, serverList));

	//	Remove servers we cannot hack yet.
	for (let i = rootedServerList.length - 1; i >= 0; i--) {
		if (ns.getServerRequiredHackingLevel(rootedServerList[i]) > ns.getHackingLevel()) {
			rootedServerList.splice(i, 1);
		}
	}
	//	Create list of hackable servers which have money but no RAM.
	for (let i = rootedServerList.length - 1; i >= 0; i--) {
		if (ns.getServerMaxMoney(rootedServerList[i]) > 0) {
			hackList.push(rootedServerList[i]);
		}
	}
	//	Create sublist of hackable servers which hold money, but lack the RAM to self-hack.
	for (let i = hackList.length - 1; i >= 0; i--) {
		if (ns.getServerMaxRam(hackList[i]) == 0) {
			deadList.push(hackList[i]);
			hackList.splice(i, 1);
		}
	}
	//	Create a list of servers which have no money, but do have enough RAM to hack.
	for (let i = rootedServerList.length - 1; i >= 0; i--) {
		if (ns.getServerMaxRam(rootedServerList[i]) > 2 &
			ns.getServerMaxMoney(rootedServerList[i]) == 0) {
			botList.push(rootedServerList[i]);
		}
	}
	//	Past this point in the real program I do all of the stuff I want to do with the 
	//	server lists. I intend to have that split into either another script, or make a 
	//	condensed function for it instead, one I've gotten the scan.js script working 
	//	more smoothly.
}
