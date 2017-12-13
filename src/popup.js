(function() {
  let players = {}
  let matches = {}
  let subscriptions = []

  window.onload = function() {
    const playersContainer = document.querySelector('#players-container')
    const addPlayerContainer = document.querySelector('#add-player-container')
    const matchesContainer = document.querySelector('#matches-container')
    const searchPlayersInput = addPlayerContainer.querySelector('#add-player-input')
    const searchPlayersList = addPlayerContainer.querySelector('#add-player-list')
    const searchHint = matchesContainer.querySelector('h3.hint')

    // const listEls = document.querySelectorAll('#app-nav li')
    // listEls.forEach(function(listEl, index) {
    //   var anchor = listEl.querySelector('a')
    //   anchor.addEventListener(
    //     'click',
    //     selectSection.bind(null, index ? 'matches' : 'players')
    //   )
    // })

    // document.querySelector('#signature').addEventListener('click', (e) => {
    //   const url = e.target.getAttribute('href')
    //   chrome.tabs.create({ url: url })
    // })

    // document.querySelector('#refresh').addEventListener('click', (e) => {
    //   chrome.storage.sync.set({ matches: {}, notifications: {}, subscriptions: [] })
    //   subscriptions = [], matches = {}
    //   renderMatches()
    //   renderPlayers()
    // })

    const addPlayerButton = document.querySelector('#add-player')
    addPlayerButton.addEventListener('click', selectSection.bind(null, 'add-player'))
    //
    // function selectSection(section) {
    //   if (searchPlayersInput.value) {
    //     searchPlayersInput.value = ''
    //     renderPlayersToAdd()
    //   }

    //   switch (section) {
    //     case 'players':
    //       playersContainer.style.display = 'block'
    //       matchesContainer.style.display = 'none'
    //       addPlayerContainer.style.display = 'none'
    //       listEls[0].className = "selected"
    //       listEls[1].className = ""
    //       break
    //     case 'matches':
    //       playersContainer.style.display = 'none'
    //       matchesContainer.style.display = 'block'
    //       addPlayerContainer.style.display = 'none'
    //       listEls[0].className = ""
    //       listEls[1].className = "selected"
    //       break
    //     case 'add-player':
    //       playersContainer.style.display = 'none'
    //       matchesContainer.style.display = 'none'
    //       addPlayerContainer.style.display = 'block'
    //       listEls[0].className = ""
    //       listEls[1].className = ""
    //       break
    //     default:
    //       break
    //   }
    // }

    function renderMatches(playerId) {
      const upcomingPlayerMatches = renderMatchList(playerId)

      if (playerId != null) {
        searchHint.innerHTML = (

        )

        /*
         * Add listener for removing filter
         */
        const filterTag = searchHint.querySelector('.filter-tag')
        filterTag.addEventListener('click', renderMatches.bind(null, null))

      } else {
        // searchHint.innerHTML = (
        //
        // )
      }
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

    function _fetchMatches() {

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

      /*
       * Add listeners
       */

      // const matchLinkTags = matchesListEl.querySelectorAll('.info-header a')
      // for (let i = 0; i < matchLinkTags.length; i++) {
      //   matchLinkTags[i].addEventListener('click', (e) => {
      //     const wikiUrl = matchLinkTags[i].getAttribute('href')
      //     chrome.tabs.create({ url: wikiUrl })
      //   })
      // }

      return sortedMatches
    }
  }
})()
