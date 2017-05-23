const alarms = [1, 12]
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
      fetchNotifications()
      .then(fetchMatches),
      fetchPlayers()
    ])
    .then(([matches, players]) => {
      if (matches.length) {
        const playersString = matches[0].players
          .map((i) => players[i].name).join(',')

        const dateNow = new Date()
        const matchTime = new Date(matches[0].timestamp)
        const timeUntilEvent = matchTime.getTime() - dateNow.getTime()

        // Sort by most recent
        matches.sort(
          (a, b) => (
            new Date(a.timestamp).getTime() > new Date(b.timestamp).getTime()
            ? 1 : -1
          )
        )

        // Putting wikiLink in notificationId...
        chrome.notifications.create(matches[0].wikiLink, {
          title: 'SCBuddy | Upcoming match',
          message: `${playersString} plays "${matches[0].title}" in ${Math.round(timeUntilEvent / 1000 / 60 / 60)} hours`,
          contextMessage: new Date(matches[0].timestamp).toLocaleString('en-US', dateOptions),
          buttons: [{ title: 'Liquipedia Page', iconUrl: 'liquipedia_logo.png' }],
          type: 'basic',
          iconUrl: 'marauder.jpg'
        })
      }
    })
  }
})

chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  chrome.tabs.create({ url: notificationId })
  chrome.notifications.clear(notificationId)
})

function fetchMatches(notifications) {
  const dateNow = new Date()
  const endDate = new Date()
  endDate.setDate(dateNow.getHours() + 6)

  return new Promise((res, rej) => {
    chrome.storage.sync.get('matches', (data) => {
      const matches = data.matches || []

      const flattened = matches.reduce((acc, val, i) =>
        ([ ...acc, ...val.map((a) => Object.assign(a, { players: [i] })) ])
      , [])

      const upcomingMatches = flattened.filter((match) => {
        const matchDate = new Date(match.timestamp)
        const timeUntilEvent = matchDate.getTime() - dateNow.getTime()

        if (timeUntilEvent < 0) return false

        const eventIdString = `${match.title}-${match.timestamp}`
        const eventNotifications = notifications[eventIdString] = notifications[eventIdString] || {}
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

      res(upcomingMatches)
    })
  })
}

function fetchNotifications() {
  return new Promise((res, rej) => {
    chrome.storage.sync.get('notifications', (data) => {
      res(data.notifications || {})
    })
  })
}

function fetchPlayers() {
  return new Promise((res, rej) => {
    chrome.storage.sync.get('players', (data) => {
      res(data.players || [])
    })
  })
}
