const { gql } = require('graphql-request');

const eventPhaseQuery = gql`
    query Query($slug: String) {	
        event(slug: $slug) {
            name
            id
            phaseGroups {
                phase {
                    name
                    id
                }
            }
        }  
    }
`

const playerTwittersPerSet = gql`
query PhaseGroup($id: ID) {	
	phase(id: $id) {
        name
        state
        bracketType
        sets(page: 1, perPage: 80, filters: { state: 2 }, sortType: CALL_ORDER) {
            nodes {
                startedAt
                createdAt
                state
                identifier
                id
                station {
                    identifier
                }
                slots {
                    entrant {
                        participants {
                            player {
                                user {
                                authorizations(types: TWITTER) {
                                    externalUsername
                                }
                                }
                            }
                        }
                    }
                }
            }
        }
  }
}
`


module.exports = {
    eventPhaseQuery,
    playerTwittersPerSet
}