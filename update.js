/** @param {NS} ns **/
/*
 * Scans all available servers and attempts to root them. Will then cause those
 * which can hack themselves to do so, and instructs your available servers to 
 * hack those which cannot hack themselves, (or the original set if no dead 
 * servers are available.
 */
export async function main(ns) {
    var serverList = new Set();
    var hackList = [];
    var deadList = [];
    var botList = [];
    var rootedServerList = [];

    let scanned = ns.scan("home");
    var ownedList = ns.getPurchasedServers();
    serverList.add("home");

    /*
     * Start at home, look for servers, add them to list, itterate on list 
     * until there are no servers left to check.
     */
    while (scanned.length > 0) {
        const s = scanned.pop();
        if (!serverList.has(s)) {
            serverList.add(s);
            scanned = scanned.concat(ns.scan(s));
        }
    }
    // Remove purchased servers & home from serverList
    ownedList.forEach(serv => { serverList.delete(serv) })
    serverList.delete("home");
    serverList = Array.from(serverList);

    // Gain root access to any servers that we can.
    ns.tprint("Beginning to root...");
    rootedServerList = (await rootHack(ns, serverList));
    ns.tprint("Root job complete.");

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

    ns.tprint("Remote hack starting...");
    await remoteHack(ns, ownedList, deadList, hackList)
    ns.tprint("Remote hack complete.");

    ns.tprint("Self hack starting...");
    await selfHack(ns, hackList)
    ns.tprint("Self hack complete.");

    // Print the Lists of server information for error & status checking.
    ns.tprint(`Owned: ${ownedList.length}`);
    ns.tprint(`Servers: ${serverList.length}`);
    ns.tprint(`Rooted Servers: ${rootedServerList.length}`);
    ns.tprint(`Hack Servers: ${(hackList.length)}`);
    ns.tprint(`Dead Servers: ${deadList.length}`);
    ns.tprint(`Bot Servers: ${botList.length}`);
    ns.tprint(`==================================================`);
    ns.tprint(`Hack List: ${hackList.join(' ')}`);
    ns.tprint(`Dead List: ${deadList.join(' ')}`);
    ns.tprint(`Bot List: ${botList.join(' ')}`);
}

/*
 * Divies up the deadList servers across my owned servers, 
 * starting mass threaded hacks on each. Inefficent, but effective.
 */
export async function remoteHack(ns, tOwnedList, tDeadList, t2HackList) {
    let myServers = [...tOwnedList];
    let targetServers = [...tDeadList];
    let backupServers = [...t2HackList];
    let hackScript = "hack.js";
    let scriptRam = ns.getScriptRam(hackScript);
    if (targetServers.length == 0) {
        if (backupServers.length == 0) {
            ns.tprint("No servers able to be remote hacked.")
            return (false)
        } else {
            ns.tprint("No dead servers to hack, remote hacking backup servers.")
            targetServers = backupServers
            for (const [index, server] of myServers.entries()) {
                ns.killall(server);
                let serverRam = ns.getServerMaxRam(server);
                let threads = Math.floor(serverRam / scriptRam);
                let serverIndex = index % targetServers.length;
                let targetServer = targetServers[serverIndex];
                let targetSecurity = ns.getServerMinSecurityLevel(targetServer) + 2;
                let targetMoney = ns.getServerMaxMoney(targetServer) * 0.9;
                let paydayCalc = Math.round(targetMoney / threads);
                let payday = paydayCalc.toString().length;
                await ns.scp(hackScript, "home", server);
                if (threads > 0) {
                    ns.tprint(`${server} is hacking ${targetServer} with ${threads} threads. Payday is ~${payday}.`);
                    ns.exec(hackScript, server, threads, targetServer, threads, targetSecurity, targetMoney);
                }
            }
            return (true)
        }
    }
    for (const [index, server] of myServers.entries()) {
        ns.killall(server);
        let serverRam = ns.getServerMaxRam(server);
        let threads = Math.floor(serverRam / scriptRam);
        let serverIndex = index % targetServers.length;
        let targetServer = targetServers[serverIndex];
        let targetSecurity = ns.getServerMinSecurityLevel(targetServer) + 2;
        let targetMoney = ns.getServerMaxMoney(targetServer) * 0.9;
        let paydayCalc = Math.round(targetMoney / threads);
        let payday = paydayCalc.toString().length;
        await ns.scp(hackScript, "home", server);
        if (threads > 0) {
            ns.tprint(`${server} is hacking ${targetServer} with ${threads} threads. Payday is ~${payday}.`);
            ns.exec(hackScript, server, threads, targetServer, threads, targetSecurity, targetMoney);
        }
    }
}

// Sets all hackList servers to hack themselves, those which lack the RAM are unable to comply.
export async function selfHack(ns, tHackList) {
    let targetServers = [...tHackList];
    let hackScript = "hack.js";
    let scriptRam = ns.getScriptRam(hackScript);
    for (let i = targetServers.length - 1; i >= 0; i--) {
        let target = targetServers[i];
        ns.killall(target);
        let targetRam = ns.getServerMaxRam(target);
        let threads = Math.floor(targetRam / scriptRam);
        let targetSecurity = ns.getServerMinSecurityLevel(target) + 2;
        let targetMoney = ns.getServerMaxMoney(target) * 0.9;
        let paydayCalc = Math.round(targetMoney / threads);
        let payday = paydayCalc.toString().length;
        await ns.scp(hackScript, "home", target);
        if (threads > 0) {
            ns.tprint(`${target} is hacking itself with ${threads} threads. Payday is ~${payday}.`);
            ns.exec(hackScript, target, threads, target, threads, targetSecurity, targetMoney);
        }
    }
}

/*
 * Takes in the server list, attempts gain root access to those it doesn't already have.
 * Returns the server list, minus all that were unable to be rooted. 
 */
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
