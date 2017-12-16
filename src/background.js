const normalizr = require('normalizr')
const axios = require('axios')
const util = require('./util')

const getUniqueMatchesOfPlayers = util.getUniqueMatchesOfPlayers

const alarms = [1, 12]
const apiBase = 'http://scbuddy.us-west-2.elasticbeanstalk.com'
// const apiBase = 'http://localhost:2000'

const dateOptions = {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute:'2-digit'
}

chrome.alarms.create('fetchAndCheckForNotifications', {
  when: 0,
  periodInMinutes: 5
})

chrome.alarms.onAlarm.addListener((alarm) => {
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
        chrome.notifications.create(match.wikiLink + `#${timeUntilEvent}`, {
          title: 'SCBuddy | Upcoming match',
          message: `${playersString} ${playVerb} "${match.title}" in under ${Math.ceil(timeUntilEvent / 1000 / 60 / 60)} hours`,
          contextMessage: new Date(match.timestamp).toLocaleString('en-US', dateOptions),
          type: 'basic',
          iconUrl: 'SCBuddyLogo128.png'
        })
      })
    })
  }
})

function getMatchesThatNeedNotifications([notifications, [matches, players]]) {
  const dateNow = new Date()

  const uniqueMatches = getUniqueMatchesOfPlayers(matches, players)
  const relevantNotifications = getRelevantNotifications(notifications, uniqueMatches)
  const matchesThatNeedNotifications = uniqueMatches.filter((match) => {
    const matchDate = new Date(match.timestamp)
    const timeUntilEvent = matchDate.getTime() - dateNow.getTime()

    if (timeUntilEvent < 0) return false

    relevantNotifications[match.eventId] = relevantNotifications[match.eventId] || {}

    let alarmTriggered = false
    alarms.forEach((alarmTime) => {
      if (
        relevantNotifications[match.eventId][alarmTime] === undefined &&
        timeUntilEvent < (alarmTime * 60 * 60 * 1000)
      ) {
        relevantNotifications[match.eventId][alarmTime] = true
        alarmTriggered = true
      }
    })

    return alarmTriggered
  })

  chrome.storage.sync.set({ notifications: relevantNotifications })

  return [matchesThatNeedNotifications, players]
}

function getRelevantNotifications(notifications, matches) {
  const validMatchIDs = Object.keys(notifications).filter((matchID) =>
    matches.some((match) => { return match.eventId === matchID})
  )

  return validMatchIDs.reduce(
    (acc, val) => (acc[val] = notifications[val], acc),
    {}
  )
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

chrome.notifications.onClicked.addListener((notificationId, buttonIndex) => {
  chrome.tabs.create({ url: notificationId })
  chrome.notifications.clear(notificationId)
})

chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  chrome.tabs.create({ url: notificationId })
  chrome.notifications.clear(notificationId)
})
