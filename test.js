/** @param {NS} ns **/
export async function main(ns, args) {
	let command = ns.args[0];
	let parameterList = ns.args.slice(1);
	let threadCheck = parameterList.findIndex(parameter => parameter == "-t");
	let threads = 1;
	if (threadCheck > -1) {
		threads = parameterList[threadCheck + 1];
		parametersList = ns.args.splice(threadCheck, 2);
	}
	let parameters = parameterList.join(" ");
	ns.tprint(`Executing ${command} with ${threads} threads.`);
	if (parameterList.length > 0) { ns.tprint(`Including arguments: ${parameters}`); }
	ns.run(command, threads, parameters);
	//ns.tprint(ns.run(command, threads, parameters));
}
