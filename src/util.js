function getUniqueMatchesOfPlayers(matches, subscriptions) {
  const matchesByPlayer = subscriptions.map(player => matches[player.id] || [])

  let uniqueMatches = []

  matchesByPlayer.forEach((matchList, playerIndex) => {
    const playerId = subscriptions[playerIndex].id
    const uniqueMatchesFromPlayer = matchList
    .filter((match) => {
      return !uniqueMatches.some((addedMatch) => {
        if (match.eventId === addedMatch.eventId) {
          addedMatch.players.push(playerId)
          return true
        } else {
          return false
        }
      })
    })
    .map(match =>
      Object.assign({
        players: [playerId]
      }, match)
    )

    uniqueMatches.push.apply(
      uniqueMatches,
      uniqueMatchesFromPlayer
    )
  })
  return uniqueMatches
}

function filterByUpcoming(matches) {
  return matches.filter((a, b) => {
    const matchDate = new Date(a.timestamp)
    const currentDate = new Date()
    const monthFromNowDate = new Date()
    monthFromNowDate.setMonth(currentDate.getMonth() + 1)
    return (
      (matchDate.getTime() > currentDate.getTime()) &&
      (matchDate.getTime() < monthFromNowDate.getTime())
    )
  })
}

module.exports = { getUniqueMatchesOfPlayers, filterByUpcoming }
