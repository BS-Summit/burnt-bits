//  scan.js
//  Scans all servers in the network, and collects information about them, including
//  a breadcrumb trail usable to backtrace to the home server. 
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

/** @param {NS} ns **/
export async function main(ns, args) {
    if (ns.args.length > 0) { modeSelect(ns, ns.args) }
    ns.tprint(`backdoorMode = ${backdoorMode}`);
    ns.tprint(`testMode = ${testMode}`);
    playerHackingLevel = ns.getHackingLevel();

    //  Initiate home server.
    originServer = null;
    currentServer = "home";
    if (!ns.fileExists("bdComplete.js", currentServer)) { ns.tprint("bdComplete.js missing, please create.") }
    serverInfo = serverDetails(ns, originServer, currentServer);
    serverList[currentServer] = serverInfo;
    scanResults = ns.scan(currentServer);
    let scanList = addOriginToScanned(ns, currentServer, scanResults);

    await recursiveScanning(ns, scanList);
    serverListKeys = Object.keys(serverList);

    await markOwnedServers(ns);
    await testPrint(ns, `main -> serverListKeys.length: ${serverListKeys.length}`);

    await rootServers(ns) // Root all available servers.
    if (backdoorMode) { await backdoorServers(ns) } //  Backdoor mode: Backdoor all available servers.

    await testPrint(ns, "After backdoorServers check."); // Test text
}

/** @param {NS} ns **/
function modeSelect(ns, userInput) {
    userInput.forEach(mode => {
        switch (mode) {
            case 'bd':
            case 'backdoor':
                backdoorMode = true;
                break;
            case 'test':
                testMode = true;
                break;
            default:
                ns.tprint(`Sorry, ${mode} is not a recognized mode.`);
        }
    });
}

/** @param {NS} ns **/
async function testPrint(ns, printText) {
    if (testMode) {
        ns.tprint(printText);
    }
}

/** @param {NS} ns **/
async function markOwnedServers(ns) {
    let ownedServers = ns.getPurchasedServers()
    for (const eachServer of ownedServers) {
        if (serverList[eachServer].BackdoorStatus == true) { continue }
        await ns.scp("bdComplete.js", "home", eachServer)
        serverList[eachServer].BackdoorStatus = true;
    }
}

//  Recursively scans and returns all servers on the network of the provided servers.
/** @param {NS} ns **/
async function recursiveScanning(ns, scanList) {
    if (scanList.length == 0) { return }
    let serverArray = scanList.pop();
    currentServer = serverArray[1];
    //ns.tprint(["recursiveScanning : currentServer",currentServer])
    if (!serverList[currentServer]) {
        originServer = serverArray[0];
        serverInfo = serverDetails(ns, originServer, currentServer);
        serverList[currentServer] = serverInfo;
        //ns.tprint(["recursiveScanning : IF : originServer",originServer])
        scanResults = addOriginToScanned(ns, currentServer, ns.scan(currentServer));
        scanList = scanList.concat(scanResults);
    }
    recursiveScanning(ns, scanList);
}

//  Collect server details and return as a dict.
/** @param {NS} ns **/
function serverDetails(ns, originServer, currentServer) {
    var requiredPorts = ns.getServerNumPortsRequired(currentServer);
    var rootStatus = ns.hasRootAccess(currentServer);
    var requiredHackSkill = ns.getServerRequiredHackingLevel(currentServer);
    var minimumSecurity = ns.getServerMinSecurityLevel(currentServer);
    var maximumMoney = ns.getServerMaxMoney(currentServer);
    var totalRam = ns.getServerMaxRam(currentServer);
    var backdoorStatus = ns.fileExists("bdComplete.js", currentServer)
    var serverDetailsDict = {
        OriginServer: originServer,
        RequiredPorts: requiredPorts,
        RootStatus: rootStatus,
        RequiredHackSkill: requiredHackSkill,
        BackdoorStatus: backdoorStatus,
        MinimumSecurity: minimumSecurity,
        MaximumMoney: maximumMoney,
        TotalRam: totalRam
    };
    return (serverDetailsDict);
}

//  Takes the origin server and an array of results from a scan, then returns an
//  array of paired arrays including the origin server and the scanned servers.
/** @param {NS} ns **/
function addOriginToScanned(ns, originServer, scanResults) {
    //ns.tprint(["addOriginToScanned : scanResults", scanResults]) //   Testing print
    var resultsList = []
    for (let scannedServer of scanResults) {
        resultsList.push([originServer, scannedServer])
    }
    //ns.tprint(["addOriginToScanned : resultsList", resultsList]) //   Testing print
    return (resultsList)
}

/** @param {NS} ns **/
async function rootServers(ns) {
    let portOpenerList = ['BruteSSH.exe', 'FTPCrack.exe', 'relaySMTP.exe', 'HTTPWorm.exe', 'SQLInject.exe']
    for (let indexPortOpeners = portOpenerList.length - 1; indexPortOpeners >= 0; indexPortOpeners--) {
        if (!ns.fileExists(portOpenerList[indexPortOpeners], "home")) {
            portOpenerList.splice(indexPortOpeners, 1)
        }
    }
    let numberOfOpeners = portOpenerList.length;
    let rootedServers = [];
    let unrootedServers = [];

    for (let indexOfKeys = 0; indexOfKeys < serverListKeys.length; indexOfKeys++) {
        let server = serverListKeys[indexOfKeys];
        if (!serverList[server].RootStatus) {
            if (serverList[server].RequiredPorts <= numberOfOpeners) {
                portOpenerList.forEach(program => {
                    ns[`${program.split(".")[0].toLowerCase()}`](server)
                });
                ns.nuke(server)
                serverList[server].RootStatus = ns.hasRootAccess(server);
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

//  Backdoor all applicable servers.
/** @param {NS} ns **/
async function backdoorServers(ns) {
    for (const server of serverListKeys) {
        if (serverList[server].RootStatus &&
            serverList[server].RequiredHackSkill <= playerHackingLevel &&
            serverList[server].BackdoorStatus === false) {
            let routeToFollow = routeToServer(ns, server);
            await testPrint(ns, `Starting from "home"`); // Testing text
            await testPrint(ns, `Route to Follow: ${routeToFollow}`); // Testing text
            for (const stepForward of routeToFollow) {
                if (stepForward == routeToFollow[0]) continue;
                await testPrint(ns, `Connecting to -> ${stepForward}`); // Testing text
                ns.connect(stepForward)
            }
            //  Set buffer to account for variable runtimes.
            let timeBuffer = 200;
            let backdoorInstallTime = ((ns.getHackTime(server) / 4) + timeBuffer)

            ns.tprint(`Backdooring ${server}. Time estimate ~${backdoorInstallTime}`)

            await ns.installBackdoor()
            await ns.asleep(backdoorInstallTime)
            await ns.scp("bdComplete.js", "home", currentServer)
            if (ns.fileExists("bdComplete.js", currentServer)) {
                serverList[server].BackdoorStatus = true;
                ns.tprint(`Backdooring ${server} successful.`)
            } else { ns.tprint(`Backdooring ${server} unsuccessful.`) }

            ns.tprint(serverList[server])
            while (routeToFollow.length > 0) {
                let stepBack = routeToFollow.pop()
                if (stepBack == server) continue;
                await testPrint(ns, `Connecting back to -> ${stepBack}`) // Testing text
                ns.connect(stepBack)
            }
        }
    }
}

//  Find the route to a given server
/** @param {NS} ns **/
function routeToServer(ns, server) {
    serverRoute.push(server)
    if (server == "home") {
        let routeOutput = serverRoute.reverse()
        serverRoute = []
        return (routeOutput)
    }
    return (routeToServer(ns, serverList[server].OriginServer))
}
