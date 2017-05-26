const alarms = [1, 24]
const apiBase = 'http://Sample-env-1.sfshjzcpr2.us-west-2.elasticbeanstalk.com'

const dateOptions = {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute:'2-digit'
}

chrome.alarms.onAlarm.addListener((alarm) => {
  // return

  if (alarm.name === 'fetchAndCheckForNotifications') {
    Promise.all([
      fetchNotifications(),

      fetchSubscriptions()
      .then(fetchMatches),
    ])
    .then(getMatchesThatNeedNotifications)
    .then(([matches, players]) => {
      matches.forEach((match) => {
        const playersString = match.players
          .map((id) => players.find(player => player.id === id).name)
          .map((playerName, i) => i === match.players.length - 1
            ? playerName
            : i === match.players.length - 2
              ? `${playerName} and `
              : `${playerName}, `)
          .join('')

        const playVerb = match.players.length > 1 ? 'play' : 'plays'

        const dateNow = new Date()
        const matchTime = new Date(match.timestamp)
        const timeUntilEvent = matchTime.getTime() - dateNow.getTime()

        // Sort by most recent
        matches.sort(
          (a, b) => (
            new Date(a.timestamp).getTime() > new Date(b.timestamp).getTime()
            ? 1 : -1
          )
        )

        // Putting wikiLink in notificationId...
        chrome.notifications.create(match.wikiLink, {
          title: 'SCBuddy | Upcoming match',
          message: `${playersString} ${playVerb} "${match.title}" in under ${Math.ceil(timeUntilEvent / 1000 / 60 / 60)} hours`,
          contextMessage: new Date(match.timestamp).toLocaleString('en-US', dateOptions),
          buttons: [{ title: 'Liquipedia Page', iconUrl: 'liquipedia_logo.png' }],
          type: 'basic',
          iconUrl: 'SCBuddyLogo.png'
        })
      })
    })
  }
})

function getMatchesThatNeedNotifications([notifications, [matches, players]]) {
  const dateNow = new Date()

  const uniqueMatches = getUniqueMatchesOfPlayers(matches, players)

  // const flattened = Object.values(matches).reduce((acc, val, i) =>
  //   ([ ...acc, ...val.map((a) => Object.assign(a, { players: [i] })) ])
  // , [])

  const matchesThatNeedNotifications = uniqueMatches.filter((match) => {
    const matchDate = new Date(match.timestamp)
    const timeUntilEvent = matchDate.getTime() - dateNow.getTime()

    if (timeUntilEvent < 0) return false

    const eventNotifications = notifications[match.eventId] = notifications[match.eventId] || {}
    let alarmTriggered = false
    alarms.forEach((alarmTime) => {
      if (
        eventNotifications[alarmTime] === undefined &&
        timeUntilEvent < (alarmTime * 60 * 60 * 1000)
      ) {
        eventNotifications[alarmTime] = true
        alarmTriggered = true
      }
    })

    return alarmTriggered
  })

  chrome.storage.sync.set({ notifications })

  return [matchesThatNeedNotifications, players]
}

/* Make a request request for player matches */
function fetchMatches(subscriptions) {
  return axios.post(apiBase + '/players/matches', {
    players: subscriptions.map(player => player.id)
  })
  .then(res => {
    return [res.data || {}, subscriptions]
  })
}

function fetchNotifications() {
  return new Promise((res, rej) => {
    chrome.storage.sync.get('notifications', (data) => {
      res(data.notifications || {})
    })
  })
}

function fetchSubscriptions() {
  return new Promise((res, rej) => {
    chrome.storage.sync.get('subscriptions', (data) => {
      res(data.subscriptions || [])
    })
  })
}

chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  chrome.tabs.create({ url: notificationId })
  chrome.notifications.clear(notificationId)
})
