const React = require('react')

module.exports = class MatchListItem extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      expanded: false
    }
  }

  renderClosedSection() {
    const match = this.props.match

    return (
      <div className="match-extras-container">
        <ul className="match-extras-title-list">
          <li style={{ marginBottom: 5, marginTop: -2 }}>tv</li>
        </ul>
        <ul className="match-extras-content-list" style={{ marginBottom: 9 }}>
          <li style={{ marginBottom: 2 }}>
            <a
              href="#"
              onClick={() => { this.setState({ expanded: true }) }}
            >
              {`${match.streams ? match.streams.length : 0} Streams and ${match.vods ? match.vods.length : 0} VOD sources`}
            </a>
          </li>
        </ul>
      </div>
    )
  }

  renderExpandedSection() {
    const match = this.props.match

    return (
      <div className="match-extras-container">
        <ul className="match-extras-title-list">
          <li style={{ marginBottom: 7 }} className="match-extras-title-text">Streams</li>
          <li className="match-extras-title-text">VODs</li>
        </ul>
        <ul className="match-extras-content-list">
          {(match.streams && match.streams.length)
            ? (
              match.streams.map((stream, i) => (
                <li key={`stream-${i}`} style={{ marginBottom: 7 }}>
                  <a
                    href="#"
                    onClick={() => {
                      chrome.tabs.create({
                        url: match.streams[0].href
                      })
                    }}
                  >
                    {stream.title}
                  </a>
                </li>))
            ) : (
              <li style={{ marginBottom: 7 }}>
                <a>N/A</a>
              </li>
            )
          }
          {(match.vods && match.vods.length)
            ? (
              match.vods.map((vod, i) => (
                <li key={`vod-${i}`} style={{ marginBottom: 12 }}>
                  <a
                    href="#"
                    onClick={() => {
                      chrome.tabs.create({
                        url: vod.href
                      })
                    }}
                  >
                    {vod.title}
                  </a>
                </li>
              ))
            ) : (
              <li style={{ marginBottom: 12 }}>
                <a>N/A</a>
              </li>
            )
          }
        </ul>
      </div>
    )
  }

  render() {
    const props = this.props
    const match = props.match
    const dateNow = new Date()
    const date = new Date(match.timestamp)
    const month = date.toLocaleString('en-us', { month: 'short' })
    const day = date.getDate()
    const hour = date.getHours()
    const minutes = date.getMinutes()
    const timezone = date.toString().match(/\(([A-Za-z\s].*)\)/)[1]
    const playersString = match.players.map(
      (id) => props.subscriptions.find(player => player.id === id).name
    ).join(', ')

    const millisecondsUntilEvent = date.getTime() - dateNow.getTime()
    const hoursTillEvent = millisecondsUntilEvent / 1000 / 60 / 60
    const soonTag = hoursTillEvent < 24
      && <a className="soon-tag">{`${Math.ceil(hoursTillEvent)} hrs`}</a>

    return (
      <li className="player">
        <div className="date-container">
          <div className="date-container__month">{month.toUpperCase()}</div>
          <div className="date-container__day">{day < 10 ? `0${day}` : day}</div>
        </div>
        <div className="info-container">
          <h3 className="info-header">
            <a href={`http://wiki.teamliquid.net/${match.wikiLink}`}>{match.title}</a>
          </h3>
          {soonTag}
          <span className="info-subheader">Players: <b>{playersString}</b></span>
          <span className="info-subheader">
            {`${hour % 12}:${minutes < 10 ? `0${minutes}` : minutes} ${hour <= 12 ? 'am' : 'pm'} ${timezone}`}
          </span>
        </div>
        {this.state.expanded ? this.renderExpandedSection() : this.renderClosedSection()}
      </li>
    )
  }
}
