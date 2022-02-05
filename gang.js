/** @param {NS} ns **/
var refreshRate = 1000; // 1 seconds
var gangMemberList = new Object();
var trainingGangMembers = [];
var workingGangMembers = [];
var vigilanteGangMembers = [];
export async function main(ns) {
	var gangMembers = ns.gang.getMemberNames();
	ns.tprint(gangMembers)
	if (initializeMembers(ns, gangMembers)) {
		ns.tprint("Done")
	}
}


export async function initializeMembers(ns, newRecruits) {
	var workSheet = {
		CurrentTask: null,
		TrainingTask: null,
		WorkTask: null,
		VigilanteTask: null
	};
	ns.tprint(newRecruits)
	ns.tprint(newRecruits.length)
	ns.tprint(workSheet)
	//	Add each newRecruit to the gangMemberList with their individual workSheet.
	//	Then initialize their task assignments and shift them to Training.
	for (let recruitIndex = 0; recruitIndex < newRecruits.length; i++) {
		let gangMember = newRecruits[recruitIndex];
		gangMemberList.gangMember = Object.create(workSheet);
		gangMemberList.gangMember[TrainingTask] = "Train Combat";
		gangMemberList.gangMember[WorkTask] = "Mug People";
		gangMemberList.gangMember[VigilanteTask] = "Vigilante Justice";
		ns.tprint("why")
		ns.tprint(recruitIndex)
		ns.tprint(gangMember)
		ns.tprint(gangMemberList[gangMember])
		await trainingShift(ns, gangMember);
	}
	//	Available Combat Tasks:
	//	["Unassigned","Mug People","Deal Drugs","Strongarm Civilians","Run a Con",
	//	"Armed Robbery","Traffick Illegal Arms","Threaten & Blackmail","Human Trafficking",
	//	"Terrorism","Vigilante Justice","Train Combat","Train Hacking","Train Charisma",
	//	"Territory Warfare"]
	//	Available Hacking Tasks:
	//	["Unassigned","Mug People","Deal Drugs","Strongarm Civilians","Run a Con",
	//	"Armed Robbery","Traffick Illegal Arms","Threaten & Blackmail","Human Trafficking",
	//	"Terrorism","Vigilante Justice","Train Combat","Train Hacking","Train Charisma",
	//	"Territory Warfare"]
	return (true)
}

//	Updates a gang member's current task to a new task and moves them into their
//	new task's group.
export async function updateWorkerLists(ns, gangMember, newTask) {
	let currentTask = gangMemberList.gangMember[CurrentTask];
	let trainingTask = gangMemberList.gangMember[TrainingTask];
	let workTask = gangMemberList.gangMember[WorkTask];
	let vigilanteTask = gangMemberList.gangMember[VigilanteTask];
	//	Remove the gang member from their previous task list.
	if (currentTask == trainingTask) {
		let gangMemberIndex = trainingGangMembers.indexOf(gangMember);
		trainingGangMembers.splice(gangMemberIndex, 1);
	} else if (currentTask == workTask) {
		let gangMemberIndex = workingGangMembers.indexOf(gangMember);
		workingGangMembers.splice(gangMemberIndex, 1);
	} else if (currentTask == vigilanteTask) {
		let gangMemberIndex = vigilanteGangMembers.indexOf(gangMember);
		vigilanteGangMembers.splice(gangMemberIndex, 1);
	} else {
		return (ns.tprint(`updateWorkerLists currentTask mismatch Error: ${gangMember}, 
				${newTask}, ${currentTask}, ${trainingTask}, ${workTask}, ${vigilanteTask}`));
	}
	//	Add the gang member to their new task list.
	if (newTask == trainingTask) {
		trainingGangMembers.push(gangMember);
	} else if (newTask == workTask) {
		workingGangMembers.push(gangMember);
	} else if (newTask == vigilanteTask) {
		vigilanteGangMembers.push(gangMember);
	} else {
		return (ns.tprint(`updateWorkerLists newTask mismatch Error: ${gangMember}, 
				${newTask}, ${currentTask}, ${trainingTask}, ${workTask}, ${vigilanteTask}`));
	}
	//	Update the gang member's current task.
	gangMemberList.gangMember[CurrentTask] = newTask;
	return (true)
}

//	Shifts a gang member's assignment to training, working, vigilante-ing.
export async function trainingShift(ns, gangMember) {
	if (ns.gang.setMemberTask(gangMember, gangMemberList.gangMember[TrainingTask])) {
		await updateWorkerLists(gangMember, gangMemberList.gangMember[TrainingTask])
		return (true);
	}
	return (false);
}
export async function workShift(ns, gangMember) {
	if (ns.gang.setMemberTask(gangMember, gangMemberList.gangMember[WorkTask])) {
		await updateWorkerLists(gangMember, gangMemberList.gangMember[WorkTask])
		return (true);
	}
	return (false);
}
export async function vigilanteShift(ns, gangMember) {
	if (ns.gang.setMemberTask(gangMember, gangMemberList.gangMember[VigilanteTask])) {
		await updateWorkerLists(gangMember, gangMemberList.gangMember[VigilanteTask])
		return (true);
	}
	return (false);
}
