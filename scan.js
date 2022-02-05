/** @param {NS} ns **/
export async function main(ns) {
	var serverList = new Object();
	let originServer = "home";
	let currentServer = "home";
	ns.tprint(serverDetails(ns, originServer, currentServer))
	let serverInfo = serverDetails(ns, originServer, currentServer);
	
	serverList.currentServer = serverInfo;

	let scanResults = ns.scan("home");
	ns.tprint(addOriginToScanned(ns, originServer, scanResults))
	let scanList = addOriginToScanned(ns, originServer, scanResults);

	while (scanList.length > 0) {
		let serverArray = scanList.pop();
		originServer = serverArray[0]
		currentServer = serverArray[1]
		if (serverList.hasOwn(currentServer)) { continue }

		serverInfo = serverDetails(ns, originServer, currentServer);
		serverList.currentServer = serverInfo;

		scanResults = ns.scan(currentServer);
		for (let index = scanResults.length - 1; index >= 0; i--) {
			if (serverList.hasOwn(scanResults[index])) {
				scanResults.splice(index, 1)
			}
		}

		if (scanResults.length > 0) {
			scanList = scanList.concat(addOriginToScanned(ns, originServer, scanResults));
		}
	}
	ns.tprint(serverList["home", "n00dles", "foodnstuff"])
}

//	Creates and returns an object formatted as a dictionary with the relevant details
//	of the server provided, including the originServer which was used to connect
// 	to the new server. This origin server is important for the future network mapping
//	function, as it will allow us to trace back every server to "home", providing
//	a followable path for reaching the server.
export async function serverDetails(ns, originServer, currentServer) {
	//	Collect the info for the return.
	let requiredPorts = ns.getServerNumPortsRequired(currentServer)
	let rootStatus = ns.hasRootAccess(currentServer)
	let requiredHackSkill = ns.getServerRequiredHackingLevel(currentServer)

	let minimumSecurity = ns.getServerMinSecurityLevel(currentServer)
	let maximumMoney = ns.getServerMaxMoney(currentServer)
	let totalRam = ns.getServerMaxRam(currentServer)
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
	//	Return the array
	return (serverDetailsArray)
}

export async function addOriginToScanned(ns, originServer, scanResults) {
	ns.tprint(scanResults)
	var resultsList = []
	for (let scannedServer of scanResults) {
		resultsList.push[originServer, scannedServer]
	}
	return (resultsList)
}

//=======================================================================================//
//	This is a stripped-down excerpt of my previous script, specifically the section 
//	I'm working to replace with this new script.
export async function exampleMain(ns) {
    var serverList = new Set();
    var hackList = [];
    var deadList = [];
    var botList = [];
    var rootedServerList = [];

    let scanned = ns.scan("home");
    var ownedList = ns.getPurchasedServers();
    serverList.add("home");

    //	Start at home, look for servers, add them to list, itterate on list 
    //	until there are no servers left to check.
    while (scanned.length > 0) {
        const s = scanned.pop();
        if (!serverList.has(s)) {
            serverList.add(s);
            scanned = scanned.concat(ns.scan(s));
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
    //	Create list of hackable servers which can be robbed from.
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
