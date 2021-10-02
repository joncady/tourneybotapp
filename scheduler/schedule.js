const { ToadScheduler, SimpleIntervalJob, Task } = require('toad-scheduler')
const { retrieveTwittersAndSets } = require('../helpers/smashgg');
const { tweet } = require('../helpers/tweet');

const INTERVAL = 20;
const scheduler = new ToadScheduler()

// Documentation: https://github.com/kibertoad/toad-scheduler

const startJobWithPhaseId = async (phaseId) => {
    const task = new Task("fetchTwitters", async () => {
        console.log("Checking sets.")
        let { playerTwitterSets, completed } = await retrieveTwittersAndSets(phaseId);

        if (completed) {
            console.log("Wrapping up scheduler.")
            scheduler.removeById(phaseId);
            return;
        }
        if (playerTwitterSets.length > 0) {
            console.log("Found sets to alert: ", playerTwitterSets);
            playerTwitterSets.forEach(set => {
                set.playerTwitters.forEach(twitter => {
                    tweet("<accessToken>", "<accessSecret>", twitter);
                })
            })
        }

    })
    const job = new SimpleIntervalJob({ seconds: INTERVAL, runImmediately: true }, task, phaseId);

    scheduler.addSimpleIntervalJob(job)
    console.log("Adding job");
}

const unsubscribe = (phaseId) => {
    //
}

module.exports = {
    startJobWithPhaseId
}