/** @param {NS} ns **/
/*
 * Scans all available servers and attempts to root them. Will then cause those
 * which can hack themselves to do so, and instructs your available servers to 
 * hack those which cannot hack themselves, (or the original set if no dead 
 * servers are available.
 * args[0] if "grow" sets self-hacking servers to grow & weaken, over hacking themselves.
 */
export async function main(ns, args) {
    var serverList = new Set();
    var growTag = 0;
    if (ns.args[0] == "grow") { growTag = 1 }
    var hackList = [];
    var deadList = [];
    var botList = [];
    var rootedServerList = [];

    let scanned = ns.scan("home");
    var ownedList = ns.getPurchasedServers();
    serverList.add("home");

    // Start at home, look for servers, add them to list, itterate on list 
    // until there are no servers left to check.
    while (scanned.length > 0) {
        const scannedServer = scanned.pop();
        if (!serverList.has(scannedServer)) {
            serverList.add(scannedServer);
            scanned = scanned.concat(ns.scan(scannedServer));
        }
    }
    // Remove purchased servers & home from serverList
    ownedList.forEach(serv => { serverList.delete(serv) })
    serverList.delete("home");
    serverList = Array.from(serverList);

    // Gain root access to any servers that we can.
    rootedServerList = (await rootHack(ns, serverList));

    // Remove servers we cannot hack yet.
    for (let i = rootedServerList.length - 1; i >= 0; i--) {
        if (ns.getServerRequiredHackingLevel(rootedServerList[i]) > ns.getHackingLevel()) {
            rootedServerList.splice(i, 1);
        }
    }
    // Create list of hackable servers which can be robbed from.
    for (let i = rootedServerList.length - 1; i >= 0; i--) {
        if (ns.getServerMaxMoney(rootedServerList[i]) > 0) {
            hackList.push(rootedServerList[i]);
        }
    }
    // Create sublist of hackable servers which hold money, but lack the RAM to self-hack.
    for (let i = hackList.length - 1; i >= 0; i--) {
        if (ns.getServerMaxRam(hackList[i]) == 0) {
            deadList.push(hackList[i]);
            hackList.splice(i, 1);
        }
    }
    // Create a list of servers which have no money, but do have enough RAM to hack another server.
    for (let i = rootedServerList.length - 1; i >= 0; i--) {
        if (ns.getServerMaxRam(rootedServerList[i]) > 2 & ns.getServerMaxMoney(rootedServerList[i]) == 0) {
            botList.push(rootedServerList[i]);
        }
    }
    // Prints the Lists of servers for status checking.
    ns.tprint(`============================================================================`);
    ns.tprint(`Servers: ${serverList.length + ownedList.length}`);
    ns.tprint(` Owned: ${ownedList.length}`);
    ns.tprint(` Rooted Servers: ${rootedServerList.length}`);
    ns.tprint(`  Dead Servers: ${deadList.length}`);
    ns.tprint(`  Hack Servers: ${(hackList.length)}`);
    ns.tprint(`  Bot Servers: ${botList.length}`);
    ns.tprint(`============================================================================`);
    ns.tprint(`Bot List:  ${botList.join(' ')}`);
    ns.tprint(`----------------------------------------------------------------------------`);
    await remoteHack(ns, botList, deadList, hackList)
    ns.tprint(`============================================================================`);
    ns.tprint(`Dead List:  ${deadList.join(' ')}`);
    ns.tprint(`----------------------------------------------------------------------------`);
    await remoteHack(ns, ownedList, deadList, hackList)
    ns.tprint(`============================================================================`);
    ns.tprint(`Hack List:  ${hackList.join(' ')}`);
    ns.tprint(`----------------------------------------------------------------------------`);
    await selfHack(ns, growTag, hackList)
    ns.tprint(`============================================================================`);
}

// Divies up the deadList servers across my owned servers, 
// starting mass threaded hacks on each. Inefficent, but effective.
export async function remoteHack(ns, tOwnedList, tDeadList, t2HackList) {
    let myServers = [...tOwnedList];
    let growRun = 0;
    if (myServers.length < 6) { growRun = 1 }
    let targetServers = [...tDeadList];
    let backupServers = [...t2HackList];
    let hackScript = "hack.js";
    let scriptRam = ns.getScriptRam(hackScript);
    let textBufferTarget = 0;
    let textBufferThread = 0;
    let textBufferServer = 0;
    if (targetServers.length == 0) {
        if (backupServers.length > 0) {
            targetServers = backupServers;
            ns.tprint("No dead servers to hack, hacking backup list.");
        } else {
            ns.tprint("No servers able to be remote hacked.")
            return (false)
        }
    }
    for (const [index, server] of myServers.entries()) {
        await ns.killall(server);
        let serverRam = ns.getServerMaxRam(server);
        let threads = Math.floor(serverRam / scriptRam);
        let serverIndex = index % targetServers.length;
        let target = targetServers[serverIndex];
        let targetSecurity = ns.getServerMinSecurityLevel(target) + 5;
        let targetMoney = ns.getServerMaxMoney(target) * 0.8;
        let payday = Math.floor(Math.log(targetMoney / threads) * 100) / 100;
        payday = payday.toFixed(2)
        if (growRun == 1) {
            targetSecurity = ns.getServerMinSecurityLevel(target)
            targetMoney = ns.getServerMaxMoney(target)
            payday = "GROW"
        }
        await ns.scp(hackScript, "home", server);
        if (threads > 0) {
            textBufferServer = " ".repeat(18 - server.length);
            textBufferThread = " ".repeat(8 - threads.toString().length);
            textBufferTarget = " ".repeat(18 - target.length);
            ns.tprint(`${server} ${textBufferServer}--->${textBufferThread} ${threads} threads  --->  ${target} ${textBufferTarget} \$ ${payday}`);
            ns.exec(hackScript, server, threads, target, threads, targetSecurity, targetMoney);
        }
    }
}

// Sets all hackList servers to hack themselves, those which lack the RAM are unable to comply.
export async function selfHack(ns, tgrowTag, tHackList) {
    let targetServers = [...tHackList];
    let growRun = tgrowTag;
    let hackScript = "hack.js";
    let scriptRam = ns.getScriptRam(hackScript);
    let textBufferTarget = 0;
    let textBufferThread = 0;
    for (let i = targetServers.length - 1; i >= 0; i--) {
        let target = targetServers[i];
        await ns.killall(target);
        let targetRam = ns.getServerMaxRam(target);
        let threads = Math.floor(targetRam / scriptRam);
        let targetSecurity = ns.getServerMinSecurityLevel(target) + 5;
        let targetMoney = ns.getServerMaxMoney(target) * 0.8;
        let payday = Math.floor(Math.log(targetMoney / threads) * 100) / 100;
        payday = payday.toFixed(2)
        if (growRun == 1) {
            targetSecurity = ns.getServerMinSecurityLevel(target)
            targetMoney = ns.getServerMaxMoney(target)
            payday = "GROW"
        }
        await ns.scp(hackScript, "home", target);
        if (threads > 0) {
            textBufferTarget = " ".repeat(18 - target.length);
            textBufferThread = " ".repeat(8 - threads.toString().length);
            ns.tprint(`${target} ${textBufferTarget}--->${textBufferThread} ${threads} threads  --->  ${target} ${textBufferTarget} \$ ${payday}`);
            ns.exec(hackScript, target, threads, target, threads, targetSecurity, targetMoney);
        }
    }
}

// Takes in the server list, attempts gain root access to those it doesn't already have.
// Returns the server list, minus all that were unable to be rooted. 
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
