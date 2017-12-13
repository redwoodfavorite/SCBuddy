const React = require('react')
const filterByUpcoming = require('./util').filterByUpcoming

module.exports = function PlayerListItem(props) {
  const playerMatches = props.playerMatches
  const player = props.player

  /*
   * "-" or "(Unknown/Retired)" team name is rendered as squiggly instead
   * because it looks better.  TODO: Fix this in DB instead.
   */

  const team = (
    player.team === '-' ||
    player.team === '(Unknown/Retired)'
  ) ? '~' : player.team

  const portraitSrc = props.renderDefaultPortrait
    ? 'http://www.teamliquid.net/images/liquibet/players/noimage.jpg'
    : `http://www.teamliquid.net/tlpd/images/players/${player.tlpdID}.jpg`

  return (
    <li className="player">
      <img
        className="portrait"
        src={portraitSrc}
        onError={props.onPortraitNotLoaded}
      />
      <div className="info-container">
        <img className={`race-portrait race-portrait--${player.race}`} />
        <h3 className="info-header">{player.name}</h3>
        <span className="info-subheader">
          <a
            onClick={props.onFilterByPlayer}
            className="filter-link"
          >
            {(playerMatches
              ? `${filterByUpcoming(playerMatches).length} upcoming matches`
              : 'Loading match data...'
            )}
          </a>
        </span>
        <span className="info-subheader">{`Team: ${team}`}</span>
      </div>
      <i
        className="mdi mdi-minus remove-player"
        onClick={props.removePlayerAction}>
      </i>
    </li>
  )
}
