/** @param {NS} ns **/
export async function main(ns, args) {
	let i = 0
	ns.tprint(`Share is active. Thread count is ${ns.args[0]}. Time is ${i}.`);
	while (true) {
		await ns.share();
		i++;
		if (toString(i / 100).length == toString(Math.floor(i / 100)).length) {
			ns.tprint(`Share is active. Thread count is ${ns.args[0]}. Time is ${i}.`);
		}
	}
}
