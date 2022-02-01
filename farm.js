/** @param {NS} ns **/
/*
 * args[0-n] - Names of target servers
 */
export async function main(ns, args) {
	await ns.killall;
	var targetList = ns.args;
	var targets = targetList.join(" ");
	var reservedRam = 0;

	ns.tprint(`  ============================================================================`);
	var serverRam = ns.getServerMaxRam("home");
	ns.tprint(`  Total Available RAM: ${serverRam} GB`)
	var updateScript = "update.js"
	var updateRam = ns.getScriptRam(updateScript);
	ns.tprint(`   Update Script RAM: ${updateRam} GB`)
	var hackScript = "hack.js";
	var scriptRam = ns.getScriptRam(hackScript);
	ns.tprint(`   Hack Script RAM: ${scriptRam} GB`)
	var maxThreads = Math.floor(serverRam / scriptRam);
	var remainingThreads = maxThreads;
	ns.tprint(`  Max Threads: ${maxThreads}`)
	var threads = Math.floor(maxThreads / targetList.length);
	ns.tprint(`   Threads: ${threads} / target`)
	ns.tprint(`  ============================================================================`);
	ns.tprint(`  Farm List:  ${targets}`)
	ns.tprint(`  ----------------------------------------------------------------------------`);
	for (let i = targetList.length - 1; i >= 0; i--) {
		let target = ns.args[i];
		let targetSecurity = ns.getServerMinSecurityLevel(target) + 5;
		let targetMoney = ns.getServerMaxMoney(target) * 0.8;
		let textBufferTarget = " ".repeat(18 - target.length);
		if (i == 0) {
			threads = remainingThreads
			reservedRam = serverRam - (maxThreads * scriptRam);

			//while (reservedRam >= (updateRam + scriptRam)) { threads++; reservedRam -= scriptRam; }
			while (reservedRam < updateRam) { threads--; reservedRam += scriptRam; }

			let payday = Math.floor(Math.log(targetMoney / threads) * 100) / 100;

			let textBufferThread = " ".repeat(8 - threads.toString().length);
			ns.tprint(`  Home               --->${textBufferThread} ${threads} threads  --->  ${target} ${textBufferTarget} \$ ${payday.toFixed(2)}`);
			ns.tprint(`  ============================================================================`);
			let reservedramReadable = Math.floor(reservedRam * 100) / 100;
			ns.tprint(`${reservedramReadable}GB reserved for scripts.`);

			ns.spawn(hackScript, threads, target, threads, targetSecurity, targetMoney);
		} else {
			let payday = Math.floor(Math.log(targetMoney / threads) * 100) / 100;
			let textBufferThread = " ".repeat(8 - threads.toString().length);
			ns.tprint(`  Home               --->${textBufferThread} ${threads} threads  --->  ${target} ${textBufferTarget} \$ ${payday.toFixed(2)}`);
			ns.run(hackScript, threads, target, threads, targetSecurity, targetMoney);
			remainingThreads -= threads;
		}
	}
}
/*
function payday (ns,targetMoney,threads) {
	return Math.floor(Math.log(targetMoney / threads) * 100) / 100;
}
*/
