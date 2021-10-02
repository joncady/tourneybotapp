const { GraphQLClient } = require('graphql-request');
const { eventPhaseQuery, playerTwittersPerSet } = require('../constants/queries');
const get = require('lodash/get');
const flatten = require('lodash/flatten')
const { checkSet, setIdCache } = require('./setTracker');

const ENDPOINT = "https://api.smash.gg/gql/alpha";

require('dotenv').config()
let firstTime = process.env.DEBUG ? true : false;

const createEventSlug = (tourneyId, eventId) => `tournament/${tourneyId}/event/${eventId}`

const queryValidEvent = async (tourneyId, eventId) => {
    let eventSlug = createEventSlug(tourneyId, eventId);

    const graphQLClient = new GraphQLClient(ENDPOINT, {
        headers: {
            authorization: `Bearer ${process.env.SMASHGG_KEY}`,
        },
    })

    let variables = {
        slug: eventSlug
    }

    try {
        const data = await graphQLClient.request(eventPhaseQuery, variables)
        // filter down to list of ids that include name contains "pool"
        let phases = data.event.phaseGroups.map((phaseObj) => ({ ...phaseObj.phase }));

        let phaseIds = new Set();
        let phaseList = [];
        phases.forEach((phase) => {
            if (!phaseIds.has(phase.id)) {
                phaseIds.add(phase.id);
                phaseList.push(phase);
            }
        })

        return phaseList;
    } catch (err) {
        console.log(err);
    }

}

const retrieveTwittersAndSets = async (phaseId) => {
    const graphQLClient = new GraphQLClient(ENDPOINT, {
        headers: {
            authorization: `Bearer ${process.env.SMASHGG_KEY}`,
        },
    })

    let variable = {
        id: phaseId
    }

    const data = await graphQLClient.request(playerTwittersPerSet, variable)
    let phase = data.phase

    if (phase.state === "COMPLETED") {
        return {
            playerTwitterSets: [],
            completed: true
        }
    }

    const setNodes = get(phase, "sets.nodes");
    let playerTwitterSets = [];
    setNodes.forEach((node) => {
        if (node.state === 2 && node.startedAt > node.createdAt && !checkSet(node.id)) {
            setIdCache(node.id);
            let playerTwitters = node.slots.map((slot) => {
                let participants = get(slot, "entrant.participants");
                if (participants) {
                    let players = flatten(participants.map((participant) => flatten(get(participant, "player.user.authorizations"))))
                    let playerTwitterList = players.filter((player) => player.externalUsername != null).map((player) => player.externalUsername);
                    return playerTwitterList[0]
                } else {
                    return null
                }
            }).filter(set => set);
            if (playerTwitters.length > 0) {
                playerTwitterSets.push({
                    playerTwitters,
                    setId: node.id,
                    identifier: node.identifier,
                    station: node.station && node.station.identifier
                });
            }
        }
    })
    if (firstTime) {
        playerTwitterSets = [];
        firstTime = false;
    } 

    return {
        playerTwitterSets,
        completed: false
    };
}

module.exports = {
    queryValidEvent,
    retrieveTwittersAndSets
}