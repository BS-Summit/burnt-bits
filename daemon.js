/** @param {NS} ns **/
// Work in progress.
export async function main(ns) {
	let command = ns.args[0];
	ns.args.shift();
	let parameterList = ns.args;
	let parameters = parameterList.join(" ");
	ns.tprint(`Executing command: run ${command}.js, with arguments: ${parameterList}`);
	ns.run(`${command}.js`, 1, parameters);
}
