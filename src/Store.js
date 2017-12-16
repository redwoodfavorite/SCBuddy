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

const apiBase = 'http://scbuddy.us-west-2.elasticbeanstalk.com'
// const apiBase = 'http://localhost:2000'

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
      this.fetchMatchForPlayer(playerToAdd.id)

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
        subscriptions: this.state.subscriptions
          .filter(sub => sub)
          .map((sub) => this.state.players[sub.id])
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

  fetchMatchForPlayer(playerId) {
    return axios.post(apiBase + '/players/matches', {
      players: [playerId]
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

      return this.state.matches
    })
  }

  _fetchMatches() {
      return Promise.all(this.state.subscriptions.map(player =>
        this.fetchMatchForPlayer(player.id)
      ))
  }

  render() {
    const RootComponent = this.props.RootComponent

    var matches = getUniqueMatchesOfPlayers(
      this.state.matches,
      this.state.subscriptions
    )

    var previousMatches = filterByUpcoming(matches, true)
    previousMatches.sort(
      (a, b) => (
        new Date(a.timestamp).getTime() < new Date(b.timestamp).getTime()
        ? 1 : -1
      )
    )

    var upcomingMatches = filterByUpcoming(matches)
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
        previousMatches={previousMatches}
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
