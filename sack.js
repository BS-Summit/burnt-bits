/** @param {NS} ns **/
/*
 * args[0-n] - Names of target servers
 */
export async function main(ns, args) {
	await ns.killall;
	let targets = ns.args;
	let hackScript = "rob.js";
	let scriptRam = ns.getScriptRam(hackScript);
	let serverRam = ns.getServerMaxRam("home");
	let maxThreads = Math.floor(serverRam / scriptRam);

	for (let i = targets.length - 1; i >= 0; i--) {
		let target = ns.args[i]
		let targetMoney = ns.getServerMaxMoney(target) * 0.9;
		let threads = Math.floor(maxThreads / targets.length);
		let paydayCalc = Math.round(targetMoney / threads);
		let payday = paydayCalc.toString().length;
		ns.tprint(`Home is hacking ${target} with ${threads} threads. Payday is ~${payday}.`);
		if (i == 0) {
			ns.spawn(hackScript, threads, target, threads);
		} else {
			ns.run(hackScript, threads, target, threads);
		}
	}
}
