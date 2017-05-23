(function() {
  let players = []
  let matches = []
  let playersToAdd = []
  // let apiBase = 'http://sample-env.sfshjzcpr2.us-west-2.elasticbeanstalk.com'
  let apiBase = 'http://localhost:2000'

  window.onload = function() {
    const playersContainer = document.querySelector('#players-container')
    const addPlayerContainer = document.querySelector('#add-player-container')
    const matchesContainer = document.querySelector('#matches-container')
    const searchPlayersInput = addPlayerContainer.querySelector('#add-player-input')
    const searchPlayersList = addPlayerContainer.querySelector('#add-player-list')
    const searchHint = document.querySelector('h3.hint')

    const listEls = document.querySelectorAll('#app-nav li')
    listEls.forEach(function(listEl, index) {
      var anchor = listEl.querySelector('a')
      anchor.addEventListener(
        'click',
        selectSection.bind(null, index ? 'matches' : 'players')
      )
    })

    const addPlayerButton = document.querySelector('#add-player')
    addPlayerButton.addEventListener('click', selectSection.bind(null, 'add-player'))

    function selectSection(section) {
      if (searchPlayersInput.value) {
        searchPlayersInput.value = ''
        renderPlayersToAdd()
      }

      switch (section) {
        case 'players':
          playersContainer.style.display = 'block'
          matchesContainer.style.display = 'none'
          addPlayerContainer.style.display = 'none'
          listEls[0].className = "selected"
          listEls[1].className = ""
          break
        case 'matches':
          playersContainer.style.display = 'none'
          matchesContainer.style.display = 'block'
          addPlayerContainer.style.display = 'none'
          listEls[0].className = ""
          listEls[1].className = "selected"
          break
        case 'add-player':
          playersContainer.style.display = 'none'
          matchesContainer.style.display = 'none'
          addPlayerContainer.style.display = 'block'
          listEls[0].className = ""
          listEls[1].className = ""
          break
        default:
          break
      }
    }

    function renderMatches(i) {
      const upcomingPlayerMatches = renderMatchList(i)

      if (players[i]) {
        searchHint.innerHTML = (
          `${upcomingPlayerMatches.length} upcoming ` +
          `matches for player: <span class="filter-tag">` +
          `${players[i].name}<i class="mdi mdi-close filter-close-icon"></i><span>`
        )

        /*
         * Add listener for removing filter
         */
        const filterTag = searchHint.querySelector('.filter-tag')
        filterTag.addEventListener('click', renderMatches.bind(null, null))

      } else {
        searchHint.innerHTML = (
          `${upcomingPlayerMatches.length} upcoming matches for ` +
          `all players...`
        )
      }
    }

    function handleAddPlayerClick(playerToAdd, el) {
      const alreadyAddedPlayerIndex = players.findIndex(
        (player) => player.id === playerToAdd.id
      )
      if (alreadyAddedPlayerIndex !== -1) {
        removePlayerAtIndex(alreadyAddedPlayerIndex)
      } else {
        players.push(playerToAdd)
        renderPlayers()
        fetchMatches()

        chrome.storage.sync.set({
          players: players
        })
      }

      // Faster, but less intuitive than calling 'renderPlayersToAdd' here
      el.className = alreadyAddedPlayerIndex !== -1 ? '' : 'already-added'
    }

    function renderPlayersToAdd() {
      const value = searchPlayersInput.value.toUpperCase()

      while (searchPlayersList.firstChild) {
        searchPlayersList.firstChild.className = ''
        searchPlayersList.removeChild(searchPlayersList.firstChild);
      }

      if (!value.length) {
        return
      }

      for (var i = 0; i < playerSearchData.length; i++) {
        if (playerSearchData[i].name.indexOf(value) === 0) {
          if (players.some((player) => player.id === playerSearchData[i].id)) {
            playerSearchData[i].el.className = 'already-added'
          }
          searchPlayersList.appendChild(playerSearchData[i].el)
        }
        if (searchPlayersList.children.length >= 8) {
          break
        }
      }
    }

    function fetchPlayersToAdd() {
      return axios.get(apiBase + '/players').then((res) => {
        const playersToAdd = res.data

        playerSearchData = playersToAdd.map(function(playerToAdd, index) {
          const li = document.createElement('li')
          li.addEventListener('click', handleAddPlayerClick.bind(null, playerToAdd, li))
          li.setAttribute('value', playerToAdd.id)
          li.innerText = playerToAdd.name

          return {
            el: li,
            id: playerToAdd.id,
            name: playerToAdd.name.toUpperCase()
          }
        })

        searchPlayersInput.addEventListener('keyup', renderPlayersToAdd)
      })
    }

    function fetchMatches() {
      return new Promise((res, rej) => {
        axios.post(apiBase + '/players/matches', {
          players: players.map((p) => parseInt(p.id, 10))
        })
        .then(function(result) {

           /* If this request is late and player has been already locally... */
          if (result.data.length > players.length) {
            return res(matches)
          }

          matches = result.data
          renderPlayers()
          renderMatches()
          chrome.storage.sync.set({ matches: matches }, () => {
            res(matches)
          })
        })
      })
    }

    function renderMatchList(playerIndex) {
      var matchesList = document.querySelector('#matches-list')
      var sortedMatches = []

      /*
       * Matches is a nested array. SortedMatches is flattened
       * and without duplicates.
       *
       * Match = {
       *   tlpLink: String,
       *   title: String,
       *   timestamp: String
       * }
       *
       * Matches = [Array<Match>, Array<Match>]
       *
       */

      matches.forEach(function(matchList, playerIndex) {

        const uniqueMatches = matchList
        .filter((match) => {
          return !sortedMatches.some((addedMatch) => {
            if (match.eventId === addedMatch.eventId) {
              addedMatch.players.push(playerIndex)
              return true
            } else {
              return false
            }
          })
        })
        .map(function(match) {
          return Object.assign({
            players: [playerIndex]
          }, match)
        })

        sortedMatches.push.apply(sortedMatches, uniqueMatches)
      })
      console.log(sortedMatches)

      sortedMatches = filterByUpcoming(sortedMatches)

      if (playerIndex != null) {
          sortedMatches = sortedMatches.filter((match) =>
            match.players.includes(playerIndex))
      }

      sortedMatches.sort(
        (a, b) => (
          new Date(a.timestamp).getTime() > new Date(b.timestamp).getTime()
          ? 1 : -1
        )
      )

      var matchesHTML = sortedMatches.map((match, index) => {
        var date = new Date(match.timestamp)
        var month = date.toLocaleString('en-us', { month: 'short' })
        var day = date.getDate()
        var hour = date.getHours()
        var minutes = date.getMinutes()
        var playersString = match.players.map((id) => players[id].name).join(', ')

        return (
          `<li class="player">
            <div class="date-container">
              <div class="date-container__month">${month.toUpperCase()}</div>
              <div class="date-container__day">${day < 10 ? `0${day}` : day}</div>
            </div>
            <div class="info-container">
              <h3 class="info-header"><a href="${match.wikiLink}">${match.title}</a></h3>
              <span class="info-subheader">Players: <b>${playersString}</b></span>
              <span class="info-subheader">${hour % 12}:${minutes < 10 ? `0${minutes}` : minutes} ${hour <= 12 ? 'am' : 'pm'} PDT</div>
            </div>
          </li>`
        )
      }).join('\n')

      matchesList.innerHTML = matchesHTML

      /*
       * Add listeners
       */

      const matchLinkTags = matchesList.querySelectorAll('.info-header a')
      for (let i = 0; i < matchLinkTags.length; i++) {
        matchLinkTags[i].addEventListener('click', (e) => {
          console.log(i)
          const wikiUrl = matchLinkTags[i].getAttribute('href')
          chrome.tabs.create({ url: wikiUrl })
        })
      }

      return sortedMatches
    }

    function renderPlayers() {
      const playersList = document.querySelector('#players-list')
      const playersHTML = players.map(function(player, index) {
        return (
          `<li class="player">
            <img class="portrait" src="http://www.teamliquid.net/tlpd/images/players/${player.tlpdID}.jpg">
            <div class="info-container">
              <img class="race-portrait race-portrait--${player.race}" />
              <h3 class="info-header">${player.name}</h3>
              <span class="info-subheader">
                <a href="#" class="filter-link">${matches[index] ? `${filterByUpcoming(matches[index]).length} upcoming matches` : 'Loading match data...'}</a>
              </span>
              <span class="info-subheader">${player.team}</span>
            </div>
            <i class="mdi mdi-minus remove-player"></i>
          </li>`
        )
      }).join('')
      playersList.innerHTML = playersHTML

      /*
       * Add listeners
       */

      const playerElements = document.querySelectorAll('.player .info-subheader a')
      for (let i = 0; i < playerElements.length; i++) {
        playerElements[i].addEventListener('click', () => {
          selectSection('matches')
          renderMatches(i)
        })
      }

      const removeIcons = document.querySelectorAll('i.remove-player')
      for (let i = 0; i < removeIcons.length; i++) {
        removeIcons[i].addEventListener('click', removePlayerAtIndex.bind(null, i))
      }
    }

    function removePlayerAtIndex(index, e) {

      /*
       * So it does not trigger click on parent 'li'
       */

      if (e) {
        e.stopPropagation()
      }

      players.splice(index, 1)
      matches.splice(index, 1)
      chrome.storage.sync.set({
        players, matches
      })
      renderPlayers()
      renderMatches()
    }

    Promise.all([
      new Promise((res, rej) => {
        chrome.storage.sync.get('players', function(fetched) {
          players = fetched.players
          renderPlayers()
          res()
        })
      }),
      new Promise((res, rej) => {
        chrome.storage.sync.get('matches', function(fetched) {
          matches = fetched.matches
          res()
        })
      })
    ])
    .then(() => {
        /* Render players again once matches and data have both been fetched */
        renderPlayers()
        renderMatches()
        fetchMatches()
    })

    fetchPlayersToAdd()

    selectSection('matches')
  }

  function filterByUpcoming(matches) {
    return matches.filter(function(a, b) {
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
})()
