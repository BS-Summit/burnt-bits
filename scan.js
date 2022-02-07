/** @param {NS} ns **/
//	scan.js
//	Scans all servers in the network, and collects information about them, including
//	a breadcrumb trail usable to backtrace to the home server. 
let serverList = new Object();
let originServer;
let currentServer;
let serverInfo;
let scanResults;
let availablePorts;

export async function main(ns) {
	originServer = "home";
	currentServer = "home";
	serverInfo = serverDetails(ns, originServer, currentServer);
	//ns.tprint(["Main : serverInfo",serverInfo]) // Testing print
	//ns.tprint(["Main : await serverDetails(ns, originServer, currentServer)",await serverDetails(ns, originServer, currentServer)]) // Testing print

	serverList[currentServer] = serverInfo;
	//ns.tprint(["Main : ns.scan(home);",ns.scan("home")]) // Testing print
	scanResults = ns.scan("home");

	let scanList = addOriginToScanned(ns, originServer, scanResults);

	recursiveScanning(ns, scanList)
	rootServers(ns)

	// ns.tprint(["Main : serverList[home]", serverList["home"]]) //	Testing print
}

function recursiveScanning(ns, scanList) {
	if (scanList.length == 0) { return }
	let serverArray = scanList.pop();
	currentServer = serverArray[1]
	//ns.tprint(["recursiveScanning : currentServer",currentServer])
	if (!serverList[currentServer]) {
		originServer = serverArray[0]
		serverInfo = serverDetails(ns, originServer, currentServer);
		serverList[currentServer] = serverInfo;
		//ns.tprint(["recursiveScanning : IF : originServer",originServer])
		scanResults = addOriginToScanned(ns, originServer, ns.scan(currentServer))
		scanList = scanList.concat(scanResults);
	}
	recursiveScanning(ns, scanList)
}

//	Creates and returns an object formatted as a dictionary with the relevant details
//	of the server provided, including the originServer which was used to connect
// 	to the new server. This origin server is important for the future network mapping
//	function, as it will allow us to trace back every server to "home", providing
//	a followable path for reaching the server.
function serverDetails(ns, originServer, currentServer) {
	//	Collect the info for the return.
	var requiredPorts = ns.getServerNumPortsRequired(currentServer);
	var rootStatus = ns.hasRootAccess(currentServer);
	var requiredHackSkill = ns.getServerRequiredHackingLevel(currentServer);
	var minimumSecurity = ns.getServerMinSecurityLevel(currentServer);
	var maximumMoney = ns.getServerMaxMoney(currentServer);
	var totalRam = ns.getServerMaxRam(currentServer);
	//	Store the info for the return
	var serverDetailsDict = {
		OriginServer: originServer,
		RequiredPorts: requiredPorts,
		RootStatus: rootStatus,
		RequiredHackSkill: requiredHackSkill,
		BackdoorStatus: false,
		MinimumSecurity: minimumSecurity,
		MaximumMoney: maximumMoney,
		TotalRam: totalRam
	};
	//ns.tprint(["serverDetails : serverDetailsDict",serverDetailsDict]) //	Testing print
	//	Return the dictionary
	return (serverDetailsDict);
}

//	Takes the origin server and an array of results from a scan, then returns an
//	array of paired arrays including the origin server and the scanned servers.
function addOriginToScanned(ns, originServer, scanResults) {
	//ns.tprint(["addOriginToScanned : scanResults", scanResults]) //	Testing print
	var resultsList = []
	for (let scannedServer of scanResults) {
		resultsList.push([originServer, scannedServer])
	}
	//ns.tprint(["addOriginToScanned : resultsList", resultsList]) //	Testing print
	return (resultsList)
}

function rootServers(ns) {
	let portOpenerList = ['BruteSSH.exe', 'FTPCrack.exe', 'relaySMTP.exe', 'HTTPWorm.exe', 'SQLInject.exe']
	for (let indexPortOpeners = portOpenerList.length - 1; indexPortOpeners >= 0; indexPortOpeners--) {
		if (!ns.fileExists(portOpenerList[indexPortOpeners], "home")) {
			portOpenerList.splice[indexPortOpeners, 1]
		}
	}
	let numberOfOpeners = portOpenerList.length;
	ns.tprint(["rootServers : numberOfOpeners", numberOfOpeners]) //	Testing print
	ns.tprint(["rootServers : portOpenerList", portOpenerList]) //	Testing print
	let rootedServers = []
	let unrootedServers = []
	for (let indexOfServerList = 0; indexOfServerList < serverList.length; indexOfServerList++) {
		let server = serverList[indexOfServerList];
		if (!serverList[server].RootStatus) {
			if (serverList[server].RequiredPorts <= numberOfOpeners) {
				portOpenerList.forEach(program => {
					ns[`${program.split(".")[0].toLowerCase()}`](server)
				});
				ns.nuke(server)
				rootedServers.push(server)
			} else {
				unrootedServers.push(server)
			}
		}
	}
	ns.tprint(`Rooted Servers: ${rootedServers}`);
	ns.tprint(`Unrooted Servers: ${unrootedServers}`);
}
