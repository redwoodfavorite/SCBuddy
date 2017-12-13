const React = require('react')
const Store = require('./Store')
const MatchListItem = require('./MatchListItem')
const PlayerListItem = require('./PlayerListItem')

const PLAYERS = 0
const MATCHES = 1
const PLAYER_SEARCH = 2

class App extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      currentSection: PLAYERS,
      playerIdFilter: null
    }
  }

  filterByPlayerId(playerId) {
    this.setState({
      currentSection: MATCHES,
      playerIdFilter: playerId
    })
  }

  render() {
    // this.state.playerIdFilter == nil
    //   ? this.state.matches

    return (
      <div>
        <nav id="app-nav">
          <ul>
            <li
              className={this.state.currentSection == PLAYERS ? "selected" : ""}
              onClick={() => this.setState({ currentSection: PLAYERS })}
            >
              <a href="#">Players</a>
            </li>
            <li
              className={this.state.currentSection == MATCHES ? "selected" : ""}
              onClick={() => this.setState({ currentSection: MATCHES })}
            >
              <a href="#">Matches</a>
            </li>
          </ul>
          <i
            className="mdi mdi-plus"
            id="add-player"
            onClick={() => this.setState({ currentSection: PLAYER_SEARCH })}
          />
        </nav>
        {this.getCurrentSectionElement()}
        <a
          href="https://github.com/redwoodfavorite/SCBuddy"
          id="signature"
          onClick={() => {
            chrome.tabs.create({
              url: 'https://github.com/redwoodfavorite/SCBuddy'
            })
          }}>SCBuddy
        </a>
      </div>
    )
  }

  getCurrentSectionElement() {
    switch (this.state.currentSection) {
      case PLAYERS:
        return (
          <div id="players-container">
            <ul id="players-list">
              {this.props.subscriptions.length
                ? (this.props.subscriptions.map((player, index) =>
                    <PlayerListItem
                      player={player}
                      key={`player-list-${player.id}`}
                      playerMatches={this.props.matches[player.id]}
                      renderDefaultPortrait={false}
                      onPortraitNotLoaded={() => { }}
                      onFilterByPlayer={() => this.filterByPlayerId(player.id)}
                      removePlayerAction={() => this.props.removePlayerAction(player.id)}
                    />
                  ))
                : <h3 className="hint">Click the "plus" button to add a player!</h3>
              }
            </ul>
          </div>
        )
      case MATCHES:
        return (
          <div id="matches-container">
            <HintContainer
              playerIdFilter={this.state.playerIdFilter}
              player={this.props.players[this.state.playerIdFilter]}
              upcomingMatches={this.props.upcomingMatches}
              onClearFilter={() => this.filterByPlayerId(null)}
            />
            <ul id="matches-list">
              {this.props.upcomingMatches.map(match =>
                <MatchListItem match={match} subscriptions={this.props.subscriptions} key={`match-list-${match.eventId}`}/>
              )}
            </ul>
          </div>
        )
      case PLAYER_SEARCH:
        return (
          <div id="add-player-container">
            <center>
              <div className="add-player-dropdown">
                  <input
                    id="add-player-input"
                    placeholder="Search for a player..."
                    value={this.state.playerSearchQuery}
                    onChange={(event) => this.setState({
                      playerSearchQuery: event.target.value
                    })}
                  />
                  <i className="mdi mdi-magnify input-icon"></i>
                  <ul id="add-player-list">
                    {
                      this.state.playerSearchQuery &&
                      Object.values(this.props.players)
                        .filter(
                          player => player.name
                              .toUpperCase()
                              .indexOf(this.state.playerSearchQuery.toUpperCase()) === 0
                        )
                        .slice(0, 8)
                        .map((player, index) => {
                          let alreadyAdded = this.props.subscriptions.some(
                            sub => sub.id === player.id
                          )
                          return (
                            <li
                              className={alreadyAdded ? 'already-added' : ''}
                              onClick={() => this.props.addPlayerAction(player)}
                              key={`player-search-${player.id}`}
                            >{player.name}
                            </li>
                          )
                        })
                    }
                  </ul>
                  <i className="mdi mdi-refresh" id="refresh"></i>
              </div>
            </center>
          </div>
        )
    }

    return null
  }
}

function HintContainer(props) {
  return props.playerIdFilter != null
    ? <h3 className="hint">
        {`${props.upcomingMatches.length} upcoming ` +
        `matches for player: `}
        <span className="filter-tag" onClick={props.onClearFilter}>
          {props.player.name}
          <i className="mdi mdi-close filter-close-icon"></i>
        </span>
      </h3>
    : <h3 className="hint">
        {`${props.upcomingMatches.length} upcoming matches for ` +
        `all players...`}
      </h3>
}

module.exports = App
