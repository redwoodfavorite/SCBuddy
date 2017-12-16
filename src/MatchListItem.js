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
        <div className="match-extras-title-list">
          <span className="match-extras-label" style={{ fontFamily: 'Material Icons', fontSize: 16, marginTop: -2, paddingTop: -2, color: '#bababa' }}>tv</span>
          <p
            className="match-extras-content"
            style={{ marginBottom: 6 }}
            onClick={() => this.setState({ expanded: true })}
          >
              <a className="stream-vod-link">
                {`${match.streams ? match.streams.length : 0} Streams and ${match.vods ? match.vods.length : 0} VOD sources`}
              </a>
          </p>
        </div>
      </div>
    )
  }

  renderExpandedSection() {
    const match = this.props.match

    return (
      <div className="match-extras-container">
        <div className="match-extras-title-list">
          <span className="match-extras-label">Streams</span>
          <p className="match-extras-content">
            {(match.streams && match.streams.length)
              ? (
              match.streams.map((stream, i) => (
                <a
                  key={`stream-${i}`}
                  href="#"
                  className="stream-vod-link"
                  style={{ marginRight: 4 }}
                  onClick={() => {
                    chrome.tabs.create({
                      url: stream.href
                    })
                  }}
                >
                  {stream.title + (i === (match.streams.length - 1) ? " " : ", ")}
                </a>
              ))
            ) : (
              <a>~</a>
            )}
          </p>
        </div>
        <div className="match-extras-title-list" style={{ marginBottom: 6 }}>
          <span className="match-extras-label">VODs</span>
          <p className="match-extras-content">
            {(match.vods && match.vods.length)
              ? (
                match.vods.map((vod, i) => (
                  <a
                      href="#"
                      key={i}
                      className="stream-vod-link"
                      onClick={() => {
                        chrome.tabs.create({
                          url: vod.href
                        })
                      }}
                    >
                    {vod.title + (i === (match.vods.length - 1) ? " " : ", ")}
                  </a>
                ))
              ) : (
                <a>~</a>
              )
            }
          </p>
        </div>
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
    const soonTag = hoursTillEvent < 24 && hoursTillEvent > 0
      && <a className="soon-tag">{`< ${Math.ceil(hoursTillEvent)} hrs`}</a>

    return (
      <li className="player">
        <div className="date-container">
          <div className="date-container__month">{month.toUpperCase()}</div>
          <div className="date-container__day">{day < 10 ? `0${day}` : day}</div>
        </div>
        <div className="info-container">
          <h3 className="info-header">
            <a
              onClick={() => {
                chrome.tabs.create({
                  url: `http://wiki.teamliquid.net/${match.wikiLink}`
                })
              }}
              href="#">
              {match.title}
            </a>
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
