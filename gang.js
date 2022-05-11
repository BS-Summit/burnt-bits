let myGang = [];
let gangMembers = [];
let ascensionTime = 0; // Tracks last Ascension time
let loop = false; // Determines if we loop infinitely, or once.
const MaxGangSize = 12 // The maximum number of gangmembers you can have.
const WantedLevelBase = 1; // Default minimum Wanted Level
const WantedPenaltyMin = 0.95; // 95% Production, 5% penalty
const WarfareMult = 2; // 2x Opponent Power
const SleepTime = 5000; // 5 seconds
const FullTerritory = 1; // 100% Territory
const MinAscension = 10;
const AscensionTimer = 300000; // Every 5 minutes
const ExitTime = 200; // Time before exiting, to let code complete.
const LaunchOptions = ["loop", "once", "equip", "ascend", "work"];

/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog("ALL");
	if (ns.args.length < 1) {
		await unusableInput(ns);
	}
	ns.tail();
	let userInput = ns.args[0];
	if (await isOptionAvailable(ns, userInput)) {
		myGang = ns.gang.getGangInformation();
		gangMembers = ns.gang.getMemberNames();
		await optionSelect(ns, userInput);
	} else {
		ns.print(`Unexpected error. No valid command.`);
	}
}

/** @param {NS} ns **/
async function unusableInput(ns) {
	unusableInputMsg = `Available arguments: ${LaunchOptions.join(", ")}`;
	await exitScript(ns, unusableInputMsg);
}

async function exitScript(ns, exitMsg) {
	ns.tprint(exitMsg);
	await ns.sleep(ExitTime);
	await ns.exit();
}

/** @param {NS} ns **/
async function isOptionAvailable(ns, userInput) {
	for (
		let optionIndex = LaunchOptions.length - 1;
		optionIndex >= 0;
		optionIndex--
	) {
		if (LaunchOptions[optionIndex] === userInput) {
			return true;
		}
	}
	ns.print(`${userInput} is not a recognized argument.`);
	return await unusableInput(ns);
}

/** @param {NS} ns **/
async function optionSelect(ns, userInput) {
	if (userInput === "loop") {
		loop = true;
		ns.print(`Loop activated, beginning the gang loop.`);
		await gangLoop(ns);
	} else if (userInput === "once") {
		ns.print(`Beginning gang loop, once.`);
		await gangLoop(ns);
	} else if (userInput === "equip") {
		ns.print(`Equiping the gang.`);
		await equip(ns);
	} else if (userInput === "ascend") {
		ns.print(`Attempting an ascension.`);
		await ascension(ns);
	} else if (userInput === "work") {
		ns.print(`Assigning gang to work.`);
		await assignWork(ns);
	}
}

/** @param {NS} ns **/
async function gangLoop(ns) {
	let loopTracker = 0;
	while (true) {
		await recruit(ns);
		await equip(ns);
		if (ascensionCheck(ns)) {
			await ascension(ns);
		}
		await assignWork(ns);
		if (myGang.territory < FullTerritory &&
			!myGang.territoryWarfareEngaged) {
			ns.gang.setTerritoryWarfare(await warfareCheck(ns));
		} else if (myGang.territoryWarfareEngaged && myGang.territory == FullTerritory) {
			ns.gang.setTerritoryWarfare(false);
			ns.print(`Warfare Complete, territory owned: ${myGang.territory * 100}%`);
		}
		if (!loop) {
			let exitMsg = `Single loop complete.`;
			await exitScript(ns, exitMsg);
		}
		await ns.sleep(SleepTime);
		if (++loopTracker % 10 == 0 || loopTracker == 1) {
			ns.print(`Loops completed: ${loopTracker}`);
		}
	}
}

/** @param {NS} ns **/
async function recruit(ns) {
	while (ns.gang.canRecruitMember()) {
		for (let potentialRecruit = 0; potentialRecruit < MaxGangSize; potentialRecruit++) {
			if (ns.gang.recruitMember(potentialRecruit)) {
				ns.print(`Recruited: ${potentialRecruit}`);
			}
		}
	}
	myGang = ns.gang.getGangInformation();
	gangMembers = ns.gang.getMemberNames();
}

/** @param {NS} ns **/
async function equip(ns) {
	let allEquipment = ns.gang.getEquipmentNames();
	for (let memberIndex = 0; memberIndex < gangMembers.length; ++memberIndex) {
		let member = gangMembers[memberIndex];
		let memberInfo = ns.gang.getMemberInformation(member);
		for (let itemIndex = 0; itemIndex < allEquipment.length; ++itemIndex) {
			let equipment = allEquipment[itemIndex];
			if (
				memberInfo.upgrades.indexOf(equipment) == -1 &&
				memberInfo.augmentations.indexOf(equipment) == -1
			) {
				let cost = ns.gang.getEquipmentCost(equipment);
				if (await canAfford(ns, cost)) {
					ns.gang.purchaseEquipment(member, equipment);
					ns.print(`${equipment} purchased for ${member}.`);
				}
			}
		}
	}
}

/** @param {NS} ns **/
async function canAfford(ns, cost) {
	let myCash = ns.getServerMoneyAvailable("home");
	if (myCash >= cost) {
		return true;
	} else {
		return false;
	}
}

/** @param {NS} ns **/
async function ascensionCheck(ns) {
	let currentTime = Date.now();
	if (currentTime - ascensionTime > AscensionTimer) {
		return true;
	} else {
		return false;
	}
}

/** @param {NS} ns **/
async function ascension(ns) {
	let ascensionCandidate = "None";
	let maxGrowth = 0;
	for (let member of gangMembers) {
		let memberGrowth = ns.gang.getAscensionResult(member);
		if (!memberGrowth) { // if member is unable to ascend, skip them.
			continue;
		}
		let combatGrowth =
			memberGrowth.str *
			memberGrowth.def *
			memberGrowth.dex *
			memberGrowth.agi;
		if (combatGrowth > MinAscension && combatGrowth > maxGrowth) {
			ascensionCandidate = member;
			maxGrowth = combatGrowth;
		}
	}
	if (ascensionCandidate == "None") {
		return;
	} else {
		ascensionTime = Date.now();
		gang.ascendMember(ascensionCandidate);
		ns.print(
			`Member ${ascensionCandidate} has ascended with growth potential of ${maxGrowth}x.`
		);
		await equip(ns);
		return;
	}
}

/** @param {NS} ns **/
async function assignWork(ns) {
	let task = "";
	for (let member of gangMembers) {
		let memberInfo = ns.gang.getMemberInformation(member);
		if (memberInfo.str < 50) {
			task = "Train Combat";
		} else if (
			myGang.wantedPenalty < WantedPenaltyMin &&
			myGang.wantedLevel > WantedLevelBase
		) {
			task = "Vigilante Justice";
		} else if (memberInfo.str < 150) {
			task = "Mug People";
		} else if (memberInfo.str < 500) {
			task = "Strongarm Civilians";
		} else if (gangMembers.length < MaxGangSize) {
			task = "Terrorism";
		} else if (myGang.territory < FullTerritory) {
			task = "Territory Warfare";
		} else {
			task = "Traffick Illegal Arms";
		}

		if (memberInfo.task != task) {
			ns.gang.setMemberTask(member, task);
			ns.print(`${member} assigned to ${task}`);
		}
	}
}

/** @param {NS} ns **/
async function warfareCheck() {
	let enemyGangs = ns.gang.getOtherGangInformation();
	let maxPower = 0;
	for (let gangName in enemyGangs) {
		if (gangName == myGang.faction) {
			continue;
		}
		maxPower = Math.max(maxPower, enemyGangs[gangName].power);
	}
	let warfareReady = myGang.power >= maxPower * WarfareMult;
	if (warfareReady) {
		ns.print(`Warfare engaged ${myGang.power} vs ${maxPower}`);
	} else {
		ns.print(`Gang's power: ${myGang.power}.`);
		ns.print(`Opponent's power: ${maxPower}.`);
	}
	return warfareReady;
}
