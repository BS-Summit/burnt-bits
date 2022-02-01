/** @param {NS} ns **/
var crime_list = ["shoplift", "rob store", "mug someone", "larceny", "deal drugs", "traffick illegal arms", "homicide", "grand theft auto", "kidnap", "assassination", "heist"];
var crime_to_commit; ""
var user_input; ""

export async function main(ns) {
	if (ns.args.length < 1) {
		unusable_input(ns);
	}

	user_input = ns.args.join(' ').toLowerCase();

	if (crime_select(ns, user_input)) { crime_to_commit = user_input; }

	while (true) {
		ns.tprint(`Attempting to ${crime_to_commit}.`);
		let time_to_commit_crime = await ns.commitCrime(crime_to_commit);
		let number_of_intervals = 3
		let time_check_interval = time_to_commit_crime / number_of_intervals
		ns.tprint(`Estimated time to complete crime: ${time_to_commit_crime / 1000} seconds.`);
		for (let time_interval = 1; time_interval <= number_of_intervals; time_interval++) {
			if (!ns.isBusy()) { ns.tprint("Ending crime spree."); ns.exit(); }
			await ns.sleep(time_check_interval);
		}
		while (ns.isBusy()) { await ns.sleep(50); }
		ns.tprint(`${crime_to_commit} compleded.`);
	}
}

function crime_select(ns, user_input) {
	for (let crime_list_index = crime_list.length - 1; crime_list_index >= 0; crime_list_index--) {
		if (crime_list[crime_list_index] === user_input) { return true; }
	}
	ns.tprint(`${user_input} is not a recognized crime.`);
	return unusable_input(ns);
}

function unusable_input(ns) {
	ns.tprint(`Available crimes: ${crime_list.join(', ')}`);
	return ns.exit();
}
