let maxHashIncome = 24; // The max Hash income the script should pursue.
const buyRate = 200; // The time between purchase attempts.
const waitingRate = 2000; // The time between funds checks.
const buyReserve = 0; // The percentage of funds reserved from purchases.

const spendableFunds = 1 - buyReserve;
const HacknetConst = {
    // Constants for Hacknet Server stats/production
    HashesPerLevel: 0.001,

    // Constants for Hacknet Server purchase/upgrade costs
    BaseCost: 50e3,
    RamBaseCost: 200e3,
    CoreBaseCost: 1e6,
    CacheBaseCost: 10e6,

    PurchaseMult: 3.2, // Multiplier for puchasing an additional Hacknet Server
    UpgradeLevelMult: 1.1, // Multiplier for cost when upgrading level
    UpgradeRamMult: 1.4, // Multiplier for cost when upgrading RAM
    UpgradeCoreMult: 1.55, // Multiplier for cost when buying another core
    UpgradeCacheMult: 1.85, // Multiplier for cost when upgrading cache
    MaxServers: 20, // Max number of Hacknet Servers you can own

    // Constants for max upgrade levels for Hacknet Server
    MaxLevel: 300,
    MaxRam: 8192,
    MaxCores: 128,
    MaxCache: 15,
};

const HacknetMult = {
    // Values are initialized by from functions in initialize().
    level: 0,
    ram: 0,
    core: 0,
    hacknetProduction: 0,
};

/** @param {NS} ns **/
export async function main(ns) {
    ns.disableLog("ALL");
    initialize(ns);
    if (ns.args.length > 0) {
        maxHashIncome = ns.args[0];
    }
    let maxNodes = ns.hacknet.maxNumNodes();
    let currentNodes = ns.hacknet.numNodes();

    ns.print(`Max Nodes: ${maxNodes}`);
    ns.print(`Current Nodes: ${currentNodes}`);
    await productionCheck(ns);

    if (currentNodes == 0) {
        //	Buy first node, if there are none.
        await waitForCash(ns, ns.hacknet.getPurchaseNodeCost());
        ns.hacknet.purchaseNode();
    }

    while (true) {
        await purchaseBestUpgrade(ns);
        await ns.sleep(buyRate);
        await productionCheck(ns);
    }
}

/** @param {NS} ns **/
function initialize(ns) {
    HacknetMult.level = ns.getHacknetMultipliers().levelCost;
    HacknetMult.ram = ns.getHacknetMultipliers().ramCost;
    HacknetMult.core = ns.getHacknetMultipliers().coreCost;
    HacknetMult.hacknetProduction = ns.getBitNodeMultipliers().HacknetNodeMoney;
}

/** @param {NS} ns **/
async function productionCheck(ns) {
    let currentProduction = await totalProductionRate(ns);
    if (currentProduction > maxHashIncome) {
        ns.tprint(
            `Hacknet production = ${currentProduction}, ending Hacknet buildup.`
        );
        ns.print(
            `Hacknet production = ${currentProduction}, exiting buildnet.js`
        );
        ns.exit();
    }
    ns.print(`Current Production: ${currentProduction}`);
    return currentProduction;
}

/** @param {NS} ns **/
async function totalProductionRate(ns) {
    let numServers = ns.hacknet.numNodes();
    let totalProduction = 0;

    for (let index = 0; index < numServers; index++) {
        let server = ns.hacknet.getNodeStats(index);
        totalProduction += server.production;
    }
    return totalProduction;
}

/** @param {NS} ns **/
async function levelUpgradeCost(ns, currentLevel) {
    //  Unpurchasable if at max.
    if (currentLevel >= HacknetConst.MaxLevel) {
        return Infinity;
    }
    //	Constant growth multiplier created from current level.
    let levelGrowthMult = Math.pow(HacknetConst.UpgradeLevelMult, currentLevel);
    //	Returns the expected price of a single upgrade of hacknet level.
    let totalCost =
        10 * HacknetConst.BaseCost * HacknetMult.level * levelGrowthMult;
    return totalCost;
}

/** @param {NS} ns **/
async function ramUpgradeCost(ns, currentRam) {
    //  Unpurchasable if at max.
    if (currentRam >= HacknetConst.MaxRam) {
        return Infinity;
    }
    //  Number of upgrades calculated from current Ram
    let numUpgrades = Math.round(Math.log2(currentRam));
    //	Constant growth multiplier created from current ram level.
    let ramGrowthMult = Math.pow(HacknetConst.UpgradeRamMult, numUpgrades);
    //	Returns the expected price of a single upgrade of hacknet ram.
    let totalCost =
        HacknetConst.RamBaseCost * currentRam * HacknetMult.ram * ramGrowthMult;
    return totalCost;
}

/** @param {NS} ns **/
async function coreUpgradeCost(ns, currentCores) {
    //  Unpurchasable if at max.
    if (currentCores >= HacknetConst.MaxCores) {
        return Infinity;
    }
    //	Constant growth multiplier created from current core level.
    let coreGrowthMult = Math.pow(
        HacknetConst.UpgradeCoreMult,
        currentCores - 1
    );
    //	Returns the expected price of a single upgrade of hacknet ram.
    let totalCost =
        HacknetConst.CoreBaseCost * HacknetMult.core * coreGrowthMult;
    return totalCost;
}

/** @param {NS} ns **/
async function calcHashGainRate(ns, level, ram, cores) {
    const baseGain = HacknetConst.HashesPerLevel * level;
    const ramMultiplier = Math.pow(1.07, Math.log2(ram));
    const coreMultiplier = 1 + (cores - 1) / 5;
    let hashGainRate =
        baseGain *
        ramMultiplier *
        coreMultiplier *
        HacknetMult.hacknetProduction;
    return hashGainRate;
}

/** @param {NS} ns **/
async function purchaseBestUpgrade(ns) {
    let numServers = ns.hacknet.numNodes();

    let resultsList = [];
    for (let index = 0; index < numServers; index++) {
        let bestServerRatio = await bestRatio(ns, index);
        resultsList.push(bestServerRatio);
    }
    let bestValue = Math.max(...resultsList);
    let indexOfBestServer = resultsList.indexOf(bestValue);

    let bestServer = ns.hacknet.getNodeStats(indexOfBestServer);
    let serverRatios = await upgradeRatios(
        ns,
        bestServer.level,
        bestServer.ram,
        bestServer.cores
    );
    let serversBestRatio = Math.max(...serverRatios);
    let bestUpgrade = serverRatios.indexOf(serversBestRatio);

    let cost = 0;
    let nodeCost = ns.hacknet.getPurchaseNodeCost();
    // 0 = level, 1 = ram, 2 = cores;
    if (bestUpgrade === 0) {
        cost = await levelUpgradeCost(ns, bestServer.level);
        await waitForCash(ns, cost);
        ns.hacknet.upgradeLevel(indexOfBestServer, 1);
    } else if (bestUpgrade === 1) {
        cost = await ramUpgradeCost(ns, bestServer.ram);
        await waitForCash(ns, cost);
        ns.hacknet.upgradeRam(indexOfBestServer, 1);
    } else if (bestUpgrade === 2) {
        cost = await coreUpgradeCost(ns, bestServer.cores);
        await waitForCash(ns, cost);
        ns.hacknet.upgradeCore(indexOfBestServer, 1);
    } else {
        ns.print(`bestNodeUpgrade Error: index = ${indexOfBestServer};`);
        ns.print(`
        Values: level = ${serverRatios[0]}, 
                ram = ${serverRatios[1]}, 
                cores = ${serverRatios[2]},
                best = ${bestRatio}.
        `);
        ns.exit();
    }
    if ((cost * 2) > nodeCost) {
        await waitForCash(ns, nodeCost);
        ns.hacknet.purchaseNode();
    }
}

/** @param {NS} ns **/
async function bestRatio(ns, index) {
    let stats = ns.hacknet.getNodeStats(index);
    let ratios = await upgradeRatios(ns, stats.level, stats.ram, stats.cores);
    // 0 = level, 1 = ram, 2 = cores;
    let bestServerValue = Math.max(ratios[0], ratios[1], ratios[2]);
    return bestServerValue;
}

/** @param {NS} ns **/
async function upgradeRatios(ns, level, ram, cores) {
    let baseGain = await calcHashGainRate(ns, level, ram, cores);

    let levelCost = await levelUpgradeCost(ns, level);
    let levelGain = await calcHashGainRate(ns, level + 1, ram, cores);
    let levelRatio = (levelGain - baseGain) / levelCost;

    let ramCost = await ramUpgradeCost(ns, ram);
    let ramGain = await calcHashGainRate(ns, level, ram + 1, cores);
    let ramRatio = (ramGain - baseGain) / ramCost;

    let coresCost = await coreUpgradeCost(ns, cores);
    let coresGain = await calcHashGainRate(ns, level, ram, cores + 1);
    let coresRatio = (coresGain - baseGain) / coresCost;

    let results = [levelRatio, ramRatio, coresRatio];

    return results;
}

/** @param {NS} ns **/
async function waitForCash(ns, cost) {
    let value = cost;
    ns.print(`Value of next purchase: ${value}`);
    if (ns.getServerMoneyAvailable("home") * spendableFunds < cost)
        ns.print(`Not enough money. Waiting for funds to reach: ${cost}`);
    while (ns.getServerMoneyAvailable("home") * spendableFunds < cost)
        await ns.sleep(waitingRate);
}
