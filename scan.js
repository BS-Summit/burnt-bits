/** @param {NS} ns **/
//	scan.js
//	Scans all servers in the network, and collects information about them, including
//	a breadcrumb trail usable to backtrace to the home server. 
let serverList = new Object();
let serverListKeys;
let originServer;
let currentServer;
let serverInfo;
let scanResults;
let serverRoute = [];
let backdoorMode = false;
let testMode = false;
let playerHackingLevel;

function modeSelect(ns, userInput) {
	userInput.forEach(mode => {
		switch (mode) {
			case 'bd':
			case 'backdoor':
				backdoorMode = true
				break;
			case 'test':
				testMode = true
				break;
			default:
				ns.tprint(`Sorry, ${mode} is not a recognized mode.`)
		}
	});
}

function testPrint(ns, functionName, variableName, variableData) {
	if (testMode) {
		ns.tprint(`${functionName} -> ${variableName}: ${variableData}`)
	}
}

export async function main(ns, args) {
	if (ns.args.length > 0) { modeSelect(ns, ns.args) }
	
	playerHackingLevel = ns.getHackingLevel()

	//	Initiate home server.
	originServer = null;
	currentServer = "home";
	serverInfo = serverDetails(ns, originServer, currentServer);
	serverList[currentServer] = serverInfo;

	scanResults = ns.scan(currentServer);
	let scanList = addOriginToScanned(ns, currentServer, scanResults);

	recursiveScanning(ns, scanList)
	serverListKeys = Object.keys(serverList)
	
	testPrint(ns,"main","serverListKeys.length",serverListKeys.length)
	
	// rootServers(ns)
	if (backdoorMode) { backdoorServers(ns) } //	Backdoor mode
	// ns.tprint(["Main : serverList[home]", serverList["home"]]) //	Testing print
}

//	Recursively scans and returns all servers on the network of the provided servers.
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
		scanResults = addOriginToScanned(ns, currentServer, ns.scan(currentServer))
		scanList = scanList.concat(scanResults);
	}
	recursiveScanning(ns, scanList)
}

//	Collect server details and return as a dict.
function serverDetails(ns, originServer, currentServer) {
	var requiredPorts = ns.getServerNumPortsRequired(currentServer);
	var rootStatus = ns.hasRootAccess(currentServer);
	var requiredHackSkill = ns.getServerRequiredHackingLevel(currentServer);
	var minimumSecurity = ns.getServerMinSecurityLevel(currentServer);
	var maximumMoney = ns.getServerMaxMoney(currentServer);
	var totalRam = ns.getServerMaxRam(currentServer);
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
			portOpenerList.splice(indexPortOpeners, 1)
		}
	}
	let numberOfOpeners = portOpenerList.length;
	let rootedServers = []
	let unrootedServers = []

	for (let indexOfKeys = 0; indexOfKeys < serverListKeys.length; indexOfKeys++) {
		let server = serverListKeys[indexOfKeys];
		if (!serverList[server].RootStatus) {
			if (serverList[server].RequiredPorts <= numberOfOpeners) {
				portOpenerList.forEach(program => {
					ns[`${program.split(".")[0].toLowerCase()}`](server)
				});
				ns.nuke(server)
				serverList[server].RootStatus = true;
				rootedServers.push(server)
			} else {
				unrootedServers.push(server)
			}
		} else {
			rootedServers.push(server)
		}
	}
	ns.tprint(`Rooted Servers: ${rootedServers}`);
	ns.tprint(`Unrooted Servers: ${unrootedServers}`);
}

//	Backdoor all servers
function backdoorServers(ns) {
	let testerServer = ["CSEC", "avmnite-02h", "I.I.I.I"] // Testing variables
	//serverListKeys.forEach(server => { 
	testerServer.forEach(server => { //	Testing setup
		//if (serverList[server].RootStatus && 
		//	serverList[server].RequiredHackSkill <= playerHackingLevel  && 
		//	!serverList[server].BackdoorStatus)
		//) {
		if (true) { //	Testing setup
			let routeToFollow = routeToServer(ns, server);
			ns.tprint(`Starting from "home"`) // Testing text
			ns.tprint(`Route to Follow: ${routeToFollow}`) // Testing text
			routeToFollow.forEach(stepForward => {
				if (stepForward == routeToFollow[0]) return;
				ns.tprint(`Connecting to -> ${stepForward}`) // Testing text
				//ns.connect(stepForward)
			});
			ns.tprint(`Backdooring ${server}`) // Testing text
			//ns.installBackdoor()
			while (routeToFollow.length > 0) {
				let stepBack = routeToFollow.pop()
				if (stepBack == server) continue;
				ns.tprint(`Connecting back to -> ${stepBack}`) // Testing text
				//ns.connect(stepBack)
			}
		}
	});
}

//	Find the route to a given server
function routeToServer(ns, server) {
	serverRoute.push(server)
	if (server == "home") {
		let routeOutput = serverRoute.reverse()
		serverRoute = []
		return (routeOutput)
	}
	return (routeToServer(ns, serverList[server].OriginServer))
}
