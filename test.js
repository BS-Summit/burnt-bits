/** @param {NS} ns **/
export async function main(ns, args) {
	let target = ns.args[0];
	let currentMoney = ns.getServerMoneyAvailable(target);
	let maxMoney = ns.getServerMaxMoney(target);
	ns.tprint(`${target} has \$${currentMoney} of \$${maxMoney} available.`);
}
