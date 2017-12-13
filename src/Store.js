const axios = require('axios')
const normalizr = require('normalizr')
const _ = require('underscore')
const util = require('./util')
const React = require('react')
const schemas = require('./schemas')

const getUniqueMatchesOfPlayers = util.getUniqueMatchesOfPlayers
const filterByUpcoming = util.filterByUpcoming

const matchSchema = schemas.matchSchema
const matchListSchema = schemas.matchListSchema
const matchListValuesSchema = schemas.matchListValuesSchema

// const apiBase = 'http://Sample-env-1.sfshjzcpr2.us-west-2.elasticbeanstalk.com'
const apiBase = 'http://localhost:2000'

class Store extends React.Component {

  constructor(props, state) {
    super(props, state)

    this.state = {
      subscriptions: [],
      players: {},
      matches: {}
    }

    this.fetchPlayers()

    this.fetchMatches = _.debounce(this._fetchMatches.bind(this), 300)

    Promise.all([
      new Promise((res, rej) => {
        chrome.storage.sync.get('subscriptions', fetched => {
          const subscriptions = fetched.subscriptions || []
          this.setState({ subscriptions })
          res(subscriptions)
        })
      }),

      new Promise((res, rej) => {
        chrome.storage.sync.get('matches', fetched => {
          var matches = {}
          if (fetched.matches) {
            matches = normalizr.denormalize(
              fetched.matches.result,
              matchListValuesSchema,
              fetched.matches.entities
            )
          } else {
            matches = {}
          }
          this.setState({ matches })
          res(matches)
        })
      })
    ])
    .then(([subscriptions, matches]) => {
      if (subscriptions.length) {
        this._fetchMatches()
      }
    })
  }

  addPlayer(playerToAdd) {
    const alreadyAddedPlayer = this.state.subscriptions.find(
      (player) => player.id === playerToAdd.id
    )

    if (alreadyAddedPlayer !== undefined) {
      this.removePlayerWithId(alreadyAddedPlayer.id)
    } else {
      const subscriptions = [...this.state.subscriptions, playerToAdd]
      this.setState({
        subscriptions
      })
      this.fetchMatches()

      chrome.storage.sync.set({
        subscriptions
      })
    }
  }

  fetchPlayers() {
    return axios.get(apiBase + '/players').then((res) => {
      this.setState({ players: res.data })

      /* Update current subscriptions */
      chrome.storage.sync.set({
        subscriptions: this.state.subscriptions.map((sub) => this.state.players[sub.id])
      })
    })
  }

  removePlayerWithId(playerId) {
    const subscriptions = this.state.subscriptions.filter((sub) => sub.id !== playerId)
    this.setState({ subscriptions })
    chrome.storage.sync.set({
      subscriptions
    })
  }

  clearData() {
    this.setState({ matches: {}, notifications: {}, subscriptions: [] })
    chrome.storage.sync.set({ matches: {}, notifications: {}, subscriptions: [] })
  }

  _fetchMatches() {
    return new Promise((res, rej) => {
      axios.post(apiBase + '/players/matches', {
        players: this.state.subscriptions.map(player => player.id)
      })
      .then((result) => {

         /* If this request is late and player has been already locally... */
        const mergedMatchObject = Object.assign({}, result.data)

        Object.values(mergedMatchObject).forEach(matchListForPlayer => {
          matchListForPlayer.forEach(match => {
            if (match.wikiLink) {
              match.wikiLink = match.wikiLink.replace('http://wiki.teamliquid.net/', '')
            }
          })
        })

        this.state.subscriptions.forEach(player => {
          if (!mergedMatchObject[player.id] && this.state.matches[player.id]) {
            mergedMatchObject[player.id] = this.state.matches[player.id]
          }
        })

        this.setState({ matches: mergedMatchObject })

        const normalizedMatches = normalizr.normalize(
          this.state.matches,
          matchListValuesSchema
        )

        chrome.storage.sync.set({ matches: normalizedMatches }, () => {
          res(this.state.matches)
        })
      })
    })
  }

  render() {
    const RootComponent = this.props.RootComponent

    var upcomingMatches = getUniqueMatchesOfPlayers(
      this.state.matches,
      this.state.subscriptions
    )

    upcomingMatches = filterByUpcoming(upcomingMatches)
    upcomingMatches.sort(
      (a, b) => (
        new Date(a.timestamp).getTime() > new Date(b.timestamp).getTime()
        ? 1 : -1
      )
    )

    const App = this.props.RootComponent

    return (
      <App
        subscriptions={this.state.subscriptions}
        upcomingMatches={upcomingMatches}
        matches={this.state.matches}
        players={this.state.players}
        addPlayerAction={this.addPlayer.bind(this)}
        removePlayerAction={this.removePlayerWithId.bind(this)}
        clearAllDataAction={this.clearData.bind(this)}
      />
    )
  }
}

module.exports = Store
