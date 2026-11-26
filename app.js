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
    const teamPagePrefix = "team-page/";
    const teamRoute = requested.indexOf(teamPagePrefix) === 0
      ? requested.slice(teamPagePrefix.length).split("/")
      : [];
    const leagueId = teamRoute.length === 2
      ? teamRoute[0]
      : requested.indexOf(leaguePagePrefix) === 0
      ? requested.slice(leaguePagePrefix.length)
      : "";
    const selectedLeague = createdLeagues.find(function (league) {
      return league.id === leagueId;
    });
    if (selectedLeague) {
      selectedLeague.teams = Array.isArray(selectedLeague.teams) ? selectedLeague.teams : [];
    }
    const selectedTeam = selectedLeague && teamRoute.length === 2
      ? selectedLeague.teams.find(function (team) {
        return team.id === teamRoute[1];
      })
      : null;
    const exists = Array.prototype.some.call(views, function (view) {
      return view.id === requested;
    });
    const current = selectedTeam
      ? "team-page-view"
      : selectedLeague
        ? "league-page-view"
      : exists ? requested : "home";

    if (selectedTeam) {
      renderTeamPage(selectedLeague, selectedTeam);
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
        openButton.textContent = team.name || "Unnamed team";
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

        changeName.addEventListener("click", function () {
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
          team.name = newName;
          saveCreatedLeagues();
          renderTeams();
        });

        const actions = document.createElement("div");
        actions.className = "team-actions";
        const enterButton = document.createElement("a");
        enterButton.className = "button";
        enterButton.href = "#team-page/" + league.id + "/" + team.id;
        enterButton.textContent = "Enter team";
        manageOptions.append(changeName, remove, enterButton, editForm);
        actions.append(manageOptions);
        row.append(openButton, actions);
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
        players: []
      });
      saveCreatedLeagues();
      renderTeams();
    });

    renderTeams();
    section.append(list, addButton);
    return section;
  }

  function createTeamPlayersSection(team) {
    team.players = Array.isArray(team.players) ? team.players : [];
    const section = createSection("Players", "Player stats change based on position. Goalies track saves, GA, and save percentage.");
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

    function renderPlayers() {
      playerList.replaceChildren();
      team.players.forEach(function (player, index) {
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
        const positions = [
          "Center",
          "Right Wing",
          "Left Wing",
          "Right Defenceman",
          "Left Defenceman",
          "Winger",
          "Defenceman",
          "Goalie"
        ];
        const legacyPositions = {
          C: "Center",
          RW: "Right Wing",
          LW: "Left Wing",
          RD: "Right Defenceman",
          LD: "Left Defenceman"
        };
        if (legacyPositions[player.position]) {
          player.position = legacyPositions[player.position];
        }
        if (positions.indexOf(player.position) === -1) {
          player.position = "Center";
        }
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
          const saves = createStatInput("Saves", player.saves, index);
          const goalsAgainst = createStatInput("GA", player.goalsAgainst, index);
          const savePercentage = document.createElement("output");
          savePercentage.className = "team-player-stat-value";
          savePercentage.setAttribute("aria-label", "Player " + (index + 1) + " save percentage");

          function updateSavePercentage() {
            player.saves = Math.max(0, Number(saves.input.value) || 0);
            player.goalsAgainst = Math.max(0, Number(goalsAgainst.input.value) || 0);
            const shotsAgainst = player.saves + player.goalsAgainst;
            savePercentage.textContent = shotsAgainst === 0
              ? "—"
              : (player.saves / shotsAgainst).toFixed(3);
            saveCreatedLeagues();
          }

          updateSavePercentage();
          saves.input.addEventListener("input", updateSavePercentage);
          goalsAgainst.input.addEventListener("input", updateSavePercentage);
          const percentageField = document.createElement("label");
          percentageField.className = "team-player-stat";
          percentageField.textContent = "Save Percentage";
          percentageField.appendChild(savePercentage);
          stats.append(saves.field, goalsAgainst.field, percentageField);
        } else {
          const goals = createStatInput("Goals", player.goals, index);
          const assists = createStatInput("Assists", player.assists, index);
          const points = document.createElement("input");
          points.type = "number";
          points.readOnly = true;
          points.value = (Number(goals.input.value) || 0) + (Number(assists.input.value) || 0);
          points.setAttribute("aria-label", "Player " + (index + 1) + " points");

          function updatePoints() {
            player.goals = Math.max(0, Number(goals.input.value) || 0);
            player.assists = Math.max(0, Number(assists.input.value) || 0);
            points.value = player.goals + player.assists;
            saveCreatedLeagues();
          }

          goals.input.addEventListener("input", updatePoints);
          assists.input.addEventListener("input", updatePoints);
          const pointsField = document.createElement("label");
          pointsField.className = "team-player-stat";
          pointsField.textContent = "Points";
          pointsField.appendChild(points);
          stats.append(goals.field, assists.field, pointsField);
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
        assists: 0
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
    document.getElementById("league-page-sport").textContent = league.sport;
    const teamsContainer = document.getElementById("league-page-teams");
    teamsContainer.replaceChildren(createTeamsSection(league));
  }

  function renderTeamPage(league, team) {
    document.getElementById("team-page-title").textContent = team.name || "Unnamed team";
    document.getElementById("team-page-league-name").textContent = league.name;
    document.getElementById("team-page-back").href = "#league-page/" + league.id;
    const playersContainer = document.getElementById("team-page-players");
    playersContainer.replaceChildren(createTeamPlayersSection(team));
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
