let setCache = {}

const setIdCache = (setId) => {
    setCache[setId] = true;
}

// will need to be in redis if done in lambda
const bustSetCache = () => {
    setCache = {};
}

const checkSet = (setId) => {
    return setCache[setId]
}

module.exports = {
    setIdCache,
    checkSet
}