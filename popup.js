(function() {
  let players = {}
  let matches = {}
  let subscriptions = []

  const apiBase = 'http://sample-env.sfshjzcpr2.us-west-2.elasticbeanstalk.com'
  // const apiBase = 'http://localhost:2000'

  window.onload = function() {
    const playersContainer = document.querySelector('#players-container')
    const addPlayerContainer = document.querySelector('#add-player-container')
    const matchesContainer = document.querySelector('#matches-container')
    const searchPlayersInput = addPlayerContainer.querySelector('#add-player-input')
    const searchPlayersList = addPlayerContainer.querySelector('#add-player-list')
    const searchHint = matchesContainer.querySelector('h3.hint')

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

    function renderMatches(playerId) {
      const upcomingPlayerMatches = renderMatchList(playerId)

      if (playerId != null) {
        searchHint.innerHTML = (
          `${upcomingPlayerMatches.length} upcoming ` +
          `matches for player: <span class="filter-tag">` +
          `${players[playerId].name}<i class="mdi mdi-close filter-close-icon"></i><span>`
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
      const alreadyAddedPlayer = subscriptions.find(
        (player) => player.id === playerToAdd.id
      )

      if (alreadyAddedPlayer !== undefined) {
        removePlayerWithId(alreadyAddedPlayer.id)
      } else {
        subscriptions.push(playerToAdd)
        renderPlayers()
        fetchMatches()

        chrome.storage.sync.set({
          subscriptions: subscriptions
        })
      }

      // Faster, but less intuitive than calling 'renderPlayersToAdd' here
      el.className = alreadyAddedPlayer !== undefined ? '' : 'already-added'
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
          if (subscriptions.some((player) => player.id === playerSearchData[i].id)) {
            playerSearchData[i].el.className = 'already-added'
          }
          searchPlayersList.appendChild(playerSearchData[i].el)
        }
        if (searchPlayersList.children.length >= 8) {
          break
        }
      }
    }

    function fetchPlayers() {
      return axios.get(apiBase + '/players').then((res) => {
        players = res.data

        /* Update current subscriptions */
        chrome.storage.sync.set({ subscriptions: subscriptions.map((sub) => players[sub.id]) })

        playerSearchData = Object.values(players).map((playerToAdd, index) => {
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
          players: subscriptions.map(player => player.id)
        })
        .then((result) => {

           /* If this request is late and player has been already locally... */
          // if (result.data.length > players.length) {
            // return res(matches)
          // }

          matches = result.data
          renderPlayers()
          renderMatches()
          chrome.storage.sync.set({ matches: matches }, () => {
            res(matches)
          })
        })
      })
    }

    function renderMatchList(playerId) {
      var matchesListEl = document.querySelector('#matches-list')

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
      let sortedMatches = getUniqueMatchesOfPlayers(matches, subscriptions)

      sortedMatches = filterByUpcoming(sortedMatches)

      if (playerId != null) {
          sortedMatches = sortedMatches.filter((match) =>
            match.players.includes(playerId))
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
        var timezone = date.toString().match(/\(([A-Za-z\s].*)\)/)[1]
        var playersString = match.players.map(
          (id) => subscriptions.find(player => player.id === id).name
        ).join(', ')

        return (
          `<li class="player">
            <div class="date-container">
              <div class="date-container__month">${month.toUpperCase()}</div>
              <div class="date-container__day">${day < 10 ? `0${day}` : day}</div>
            </div>
            <div class="info-container">
              <h3 class="info-header"><a href="${match.wikiLink}">${match.title}</a></h3>
              <span class="info-subheader">Players: <b>${playersString}</b></span>
              <span class="info-subheader">${hour % 12}:${minutes < 10 ? `0${minutes}` : minutes} ${hour <= 12 ? 'am' : 'pm'} ${timezone}</div>
            </div>
          </li>`
        )
      }).join('\n')

      matchesListEl.innerHTML = matchesHTML

      /*
       * Add listeners
       */

      const matchLinkTags = matchesListEl.querySelectorAll('.info-header a')
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
      const playersHTML = subscriptions.map((player, index) => {
        const playerMatches = matches[player.id]

        return (
          `<li class="player">
            <img class="portrait" src="http://www.teamliquid.net/tlpd/images/players/${player.tlpdID}.jpg">
            <div class="info-container">
              <img class="race-portrait race-portrait--${player.race}" />
              <h3 class="info-header">${player.name}</h3>
              <span class="info-subheader">
                <a href="#" class="filter-link">${playerMatches ? `${filterByUpcoming(playerMatches).length} upcoming matches` : 'Loading match data...'}</a>
              </span>
              <span class="info-subheader">Team: ${player.team}</span>
            </div>
            <i class="mdi mdi-minus remove-player"></i>
          </li>`
        )
      }).join('')
      playersList.innerHTML = playersHTML || '<h3 class="hint">Click the "plus" button to add a player!</h3>'

      /*
       * Add listeners
       */

      const playerElements = document.querySelectorAll('.player .info-subheader a')
      for (let i = 0; i < playerElements.length; i++) {
        playerElements[i].addEventListener('click', ((playerId) => {
          selectSection('matches')
          renderMatches(playerId)
        }).bind(null, subscriptions[i].id))
      }

      const removeIcons = document.querySelectorAll('i.remove-player')
      for (let i = 0; i < removeIcons.length; i++) {
        removeIcons[i].addEventListener('click', removePlayerWithId.bind(null, subscriptions[i].id))
      }
    }

    function removePlayerWithId(playerId, e) {

      /*
       * So it does not trigger click on parent 'li'
       */

      if (e) {
        e.stopPropagation()
      }

      subscriptions = subscriptions.filter((sub) => sub.id !== playerId)
      delete matches[playerId]
      chrome.storage.sync.set({
        subscriptions, matches
      })
      renderPlayers()
      renderMatches()
    }

    fetchPlayers()

    Promise.all([

      new Promise((res, rej) => {
        chrome.storage.sync.get('subscriptions', fetched => {
          subscriptions = fetched.subscriptions || []
          res()
        })
      }),

      new Promise((res, rej) => {
        chrome.storage.sync.get('matches', fetched => {
          matches = fetched.matches || {}
          res()
        })
      })
    ])
    .then(() => {
      /* Render players again once matches and data have both been fetched */

      renderMatches(null)
      renderPlayers()
      if (subscriptions.length) {
        fetchMatches()
      }
    })

    selectSection('players')
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
