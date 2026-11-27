// ============================================================
// app.js — what your site DOES.
// Plain JavaScript, no libraries, no installs.
// It uses STARTUP and LISTINGS from data.js (loaded first).
// ============================================================

(function () {
  "use strict";

  // ----------------------------------------------------------
  // 1. Saving things in the browser (localStorage).
  //    This only remembers things on THIS browser on THIS device.
  //    Your teammates and your customers will NOT see it.
  //    A real product would need a server and a database for that.
  // ----------------------------------------------------------
  const storage = {
    get: function (key, fallback) {
      try {
        const saved = localStorage.getItem(key);
        return saved === null ? fallback : JSON.parse(saved);
      } catch (error) {
        return fallback; // storage blocked or broken: just carry on
      }
    },
    set: function (key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        // storage blocked (e.g. private window): ignore
      }
    }
  };
  let createdLeagues = storage.get("createdLeagues", []);

  // ----------------------------------------------------------
  // 2. Put the startup's name and pitch on the page.
  // ----------------------------------------------------------
  document.title = STARTUP.name;
  document.getElementById("brand-name").textContent = STARTUP.name;
  document.getElementById("tagline").textContent = STARTUP.tagline;
  document.getElementById("pitch").textContent = STARTUP.pitch;

  // ----------------------------------------------------------
  // 3. Views: show one section at a time, based on the #link in the address bar.
  // ----------------------------------------------------------
  function showView() {
    const requested = (window.location.hash || "#home").slice(1);
    const views = document.querySelectorAll("[data-view]");
    const leaguePagePrefix = "league-page/";
    const leagueStandingsPrefix = "league-standings/";
    const leagueSchedulePrefix = "league-schedule/";
    const teamPagePrefix = "team-page/";
    const gamePagePrefix = "game-page/";
    const teamLogoPickerPrefix = "team-logo-picker/";
    const teamRoute = requested.indexOf(teamPagePrefix) === 0
      ? requested.slice(teamPagePrefix.length).split("/")
      : [];
    const gameRoute = requested.indexOf(gamePagePrefix) === 0
      ? requested.slice(gamePagePrefix.length).split("/")
      : [];
    const teamLogoPickerRoute = requested.indexOf(teamLogoPickerPrefix) === 0
      ? requested.slice(teamLogoPickerPrefix.length).split("/")
      : [];
    const scheduleLeagueId = requested.indexOf(leagueSchedulePrefix) === 0
      ? requested.slice(leagueSchedulePrefix.length)
      : "";
    const standingsLeagueId = requested.indexOf(leagueStandingsPrefix) === 0
      ? requested.slice(leagueStandingsPrefix.length)
      : "";
    let leagueId = "";
    if (teamRoute.length === 2) {
      leagueId = teamRoute[0];
    } else if (gameRoute.length === 2) {
      leagueId = gameRoute[0];
    } else if (teamLogoPickerRoute.length === 2) {
      leagueId = teamLogoPickerRoute[0];
    } else if (standingsLeagueId) {
      leagueId = standingsLeagueId;
    } else if (scheduleLeagueId) {
      leagueId = scheduleLeagueId;
    } else if (requested.indexOf(leaguePagePrefix) === 0) {
      leagueId = requested.slice(leaguePagePrefix.length);
    }
    const selectedLeague = createdLeagues.find(function (league) {
      return league.id === leagueId;
    });
    if (selectedLeague) {
      selectedLeague.teams = Array.isArray(selectedLeague.teams) ? selectedLeague.teams : [];
      selectedLeague.games = Array.isArray(selectedLeague.games) ? selectedLeague.games : [];
    }
    const selectedTeam = selectedLeague && teamRoute.length === 2
      ? selectedLeague.teams.find(function (team) {
        return team.id === teamRoute[1];
      })
      : null;
    const selectedLogoTeam = selectedLeague && teamLogoPickerRoute.length === 2
      ? selectedLeague.teams.find(function (team) {
        return team.id === teamLogoPickerRoute[1];
      })
      : null;
    const selectedGame = selectedLeague && gameRoute.length === 2
      ? selectedLeague.games.find(function (game) {
        return game.id === gameRoute[1];
      })
      : null;
    const isSchedulePage = scheduleLeagueId !== "" && selectedLeague;
    const isStandingsPage = standingsLeagueId !== "" && selectedLeague;
    const isGamePage = selectedGame !== null && selectedGame !== undefined;
    const isTeamLogoPicker = selectedLogoTeam !== null && selectedLogoTeam !== undefined;
    const exists = Array.prototype.some.call(views, function (view) {
      return view.id === requested;
    });
    const current = selectedTeam
      ? "team-page-view"
      : isTeamLogoPicker
        ? "team-logo-picker-view"
      : isGamePage
        ? "game-page-view"
      : isStandingsPage
        ? "league-standings-view"
      : isSchedulePage
        ? "league-schedule-view"
      : selectedLeague
        ? "league-page-view"
      : exists ? requested : "home";

    if (selectedTeam) {
      renderTeamPage(selectedLeague, selectedTeam);
    } else if (isTeamLogoPicker) {
      renderTeamLogoPicker(selectedLeague, selectedLogoTeam);
    } else if (isGamePage) {
      renderGamePage(selectedLeague, selectedGame);
    } else if (isStandingsPage) {
      renderLeagueStandingsPage(selectedLeague);
    } else if (isSchedulePage) {
      renderLeagueSchedulePage(selectedLeague);
    } else if (selectedLeague) {
      renderLeaguePage(selectedLeague);
    }

    views.forEach(function (view) {
      view.hidden = view.id !== current;
    });

    document.querySelectorAll("nav a").forEach(function (link) {
      if (link.getAttribute("href") === "#" + current) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    window.scrollTo(0, 0);
  }

  window.addEventListener("hashchange", showView);

  // ----------------------------------------------------------
  // 4. Create page: save a league with its selected sport.
  // ----------------------------------------------------------
  const leagueForm = document.getElementById("league-form");
  const leagueName = document.getElementById("league-name");
  const formSuccess = document.getElementById("form-success");
  const leagueList = document.getElementById("league-list");
  const manageEmpty = document.getElementById("manage-empty");

  function saveCreatedLeagues() {
    storage.set("createdLeagues", createdLeagues);
  }

  function toLocalDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
  }

  function makeLeagueRow(league) {
    league.teams = Array.isArray(league.teams) ? league.teams : [];
    const row = document.createElement("article");
    row.className = "league-row";

    const header = document.createElement("div");
    header.className = "league-header";

    const name = document.createElement("button");
    name.type = "button";
    name.className = "league-name-toggle";
    name.textContent = league.name;

    const manageOptions = document.createElement("div");
    manageOptions.className = "league-manage-options";
    manageOptions.id = "league-options-" + league.id;
    manageOptions.hidden = true;
    name.setAttribute("aria-controls", manageOptions.id);
    name.setAttribute("aria-expanded", "false");

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "button secondary";
    deleteButton.textContent = "Delete league";
    deleteButton.addEventListener("click", function () {
      createdLeagues = createdLeagues.filter(function (item) {
        return item.id !== league.id;
      });
      saveCreatedLeagues();
      renderLeagues();
    });

    const enterButton = document.createElement("a");
    enterButton.className = "button";
    enterButton.href = "#league-page/" + league.id;
    enterButton.textContent = "Enter league";
    name.addEventListener("click", function () {
      manageOptions.hidden = !manageOptions.hidden;
      enterButton.hidden = !manageOptions.hidden;
      name.setAttribute("aria-expanded", manageOptions.hidden ? "false" : "true");
    });

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "button secondary";
    editButton.textContent = "Change name";

    const editForm = document.createElement("form");
    editForm.className = "league-name-form";
    editForm.hidden = true;
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.value = league.name;
    nameInput.required = true;
    nameInput.setAttribute("aria-label", "New league name");
    const saveButton = document.createElement("button");
    saveButton.type = "submit";
    saveButton.className = "button";
    saveButton.textContent = "Save name";
    editForm.append(nameInput, saveButton);

    editButton.addEventListener("click", function () {
      editForm.hidden = !editForm.hidden;
      if (!editForm.hidden) {
        nameInput.focus();
      }
    });
    editForm.addEventListener("submit", function (event) {
      event.preventDefault();
      const newName = nameInput.value.trim();
      if (!newName) {
        return;
      }
      league.name = newName;
      saveCreatedLeagues();
      renderLeagues();
    });

    const actions = document.createElement("div");
    actions.className = "league-actions";
    manageOptions.append(editButton, deleteButton);
    actions.append(manageOptions, enterButton);
    header.append(name, actions);
    row.append(header, editForm);

    return row;
  }

  function createSection(title, description) {
    const section = document.createElement("section");
    section.className = "manage-section";
    const heading = document.createElement("h2");
    heading.textContent = title;
    const text = document.createElement("p");
    text.className = "muted";
    text.textContent = description;
    section.append(heading, text);
    return section;
  }

  function createTeamsSection(league) {
    const section = createSection("Teams", "Select a team name to view its players.");
    const list = document.createElement("div");
    list.className = "team-list";

    function renderTeams() {
      list.replaceChildren();
      league.teams.forEach(function (team, index) {
        team.players = Array.isArray(team.players) ? team.players : [];
        const row = document.createElement("div");
        row.className = "team-row";

        const openButton = document.createElement("button");
        openButton.type = "button";
        openButton.className = "button secondary team-open";
        const abbreviationDisplay = document.createElement("span");
        abbreviationDisplay.className = "team-abbreviation";
        abbreviationDisplay.textContent = team.abbreviation || "—";
        const teamNameDisplay = document.createElement("span");
        teamNameDisplay.textContent = team.name || "Unnamed team";
        openButton.append(teamNameDisplay, abbreviationDisplay);
        const manageOptions = document.createElement("div");
        manageOptions.className = "team-manage-options";
        manageOptions.id = "team-options-" + team.id;
        manageOptions.hidden = true;
        openButton.setAttribute("aria-controls", manageOptions.id);
        openButton.setAttribute("aria-expanded", "false");
        openButton.addEventListener("click", function () {
          manageOptions.hidden = !manageOptions.hidden;
          openButton.setAttribute("aria-expanded", manageOptions.hidden ? "false" : "true");
        });

        const changeName = document.createElement("button");
        changeName.type = "button";
        changeName.className = "button secondary";
        changeName.textContent = "Change name";

        const changeAbbreviation = document.createElement("button");
        changeAbbreviation.type = "button";
        changeAbbreviation.className = "button secondary";
        changeAbbreviation.textContent = "Change abbreviation";

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "button secondary";
        remove.textContent = "Delete team";
        remove.addEventListener("click", function () {
          league.teams.splice(index, 1);
          saveCreatedLeagues();
          renderTeams();
        });

        const editForm = document.createElement("form");
        editForm.className = "team-name-form";
        editForm.hidden = true;
        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.value = team.name || "";
        nameInput.required = true;
        nameInput.setAttribute("aria-label", "New team name");
        const saveName = document.createElement("button");
        saveName.type = "submit";
        saveName.className = "button";
        saveName.textContent = "Save name";
        editForm.append(nameInput, saveName);

        const abbreviationForm = document.createElement("form");
        abbreviationForm.className = "team-abbreviation-form";
        abbreviationForm.hidden = true;
        const abbreviationInput = document.createElement("input");
        abbreviationInput.type = "text";
        abbreviationInput.value = team.abbreviation || "";
        abbreviationInput.required = true;
        abbreviationInput.maxLength = 3;
        abbreviationInput.pattern = "[A-Z]{3}";
        abbreviationInput.autocomplete = "off";
        abbreviationInput.setAttribute("aria-label", "Team abbreviation (3 uppercase letters)");
        const saveAbbreviation = document.createElement("button");
        saveAbbreviation.type = "submit";
        saveAbbreviation.className = "button";
        saveAbbreviation.textContent = "Save abbreviation";
        abbreviationForm.append(abbreviationInput, saveAbbreviation);

        abbreviationInput.addEventListener("input", function () {
          abbreviationInput.value = abbreviationInput.value
            .replace(/[^a-z]/gi, "")
            .toUpperCase()
            .slice(0, 3);
        });

        changeName.addEventListener("click", function () {
          editForm.hidden = !editForm.hidden;
          abbreviationForm.hidden = true;
          if (!editForm.hidden) {
            nameInput.focus();
          }
        });
        changeAbbreviation.addEventListener("click", function () {
          abbreviationForm.hidden = !abbreviationForm.hidden;
          editForm.hidden = true;
          if (!abbreviationForm.hidden) {
            abbreviationInput.focus();
          }
        });
        editForm.addEventListener("submit", function (event) {
          event.preventDefault();
          const newName = nameInput.value.trim();
          if (!newName) {
            return;
          }
          team.name = newName;
          saveCreatedLeagues();
          renderTeams();
        });
        abbreviationForm.addEventListener("submit", function (event) {
          event.preventDefault();
          if (!abbreviationInput.checkValidity()) {
            abbreviationInput.reportValidity();
            return;
          }
          team.abbreviation = abbreviationInput.value;
          saveCreatedLeagues();
          renderTeams();
        });

        const actions = document.createElement("div");
        actions.className = "team-actions";
        const chooseLogoButton = document.createElement("a");
        chooseLogoButton.className = "button secondary";
        chooseLogoButton.href = "#team-logo-picker/" + league.id + "/" + team.id;
        chooseLogoButton.textContent = "Upload logo";
        const logoLink = document.createElement("a");
        logoLink.className = "team-logo-link";
        logoLink.href = "#team-logo-picker/" + league.id + "/" + team.id;
        logoLink.setAttribute("aria-label", "Upload logo for " + (team.name || "Unnamed team"));
        logoLink.title = "Upload team logo";
        if (team.logoImage) {
          const logoImage = document.createElement("img");
          logoImage.className = "team-logo-image";
          logoImage.src = team.logoImage;
          logoImage.alt = "";
          logoLink.appendChild(logoImage);
        } else {
          const logoPlaceholder = document.createElement("span");
          logoPlaceholder.className = "team-logo-placeholder";
          logoPlaceholder.textContent = "+";
          logoLink.appendChild(logoPlaceholder);
        }
        const enterButton = document.createElement("a");
        enterButton.className = "button team-enter-button";
        enterButton.href = "#team-page/" + league.id + "/" + team.id;
        enterButton.textContent = "Enter team";
        manageOptions.append(
          changeName,
          changeAbbreviation,
          chooseLogoButton,
          remove,
          editForm,
          abbreviationForm
        );
        actions.append(manageOptions);
        row.append(openButton, enterButton, actions, logoLink);
        list.appendChild(row);
      });
    }

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "button";
    addButton.textContent = "Add team";
    addButton.addEventListener("click", function () {
      league.teams.push({
        id: "team-" + Date.now() + "-" + league.teams.length,
        name: "",
        abbreviation: "",
        players: []
      });
      saveCreatedLeagues();
      renderTeams();
    });

    renderTeams();
    section.append(list, addButton);
    return section;
  }

  function createTeamPlayersSection(team, league) {
    team.players = Array.isArray(team.players) ? team.players : [];
    league.games = Array.isArray(league.games) ? league.games : [];
    const section = createSection("Players", "Games played, goals, assists, Saves, Goals Against, and save percentage are calculated from game records.");
    const playerList = document.createElement("div");
    playerList.className = "team-player-list";

    function createStatInput(labelText, value, playerIndex) {
      const input = document.createElement("input");
      input.type = "number";
      input.min = "0";
      input.step = "1";
      input.value = value === undefined ? "0" : value;
      input.setAttribute("aria-label", "Player " + (playerIndex + 1) + " " + labelText);
      const field = document.createElement("label");
      field.className = "team-player-stat";
      field.textContent = labelText;
      field.appendChild(input);
      return { input: input, field: field };
    }

    function createGamesPlayedInput(player, playerIndex) {
      const gamesPlayedCount = league.games.filter(function (game) {
        return Array.isArray(game.gpPlayerIds) && game.gpPlayerIds.indexOf(player.id) !== -1;
      }).length;
      const gamesPlayed = createStatInput("Games Played", gamesPlayedCount, playerIndex);
      gamesPlayed.input.readOnly = true;
      gamesPlayed.input.setAttribute("aria-readonly", "true");
      return gamesPlayed.field;
    }

    function calculatePlayerScoringTotals(player) {
      const totals = { goals: 0, assists: 0 };
      league.games.forEach(function (game) {
        (Array.isArray(game.goals) ? game.goals : []).forEach(function (goal) {
          if (goal.scorerId === player.id) {
            totals.goals += 1;
          }
          if (Array.isArray(goal.assistIds) && goal.assistIds.indexOf(player.id) !== -1) {
            totals.assists += 1;
          }
        });
      });
      return totals;
    }

    function calculateGoalieTotals(player) {
      const totals = { saves: 0, goalsAgainst: 0 };
      league.games.forEach(function (game) {
        if (!Array.isArray(game.gpPlayerIds) || game.gpPlayerIds.indexOf(player.id) === -1) {
          return;
        }
        const goalieStats = game.goalieStats && typeof game.goalieStats === "object"
          ? game.goalieStats[player.id] || {}
          : {};
        totals.saves += Math.max(0, Number(goalieStats.saves) || 0);
        totals.goalsAgainst += Math.max(0, Number(goalieStats.goalsAgainst) || 0);
      });
      return totals;
    }

    function renderPlayers() {
      playerList.replaceChildren();
      const positions = [
        "Center",
        "Winger",
        "Defenceman",
        "Goalie"
      ];
      const legacyPositions = {
        C: "Center",
        RW: "Winger",
        LW: "Winger",
        RD: "Defenceman",
        LD: "Defenceman",
        "Right Wing": "Winger",
        "Left Wing": "Winger",
        "Right Winger": "Winger",
        "Left Winger": "Winger",
        "Right Defenceman": "Defenceman",
        "Left Defenceman": "Defenceman",
        "Right Defencemen": "Defenceman"
      };
      team.players.forEach(function (player) {
        if (legacyPositions[player.position]) {
          player.position = legacyPositions[player.position];
        }
        if (positions.indexOf(player.position) === -1) {
          player.position = "Center";
        }
      });
      const orderedPlayers = team.players.slice().sort(function (leftPlayer, rightPlayer) {
        return positions.indexOf(leftPlayer.position) - positions.indexOf(rightPlayer.position);
      });
      orderedPlayers.forEach(function (player, index) {
        const playerRow = document.createElement("div");
        playerRow.className = "team-player-row";

        const playerName = document.createElement("button");
        playerName.type = "button";
        playerName.className = "player-name-toggle";
        playerName.textContent = player.name || "Unnamed player";

        const playerOptions = document.createElement("div");
        playerOptions.className = "player-manage-options";
        playerOptions.id = "player-options-" + team.id + "-" + index;
        playerOptions.hidden = true;
        playerName.setAttribute("aria-controls", playerOptions.id);
        playerName.setAttribute("aria-expanded", "false");

        const position = document.createElement("select");
        position.setAttribute("aria-label", "Player " + (index + 1) + " position");
        positions.forEach(function (value) {
          const option = document.createElement("option");
          option.value = value;
          option.textContent = value;
          position.appendChild(option);
        });
        position.value = player.position;
        position.hidden = true;
        const positionDisplay = document.createElement("span");
        positionDisplay.className = "player-position-display";
        positionDisplay.textContent = player.position;
        position.addEventListener("change", function () {
          player.position = position.value;
          saveCreatedLeagues();
          renderPlayers();
        });
        position.disabled = true;
        playerName.addEventListener("click", function () {
          playerOptions.hidden = !playerOptions.hidden;
          position.disabled = playerOptions.hidden;
          position.hidden = playerOptions.hidden;
          positionDisplay.hidden = !playerOptions.hidden;
          playerName.setAttribute("aria-expanded", playerOptions.hidden ? "false" : "true");
        });
        const positionField = document.createElement("div");
        positionField.className = "team-player-position";
        const positionLabel = document.createElement("span");
        positionLabel.className = "team-player-position-label";
        positionLabel.textContent = "Position";
        positionField.append(positionLabel, positionDisplay, position);
        const identity = document.createElement("div");
        identity.className = "team-player-identity";
        identity.append(playerName, positionField);

        const stats = document.createElement("div");
        stats.className = "team-player-stats";
        if (player.position === "Goalie") {
          const goalieTotals = calculateGoalieTotals(player);
          const saves = createStatInput("Saves", goalieTotals.saves, index);
          const goalsAgainst = createStatInput("Goals Against", goalieTotals.goalsAgainst, index);
          saves.input.readOnly = true;
          goalsAgainst.input.readOnly = true;
          const savePercentage = document.createElement("output");
          savePercentage.className = "team-player-stat-value";
          savePercentage.setAttribute("aria-label", "Player " + (index + 1) + " save percentage");
          const shotsAgainst = goalieTotals.saves + goalieTotals.goalsAgainst;
          savePercentage.textContent = shotsAgainst === 0
            ? "—"
            : (goalieTotals.saves / shotsAgainst).toFixed(3);
          const percentageField = document.createElement("label");
          percentageField.className = "team-player-stat";
          percentageField.textContent = "Save Percentage";
          percentageField.appendChild(savePercentage);
          const gamesPlayedField = createGamesPlayedInput(player, index);
          stats.append(gamesPlayedField, saves.field, goalsAgainst.field, percentageField);
        } else {
          const scoringTotals = calculatePlayerScoringTotals(player);
          const goals = createStatInput("Goals", scoringTotals.goals, index);
          const assists = createStatInput("Assists", scoringTotals.assists, index);
          goals.input.readOnly = true;
          assists.input.readOnly = true;
          const points = document.createElement("input");
          points.type = "number";
          points.readOnly = true;
          points.value = scoringTotals.goals + scoringTotals.assists;
          points.setAttribute("aria-label", "Player " + (index + 1) + " points");
          const pointsField = document.createElement("label");
          pointsField.className = "team-player-stat";
          pointsField.textContent = "Points";
          pointsField.appendChild(points);
          const gamesPlayedField = createGamesPlayedInput(player, index);
          stats.append(gamesPlayedField, goals.field, assists.field, pointsField);
        }

        const removePlayer = document.createElement("button");
        removePlayer.type = "button";
        removePlayer.className = "button secondary";
        removePlayer.textContent = "Remove player";
        removePlayer.addEventListener("click", function () {
          team.players.splice(index, 1);
          saveCreatedLeagues();
          renderPlayers();
        });

        const changeName = document.createElement("button");
        changeName.type = "button";
        changeName.className = "button secondary";
        changeName.textContent = "Change name";

        const nameForm = document.createElement("form");
        nameForm.className = "player-name-form";
        nameForm.hidden = true;
        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.value = player.name || "";
        nameInput.required = true;
        nameInput.setAttribute("aria-label", "New player name");
        const saveName = document.createElement("button");
        saveName.type = "submit";
        saveName.className = "button";
        saveName.textContent = "Save name";
        nameForm.append(nameInput, saveName);
        changeName.addEventListener("click", function () {
          nameForm.hidden = !nameForm.hidden;
          if (!nameForm.hidden) {
            nameInput.focus();
          }
        });
        nameForm.addEventListener("submit", function (event) {
          event.preventDefault();
          const newName = nameInput.value.trim();
          if (!newName) {
            return;
          }
          player.name = newName;
          saveCreatedLeagues();
          renderPlayers();
        });

        playerOptions.append(changeName, removePlayer, nameForm);
        playerRow.append(identity, stats, playerOptions);
        playerList.appendChild(playerRow);
      });
    }

    const addPlayer = document.createElement("button");
    addPlayer.type = "button";
    addPlayer.className = "button";
    addPlayer.textContent = "Add player";
    addPlayer.addEventListener("click", function () {
      team.players.push({
        id: "player-" + team.id + "-" + team.players.length,
        name: "",
        position: "Center",
        goals: 0,
        assists: 0,
        gamesPlayed: 0
      });
      saveCreatedLeagues();
      renderPlayers();
    });

    renderPlayers();
    section.append(playerList, addPlayer);
    return section;
  }

  function renderLeaguePage(league) {
    document.getElementById("league-page-title").textContent = league.name;
    document.getElementById("league-page-schedule-link").href =
      "#league-schedule/" + league.id;
    document.getElementById("league-page-standings-link").href =
      "#league-standings/" + league.id;
    const teamsContainer = document.getElementById("league-page-teams");
    teamsContainer.replaceChildren(createTeamsSection(league));
  }

  function renderLeagueStandingsPage(league) {
    document.getElementById("league-standings-title").textContent = league.name + " Standings";
    document.getElementById("league-standings-league-name").textContent = league.name;
    document.getElementById("league-standings-back").href = "#league-page/" + league.id;

    const standingsByTeam = new Map();
    league.teams.forEach(function (team) {
      standingsByTeam.set(team.id, {
        team: team,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        overtimeLosses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0
      });
    });

    league.games.forEach(function (game) {
      const teamOne = standingsByTeam.get(game.teamOneId);
      const teamTwo = standingsByTeam.get(game.teamTwoId);
      if (!teamOne || !teamTwo) {
        return;
      }

      const goals = Array.isArray(game.goals) ? game.goals : [];
      const teamOneGoals = goals.filter(function (goal) { return goal.teamId === game.teamOneId; }).length;
      const teamTwoGoals = goals.filter(function (goal) { return goal.teamId === game.teamTwoId; }).length;
      const gpPlayerIds = Array.isArray(game.gpPlayerIds) ? game.gpPlayerIds : [];
      const teamOneRoster = Array.isArray(teamOne.team.players) ? teamOne.team.players : [];
      const teamTwoRoster = Array.isArray(teamTwo.team.players) ? teamTwo.team.players : [];
      const hasTeamOneGp = teamOneRoster.some(function (player) {
        return gpPlayerIds.indexOf(player.id) !== -1;
      });
      const hasTeamTwoGp = teamTwoRoster.some(function (player) {
        return gpPlayerIds.indexOf(player.id) !== -1;
      });
      const hasRecordedGoals = goals.some(function (goal) {
        return goal.teamId === game.teamOneId || goal.teamId === game.teamTwoId;
      });
      if (!hasTeamOneGp && !hasTeamTwoGp && !hasRecordedGoals) {
        return;
      }

      teamOne.gamesPlayed += 1;
      teamTwo.gamesPlayed += 1;
      teamOne.goalsFor += teamOneGoals;
      teamOne.goalsAgainst += teamTwoGoals;
      teamTwo.goalsFor += teamTwoGoals;
      teamTwo.goalsAgainst += teamOneGoals;

      if (teamOneGoals > teamTwoGoals) {
        teamOne.wins += 1;
        teamOne.points += 2;
        if (game.overtime) {
          teamTwo.overtimeLosses += 1;
          teamTwo.points += 1;
        } else {
          teamTwo.losses += 1;
        }
      } else if (teamTwoGoals > teamOneGoals) {
        teamTwo.wins += 1;
        teamTwo.points += 2;
        if (game.overtime) {
          teamOne.overtimeLosses += 1;
          teamOne.points += 1;
        } else {
          teamOne.losses += 1;
        }
      } else {
        teamOne.points += 1;
        teamTwo.points += 1;
      }
    });

    const standings = Array.from(standingsByTeam.values()).sort(function (left, right) {
      return right.points - left.points ||
        right.wins - left.wins ||
        (right.goalsFor - right.goalsAgainst) - (left.goalsFor - left.goalsAgainst) ||
        (left.team.name || "").localeCompare(right.team.name || "");
    });
    const table = document.createElement("table");
    table.className = "league-standings-table";
    const headings = ["#", "Team", "GP", "W", "L", "OTL", "GF", "GA", "GD", "PTS"];
    const head = document.createElement("thead");
    const headingRow = document.createElement("tr");
    headings.forEach(function (heading) {
      const cell = document.createElement("th");
      cell.scope = "col";
      cell.textContent = heading;
      headingRow.appendChild(cell);
    });
    head.appendChild(headingRow);
    table.appendChild(head);

    const body = document.createElement("tbody");
    if (standings.length === 0) {
      const emptyRow = document.createElement("tr");
      const emptyCell = document.createElement("td");
      emptyCell.colSpan = headings.length;
      emptyCell.textContent = "No teams in this league yet.";
      emptyRow.appendChild(emptyCell);
      body.appendChild(emptyRow);
    } else {
      standings.forEach(function (standing, index) {
        const row = document.createElement("tr");
        const values = [
          index + 1,
          standing.team.name || "Unnamed team",
          standing.gamesPlayed,
          standing.wins,
          standing.losses,
          standing.overtimeLosses,
          standing.goalsFor,
          standing.goalsAgainst,
          standing.goalsFor - standing.goalsAgainst,
          standing.points
        ];
        values.forEach(function (value) {
          const cell = document.createElement("td");
          cell.textContent = value;
          row.appendChild(cell);
        });
        body.appendChild(row);
      });
    }
    table.appendChild(body);
    const container = document.getElementById("league-standings-content");
    container.replaceChildren(table);
  }

  function renderLeagueSchedulePage(league) {
    document.getElementById("league-schedule-title").textContent =
      league.name + " Schedule";
    document.getElementById("league-schedule-sport").textContent = league.sport;
    document.getElementById("league-schedule-back").href =
      "#league-page/" + league.id;

    league.teams = Array.isArray(league.teams) ? league.teams : [];
    league.games = Array.isArray(league.games) ? league.games : [];

    const container = document.getElementById("league-schedule-content");
    container.replaceChildren();

    const today = new Date();
    let selectedDate = toLocalDateString(today);
    let displayWeek = startOfWeek(today);

    const layout = document.createElement("div");
    layout.className = "schedule-layout";

    const calendarCard = document.createElement("section");
    calendarCard.className = "schedule-calendar";

    const calendarHeader = document.createElement("div");
    calendarHeader.className = "schedule-calendar-header";
    const previousWeek = document.createElement("button");
    previousWeek.type = "button";
    previousWeek.className = "button secondary";
    previousWeek.textContent = "Previous week";
    const weekLabel = document.createElement("button");
    weekLabel.type = "button";
    weekLabel.className = "schedule-week-toggle";
    weekLabel.setAttribute("aria-label", "Choose year, month, and week");
    weekLabel.setAttribute("aria-expanded", "false");
    const nextWeek = document.createElement("button");
    nextWeek.type = "button";
    nextWeek.className = "button secondary";
    nextWeek.textContent = "Next week";
    calendarHeader.append(previousWeek, weekLabel, nextWeek);

    const weekPicker = document.createElement("form");
    weekPicker.className = "schedule-week-picker";
    weekPicker.hidden = true;
    weekPicker.id = "schedule-week-picker";
    weekLabel.setAttribute("aria-controls", weekPicker.id);

    const yearLabel = document.createElement("label");
    yearLabel.textContent = "Year";
    const yearInput = document.createElement("input");
    yearInput.type = "number";
    yearInput.min = "1900";
    yearInput.max = "2100";
    yearInput.step = "1";
    yearInput.required = true;
    yearInput.value = today.getFullYear();
    yearLabel.appendChild(yearInput);

    const monthLabel = document.createElement("label");
    monthLabel.textContent = "Month";
    const monthSelect = document.createElement("select");
    for (let month = 0; month < 12; month += 1) {
      const option = document.createElement("option");
      option.value = month;
      option.textContent = new Date(2000, month, 1).toLocaleDateString(undefined, {
        month: "long"
      });
      monthSelect.appendChild(option);
    }
    monthSelect.value = today.getMonth();
    monthLabel.appendChild(monthSelect);

    const weekLabelField = document.createElement("label");
    weekLabelField.textContent = "Week";
    const weekSelect = document.createElement("select");
    weekLabelField.appendChild(weekSelect);

    const goToWeek = document.createElement("button");
    goToWeek.type = "submit";
    goToWeek.className = "button";
    goToWeek.textContent = "Go to week";
    weekPicker.append(yearLabel, monthLabel, weekLabelField, goToWeek);

    const calendarGrid = document.createElement("div");
    calendarGrid.className = "schedule-calendar-grid";

    const formCard = document.createElement("section");
    formCard.className = "schedule-game-panel";
    const formHeading = document.createElement("h2");
    formHeading.textContent = "Add a game";

    const gameForm = document.createElement("form");
    gameForm.className = "schedule-game-form";

    const dateLabel = document.createElement("label");
    dateLabel.textContent = "Date";
    const dateInput = document.createElement("input");
    dateInput.type = "date";
    dateInput.value = selectedDate;
    dateInput.required = true;
    dateLabel.appendChild(dateInput);

    const teamOneLabel = document.createElement("label");
    teamOneLabel.textContent = "Team 1";
    const teamOneSelect = document.createElement("select");
    teamOneSelect.required = true;
    teamOneLabel.appendChild(teamOneSelect);

    const teamTwoLabel = document.createElement("label");
    teamTwoLabel.textContent = "Team 2";
    const teamTwoSelect = document.createElement("select");
    teamTwoSelect.required = true;
    teamTwoLabel.appendChild(teamTwoSelect);

    function populateTeamSelect(select, placeholder) {
      select.replaceChildren();
      const emptyOption = document.createElement("option");
      emptyOption.value = "";
      emptyOption.textContent = placeholder;
      select.appendChild(emptyOption);
      league.teams.forEach(function (team) {
        const option = document.createElement("option");
        option.value = team.id;
        option.textContent = team.name || "Unnamed team";
        select.appendChild(option);
      });
    }

    populateTeamSelect(teamOneSelect, "Choose team");
    populateTeamSelect(teamTwoSelect, "Choose team");

    const timeLabel = document.createElement("label");
    timeLabel.textContent = "Time";
    const timeInput = document.createElement("input");
    timeInput.type = "time";
    timeInput.required = true;
    timeLabel.appendChild(timeInput);

    const submitGame = document.createElement("button");
    submitGame.type = "submit";
    submitGame.className = "button";
    submitGame.textContent = "Add game";

    gameForm.append(dateLabel, teamOneLabel, teamTwoLabel, timeLabel, submitGame);

    const gamesHeading = document.createElement("h2");
    gamesHeading.className = "schedule-games-heading";
    const gamesList = document.createElement("div");
    gamesList.className = "schedule-games-list";
    formCard.append(gamesHeading, gamesList, formHeading, gameForm);

    function teamName(teamId) {
      const team = league.teams.find(function (item) {
        return item.id === teamId;
      });
      return team ? team.name || "Unnamed team" : "Unknown team";
    }

    function teamAbbreviation(teamId) {
      const team = league.teams.find(function (item) {
        return item.id === teamId;
      });
      if (!team) {
        return "UNK";
      }
      const abbreviation = team.abbreviation ||
        (team.name || "").replace(/[^a-z]/gi, "").slice(0, 3);
      return abbreviation.toUpperCase().slice(0, 3) || "UNK";
    }

    function formatDate(dateString) {
      const date = new Date(dateString + "T12:00:00");
      return date.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
      });
    }

    function startOfWeek(date) {
      const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      start.setDate(start.getDate() - start.getDay());
      return start;
    }

    function formatShortDate(date) {
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    }

    function populateWeeks() {
      const year = Number(yearInput.value);
      const month = Number(monthSelect.value);
      weekSelect.replaceChildren();
      if (!Number.isInteger(year) || year < 1900 || year > 2100) {
        return;
      }

      const firstOfMonth = new Date(year, month, 1);
      const lastOfMonth = new Date(year, month + 1, 0);
      let weekStart = startOfWeek(firstOfMonth);
      let weekNumber = 1;

      while (weekStart <= lastOfMonth) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const anchor = weekStart < firstOfMonth ? firstOfMonth : weekStart;
        const anchorDate = toLocalDateString(anchor);
        const option = document.createElement("option");
        option.value = anchorDate;
        option.textContent = "Week " + weekNumber + " (" +
          formatShortDate(weekStart) + " - " + formatShortDate(weekEnd) + ")";
        weekSelect.appendChild(option);
        if (selectedDate >= toLocalDateString(weekStart) &&
            selectedDate <= toLocalDateString(weekEnd)) {
          option.selected = true;
        }
        weekStart.setDate(weekStart.getDate() + 7);
        weekNumber += 1;
      }
    }

    function syncWeekPicker() {
      const selected = new Date(selectedDate + "T12:00:00");
      yearInput.value = selected.getFullYear();
      monthSelect.value = selected.getMonth();
      populateWeeks();
    }

    function formatTime(timeString) {
      const parts = timeString.split(":");
      const date = new Date(2000, 0, 1, Number(parts[0]), Number(parts[1] || 0));
      return date.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit"
      });
    }

    function renderGames() {
      gamesHeading.textContent = formatDate(selectedDate);
      gamesList.replaceChildren();
      const selectedGames = league.games
        .filter(function (game) { return game.date === selectedDate; })
        .sort(function (a, b) { return a.time.localeCompare(b.time); });

      if (selectedGames.length === 0) {
        const empty = document.createElement("p");
        empty.className = "muted";
        empty.textContent = "No games scheduled.";
        gamesList.appendChild(empty);
        return;
      }

      selectedGames.forEach(function (game) {
        const row = document.createElement("div");
        row.className = "schedule-game-row";
        const details = document.createElement("a");
        details.className = "schedule-game-link";
        details.href = "#game-page/" + league.id + "/" + game.id;
        details.textContent = formatTime(game.time) + " — " +
          teamName(game.teamOneId) + " vs " + teamName(game.teamTwoId);
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "button secondary";
        remove.textContent = "Remove";
        remove.addEventListener("click", function () {
          league.games = league.games.filter(function (item) {
            return item.id !== game.id;
          });
          saveCreatedLeagues();
          renderCalendar();
          renderGames();
        });
        row.append(details, remove);
        gamesList.appendChild(row);
      });
    }

    function selectDate(dateString) {
      selectedDate = dateString;
      displayWeek = startOfWeek(new Date(dateString + "T12:00:00"));
      dateInput.value = dateString;
      syncWeekPicker();
      renderCalendar();
      renderGames();
    }

    function renderCalendar() {
      const weekEnd = new Date(displayWeek);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekLabel.textContent = formatShortDate(displayWeek) + " - " +
        weekEnd.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric"
        });
      calendarGrid.replaceChildren();

      for (let index = 0; index < 7; index += 1) {
        const date = new Date(displayWeek);
        date.setDate(date.getDate() + index);
        const dateString = toLocalDateString(date);
        const dayButton = document.createElement("button");
        dayButton.type = "button";
        dayButton.className = "schedule-calendar-day";
        const weekday = document.createElement("span");
        weekday.className = "schedule-calendar-weekday";
        weekday.textContent = date.toLocaleDateString(undefined, { weekday: "short" });
        const dayNumber = document.createElement("span");
        dayNumber.className = "schedule-calendar-day-number";
        dayNumber.textContent = date.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric"
        });
        dayButton.append(weekday, dayNumber);
        const dayGames = league.games.filter(function (game) {
          return game.date === dateString;
        });
        dayButton.setAttribute(
          "aria-label",
          formatDate(dateString) + (dayGames.length
            ? ": " + dayGames.map(function (game) {
              return teamAbbreviation(game.teamOneId) + " vs " +
                teamAbbreviation(game.teamTwoId);
            }).join(", ")
            : "")
        );
        if (dateString === selectedDate) {
          dayButton.classList.add("selected");
        }
        if (dayGames.length) {
          dayButton.classList.add("has-game");
          dayGames.forEach(function (game) {
            const matchup = document.createElement("span");
            matchup.className = "schedule-calendar-matchup";
            matchup.textContent = teamAbbreviation(game.teamOneId) + " VS " +
              teamAbbreviation(game.teamTwoId);
            dayButton.appendChild(matchup);
          });
        }
        dayButton.addEventListener("click", function () {
          selectDate(dateString);
        });
        calendarGrid.appendChild(dayButton);
      }
    }

    previousWeek.addEventListener("click", function () {
      const date = new Date(selectedDate + "T12:00:00");
      date.setDate(date.getDate() - 7);
      selectDate(toLocalDateString(date));
    });
    nextWeek.addEventListener("click", function () {
      const date = new Date(selectedDate + "T12:00:00");
      date.setDate(date.getDate() + 7);
      selectDate(toLocalDateString(date));
    });

    weekLabel.addEventListener("click", function () {
      weekPicker.hidden = !weekPicker.hidden;
      weekLabel.setAttribute("aria-expanded", weekPicker.hidden ? "false" : "true");
      if (!weekPicker.hidden) {
        yearInput.focus();
      }
    });
    yearInput.addEventListener("input", populateWeeks);
    monthSelect.addEventListener("change", populateWeeks);
    weekPicker.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!yearInput.checkValidity() || !weekSelect.value) {
        yearInput.reportValidity();
        return;
      }
      weekPicker.hidden = true;
      weekLabel.setAttribute("aria-expanded", "false");
      selectDate(weekSelect.value);
    });

    dateInput.addEventListener("change", function () {
      if (!dateInput.value) {
        return;
      }
      selectDate(dateInput.value);
    });

    gameForm.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!dateInput.value || !timeInput.value ||
          !teamOneSelect.value || !teamTwoSelect.value) {
        return;
      }
      if (teamOneSelect.value === teamTwoSelect.value) {
        teamTwoSelect.setCustomValidity("Choose two different teams.");
        teamTwoSelect.reportValidity();
        return;
      }
      teamTwoSelect.setCustomValidity("");
      league.games.push({
        id: "game-" + Date.now(),
        date: dateInput.value,
        time: timeInput.value,
        teamOneId: teamOneSelect.value,
        teamTwoId: teamTwoSelect.value
      });
      league.games.sort(function (a, b) {
        return (a.date + " " + a.time).localeCompare(b.date + " " + b.time);
      });
      saveCreatedLeagues();
      selectDate(dateInput.value);
      timeInput.value = "";
      teamOneSelect.value = "";
      teamTwoSelect.value = "";
    });

    teamTwoSelect.addEventListener("change", function () {
      teamTwoSelect.setCustomValidity("");
    });

    calendarCard.append(calendarHeader, weekPicker, calendarGrid);
    layout.append(calendarCard, formCard);
    container.appendChild(layout);
    syncWeekPicker();
    renderCalendar();
    renderGames();
  }

  function renderTeamPage(league, team) {
    document.getElementById("team-page-title").textContent = team.name || "Unnamed team";
    document.getElementById("team-page-league-name").textContent = league.name;
    document.getElementById("team-page-back").href = "#league-page/" + league.id;
    const playersContainer = document.getElementById("team-page-players");
    playersContainer.replaceChildren(createTeamPlayersSection(team, league));
  }

  function renderTeamLogoPicker(league, team) {
    document.getElementById("team-logo-picker-title").textContent =
      "Upload a logo for " + (team.name || "Unnamed team");
    document.getElementById("team-logo-picker-back").href = "#league-page/" + league.id;

    const form = document.getElementById("team-logo-form");
    const fileInput = document.getElementById("team-logo-file");
    const uploadLabel = document.getElementById("team-logo-upload-label");
    const preview = document.getElementById("team-logo-preview");
    const previewImage = document.getElementById("team-logo-preview-image");
    const status = document.getElementById("team-logo-upload-status");
    const submit = document.getElementById("team-logo-submit");
    let selectedImage = "";

    fileInput.value = "";
    uploadLabel.textContent = "Choose an image";
    status.textContent = "";
    submit.disabled = true;
    preview.hidden = !team.logoImage;
    if (team.logoImage) {
      previewImage.src = team.logoImage;
    } else {
      previewImage.removeAttribute("src");
    }

    fileInput.onchange = function () {
      const file = fileInput.files && fileInput.files[0];
      if (!file) {
        return;
      }
      selectedImage = "";
      submit.disabled = true;
      status.textContent = "";
      if (TEAM_LOGO_MIME_TYPES.indexOf(file.type) === -1) {
        status.textContent = "Choose a PNG, JPEG, GIF, or WebP image.";
        fileInput.value = "";
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        status.textContent = "Choose an image smaller than 5 MB.";
        fileInput.value = "";
        return;
      }

      const reader = new FileReader();
      reader.addEventListener("load", function () {
        const source = new Image();
        source.addEventListener("load", function () {
          const maxDimension = 512;
          const scale = Math.min(1, maxDimension / Math.max(source.naturalWidth, source.naturalHeight));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(source.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(source.naturalHeight * scale));
          canvas.getContext("2d").drawImage(source, 0, 0, canvas.width, canvas.height);
          selectedImage = canvas.toDataURL("image/webp", 0.85);
          if (selectedImage.indexOf("data:image/webp") !== 0) {
            selectedImage = canvas.toDataURL("image/png");
          }
          previewImage.src = selectedImage;
          preview.hidden = false;
          uploadLabel.textContent = file.name;
          status.textContent = "";
          submit.disabled = false;
        });
        source.addEventListener("error", function () {
          status.textContent = "That image could not be opened. Try another file.";
        });
        source.src = reader.result;
      });
      reader.addEventListener("error", function () {
        status.textContent = "That image could not be read. Try another file.";
      });
      reader.readAsDataURL(file);
    };

    form.onsubmit = function (event) {
      event.preventDefault();
      if (!selectedImage) {
        return;
      }
      team.logoImage = selectedImage;
      delete team.logoId;
      saveCreatedLeagues();
      window.location.hash = "#league-page/" + league.id;
    };
  }

  function renderGamePage(league, game) {
    function findTeam(teamId) {
      return league.teams.find(function (team) {
        return team.id === teamId;
      });
    }

    function renderTeamSide(teamId, side) {
      const team = findTeam(teamId);
      const name = team ? team.name || "Unnamed team" : "Unknown team";
      const logo = document.getElementById("game-page-team-" + side + "-logo");
      const placeholder = document.getElementById("game-page-team-" + side + "-placeholder");
      const playersList = document.getElementById("game-page-team-" + side + "-players");
      const goaliesList = document.getElementById("game-page-team-" + side + "-goalies");
      document.getElementById("game-page-team-" + side + "-name").textContent = name;
      if (team && team.logoImage) {
        logo.src = team.logoImage;
        logo.alt = name + " logo";
        logo.hidden = false;
        placeholder.hidden = true;
      } else {
        logo.removeAttribute("src");
        logo.alt = "";
        logo.hidden = true;
        placeholder.textContent = team && team.abbreviation
          ? team.abbreviation
          : name.split(/\s+/).map(function (part) { return part[0]; }).join("").slice(0, 3).toUpperCase();
        placeholder.hidden = false;
      }

      const players = team && Array.isArray(team.players) ? team.players : [];
      function renderPlayerList(list, listedPlayers, emptyMessage) {
        list.replaceChildren();
        if (listedPlayers.length === 0) {
          const empty = document.createElement("li");
          empty.className = "muted";
          empty.textContent = emptyMessage;
          list.appendChild(empty);
        }
        listedPlayers.forEach(function (player) {
          const item = document.createElement("li");
          const playerName = player.name || "Unnamed player";
          const playerInfo = document.createElement("div");
          playerInfo.className = "game-player-info";
          const playerHeader = document.createElement("div");
          playerHeader.className = "game-player-header";
          const playerNameLabel = document.createElement("span");
          playerNameLabel.className = "game-player-name";
          playerNameLabel.textContent = playerName;
          const gpLabel = document.createElement("label");
          gpLabel.className = "game-player-gp";
          const gpCheckbox = document.createElement("input");
          gpCheckbox.type = "checkbox";
          gpCheckbox.id = "game-gp-" + game.id + "-" + player.id;
          gpCheckbox.setAttribute("aria-label", "Mark " + playerName + " as played (GP)");
          gpCheckbox.checked = Array.isArray(game.gpPlayerIds) &&
            game.gpPlayerIds.indexOf(player.id) !== -1;
          let goalieStatsPanel = null;

          if (player.position === "Goalie") {
            const goalieStats = game.goalieStats && typeof game.goalieStats === "object"
              ? game.goalieStats[player.id] || {}
              : {};
            goalieStatsPanel = document.createElement("div");
            goalieStatsPanel.className = "game-goalie-stats";
            goalieStatsPanel.hidden = !gpCheckbox.checked;

            [
              { key: "saves", label: "Saves" },
              { key: "goalsAgainst", label: "GA" }
            ].forEach(function (stat) {
              const statLabel = document.createElement("label");
              statLabel.className = "game-goalie-stat";
              statLabel.textContent = stat.label;
              const statInput = document.createElement("input");
              statInput.type = "number";
              statInput.min = "0";
              statInput.step = "1";
              statInput.value = goalieStats[stat.key] === undefined ? "0" : goalieStats[stat.key];
              statInput.setAttribute("aria-label", playerName + " " + stat.label);
              statInput.addEventListener("input", function () {
                game.goalieStats = game.goalieStats && typeof game.goalieStats === "object"
                  ? game.goalieStats
                  : {};
                game.goalieStats[player.id] = game.goalieStats[player.id] || {};
                game.goalieStats[player.id][stat.key] = Math.max(0, Number(statInput.value) || 0);
                saveCreatedLeagues();
              });
              statLabel.appendChild(statInput);
              goalieStatsPanel.appendChild(statLabel);
            });
            gpCheckbox.addEventListener("change", function () {
              goalieStatsPanel.hidden = !gpCheckbox.checked;
            });
          }

          const gpText = document.createElement("span");
          gpText.textContent = "GP";
          gpLabel.append(gpCheckbox, gpText);
          playerHeader.append(playerNameLabel, gpLabel);
          playerInfo.appendChild(playerHeader);
          if (goalieStatsPanel) {
            playerInfo.appendChild(goalieStatsPanel);
          }
          gpCheckbox.addEventListener("change", function () {
            const gpPlayerIds = Array.isArray(game.gpPlayerIds) ? game.gpPlayerIds : [];
            if (gpCheckbox.checked && gpPlayerIds.indexOf(player.id) === -1) {
              gpPlayerIds.push(player.id);
            } else if (!gpCheckbox.checked) {
              game.gpPlayerIds = gpPlayerIds.filter(function (playerId) {
                return playerId !== player.id;
              });
            }
            if (gpCheckbox.checked) {
              game.gpPlayerIds = gpPlayerIds;
            }
            saveCreatedLeagues();
          });
          item.appendChild(playerInfo);
          list.appendChild(item);
        });
      }
      renderPlayerList(
        playersList,
        players.filter(function (player) { return player.position !== "Goalie"; }),
        "No players yet."
      );
      renderPlayerList(
        goaliesList,
        players.filter(function (player) { return player.position === "Goalie"; }),
        "No goalies listed."
      );

      const scorerSelect = document.getElementById("game-page-team-" + side + "-scorer");
      const assistOneSelect = document.getElementById("game-page-team-" + side + "-assist-one");
      const assistTwoSelect = document.getElementById("game-page-team-" + side + "-assist-two");
      function populatePlayerSelect(select, placeholder) {
        select.replaceChildren();
        const emptyOption = document.createElement("option");
        emptyOption.value = "";
        emptyOption.textContent = placeholder;
        select.appendChild(emptyOption);
        players.forEach(function (player) {
          const option = document.createElement("option");
          option.value = player.id;
          option.textContent = player.name || "Unnamed player";
          select.appendChild(option);
        });
      }
      populatePlayerSelect(scorerSelect, "Choose scorer");
      populatePlayerSelect(assistOneSelect, "No assist");
      populatePlayerSelect(assistTwoSelect, "No assist");

      const goalForm = document.getElementById("game-page-team-" + side + "-goal-form");
      const goalLog = document.getElementById("game-page-team-" + side + "-goals");
      const goalToggle = goalForm.querySelector(".game-goal-toggle");
      const goalFields = goalForm.querySelector(".game-goal-fields");
      goalToggle.disabled = players.length === 0;
      goalToggle.onclick = function () {
        goalFields.hidden = !goalFields.hidden;
        goalToggle.setAttribute("aria-expanded", goalFields.hidden ? "false" : "true");
      };
      goalForm.querySelector("button[type='submit']").disabled = players.length === 0;

      function renderGoals() {
        goalLog.replaceChildren();
        const goals = (Array.isArray(game.goals) ? game.goals : []).filter(function (goal) {
          return goal.teamId === teamId;
        });
        document.getElementById("game-page-team-" + side + "-goal-count").textContent = goals.length;
        if (goals.length === 0) {
          const empty = document.createElement("li");
          empty.className = "muted";
          empty.textContent = "No goals yet.";
          goalLog.appendChild(empty);
        }
        goals.forEach(function (goal, index) {
          const scorer = players.find(function (player) {
            return player.id === goal.scorerId;
          });
          const assists = (Array.isArray(goal.assistIds) ? goal.assistIds : [])
            .map(function (playerId) {
              return players.find(function (player) {
                return player.id === playerId;
              });
            })
            .filter(Boolean);
          const entry = document.createElement("li");
            const description = document.createElement("span");
            description.textContent = (index + 1) + ". " +
            (scorer ? scorer.name || "Unnamed player" : "Unknown scorer") +
            (assists.length ? " (" + assists.map(function (player) {
              return player.name || "Unnamed player";
            }).join(", ") + ")" : "");
            const removeGoal = document.createElement("button");
            removeGoal.type = "button";
            removeGoal.className = "game-goal-remove";
            removeGoal.textContent = "Remove";
            removeGoal.setAttribute("aria-label", "Remove goal " + (index + 1));
            removeGoal.addEventListener("click", function () {
              game.goals = game.goals.filter(function (savedGoal) {
                return savedGoal.id !== goal.id;
              });
              saveCreatedLeagues();
              renderGoals();
            });
            entry.append(description, removeGoal);
          goalLog.appendChild(entry);
        });
      }

      [scorerSelect, assistOneSelect, assistTwoSelect].forEach(function (select) {
        select.onchange = function () {
          assistOneSelect.setCustomValidity("");
          assistTwoSelect.setCustomValidity("");
        };
      });
      goalForm.onsubmit = function (event) {
        event.preventDefault();
        if (!scorerSelect.value) {
          scorerSelect.reportValidity();
          return;
        }
        const assistIds = [assistOneSelect.value, assistTwoSelect.value].filter(Boolean);
        let duplicateAssist = null;
        if (assistOneSelect.value && assistOneSelect.value === scorerSelect.value) {
          duplicateAssist = assistOneSelect;
        } else if (assistTwoSelect.value && assistTwoSelect.value === scorerSelect.value) {
          duplicateAssist = assistTwoSelect;
        } else if (assistOneSelect.value && assistOneSelect.value === assistTwoSelect.value) {
          duplicateAssist = assistTwoSelect;
        }
        if (duplicateAssist) {
          duplicateAssist.setCustomValidity("Choose a different player for each role.");
          duplicateAssist.reportValidity();
          return;
        }

        game.goals = Array.isArray(game.goals) ? game.goals : [];
        game.goals.push({
          id: "goal-" + Date.now() + "-" + game.goals.length,
          teamId: teamId,
          scorerId: scorerSelect.value,
          assistIds: assistIds
        });
        saveCreatedLeagues();
        scorerSelect.value = "";
        assistOneSelect.value = "";
        assistTwoSelect.value = "";
        renderGoals();
      };
      renderGoals();
    }

    renderTeamSide(game.teamOneId, "one");
    renderTeamSide(game.teamTwoId, "two");
    const overtimeCheckbox = document.getElementById("game-overtime");
    overtimeCheckbox.checked = game.overtime === true;
    overtimeCheckbox.onchange = function () {
      game.overtime = overtimeCheckbox.checked;
      saveCreatedLeagues();
    };
    document.getElementById("game-page-league-name").textContent = league.name;
    document.getElementById("game-page-back").href = "#league-schedule/" + league.id;
  }

  function renderLeagues() {
    leagueList.replaceChildren.apply(
      leagueList,
      createdLeagues.map(makeLeagueRow)
    );
    manageEmpty.hidden = createdLeagues.length > 0;
  }

  leagueForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = leagueName.value.trim();
    if (!name) {
      return;
    }

    createdLeagues.push({
      id: "league-" + Date.now(),
      name: name,
      sport: "Hockey",
      teams: []
    });
    saveCreatedLeagues();
    renderLeagues();

    formSuccess.textContent = name + " has been created for Hockey.";
    formSuccess.hidden = false;
    leagueForm.reset();
  });

  // ----------------------------------------------------------
  // 5. Start up.
  // ----------------------------------------------------------
  renderLeagues();
  showView();
})();
