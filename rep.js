/** @param {NS} ns **/
export async function main(ns) {
	let repScript = "share.js";
	let scriptRam = ns.getScriptRam(repScript);
	let serverRam = ns.getServerMaxRam("home");
	let maxThreads = Math.floor(serverRam / scriptRam);
	ns.tprint(`Home is sharing ${maxThreads} threads. Total usage is ${(scriptRam * maxThreads)}GB.`);
	//ns.spawn(repScript, 1, 1); // Testing option.
	ns.spawn(repScript, maxThreads, maxThreads);
}
