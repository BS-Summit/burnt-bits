const testTime = 1000;
const commandList = {
    money: "Sell for Money",
    corp: "Sell for Corporation Funds",
    sec: "Reduce Minimum Security",
    max: "Increase Maximum Money",
    study: "Improve Studying",
    gym: "Improve Gym Training",
    learn: "Exchange for Corporation Research",
    rank: "Exchange for Bladeburner Rank",
    skill: "Exchange for Bladeburner SP",
    contract: "Generate Coding Contract"
};
let currentHashes = 0;
let commandCost = 0;
let command = "";
let commandArray = [];
let sleepTime = 0;

/** @param {NS} ns **/
export async function main(ns) {
    //ns.disableLog('sleep')
    commandArray = Object.keys(commandList)
    if (ns.args.length < 1 && ns.args.length > 1) {
        unusableInput(ns);
    }
    let userInput = ns.args[0];
    if (commandSelect(ns,userInput)) {
        command = commandList[userInput];
        while (true) {
            makeHashTrade(ns)
            await ns.sleep(await sleepTest(ns))
        };
    }
}

/** @param {NS} ns **/
function commandSelect(ns, userInput) {
    for (let commandIndex = commandArray.length - 1; commandIndex >= 0; commandIndex--) {
        if (commandArray[commandIndex] === userInput) { 
            return true; }
    }
    ns.tprint(`${userInput} is not a recognized command.`);
    return unusableInput(ns);
}

/** @param {NS} ns **/
function unusableInput(ns) {
    ns.tprint(`Available commands: ${commandArray.join(', ')}`);
    return ns.exit();
}

/** @param {NS} ns **/
async function sleepTest(ns) {
    let testFirstValue = ns.hacknet.numHashes();
    await ns.sleep(testTime)
    let testSecondValue = ns.hacknet.numHashes();
    let hashRate = (testSecondValue - testFirstValue) / testTime
    commandCost = ns.hacknet.hashCost(command)
    if (hashRate > 0) {
        sleepTime = ((commandCost / hashRate) - testTime)
    } else {
        sleepTime = testTime
    }
    sleepTime = sleepTime < 0 ? 0 : sleepTime
    ns.print(`Test values are: ${testFirstValue.toFixed(2)} Hashes & ${testSecondValue.toFixed(2)} Hashes`)
    ns.print(`Hash rate is: ${(hashRate * 1000).toFixed(2)}/s`)
    ns.print(`Total sleep time is: ${((sleepTime + testTime) / 1000).toFixed(2)} seconds`)
    return (sleepTime)
}

/** @param {NS} ns **/
function makeHashTrade(ns) {
    while (currentHashes > costUpdate(ns)) {
        ns.hacknet.spendHashes(command)
    }
}

/** @param {NS} ns **/
function costUpdate(ns) {
    currentHashes = ns.hacknet.numHashes();
    commandCost = ns.hacknet.hashCost(command);
    if (ns.hacknet.hashCapacity() < commandCost) {
        command = "Sell for Money"
        commandCost = ns.hacknet.hashCost(command)
    }
    return (commandCost)
}
