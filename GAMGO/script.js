const games = [
  {
    league: "UEFA Champions League",
    time: "42'",
    home: "Arsenal",
    away: "Bayern Munich",
    homeCode: "ARS",
    awayCode: "BAY",
    score: "1 – 0",
    odds: [2.15, 3.4, 3.05],
    colors: ["#e94f38", "#c94646"],
  },
  {
    league: "NBA · Regular Season",
    time: "Q3 04:24",
    home: "Boston Celtics",
    away: "Miami Heat",
    homeCode: "BOS",
    awayCode: "MIA",
    score: "82 – 74",
    odds: [1.56, 2.48],
    colors: ["#168867", "#9b2f36"],
  },
  {
    league: "ATP · Monte Carlo",
    time: "Set 2",
    home: "Carlos Alcaraz",
    away: "Jannik Sinner",
    homeCode: "ALC",
    awayCode: "SIN",
    score: "6 3 – 4 2",
    odds: [1.72, 2.12],
    colors: ["#eabe3d", "#f06435"],
  },
  {
    league: "Premier League",
    time: "67'",
    home: "Liverpool",
    away: "Chelsea",
    homeCode: "LIV",
    awayCode: "CHE",
    score: "2 – 2",
    odds: [2.4, 2.85, 3.1],
    colors: ["#c83443", "#2368b6"],
  },
  {
    league: "NHL · Regular Season",
    time: "P2 08:15",
    home: "Rangers",
    away: "Bruins",
    homeCode: "NYR",
    awayCode: "BOS",
    score: "3 – 1",
    odds: [1.74, 2.2],
    colors: ["#2869c7", "#d5aa37"],
  },
  {
    league: "MLB · American League",
    time: "7th",
    home: "Yankees",
    away: "Astros",
    homeCode: "NYY",
    awayCode: "HOU",
    score: "4 – 5",
    odds: [2.05, 1.82],
    colors: ["#344765", "#e47d2a"],
  },
];

let balance = 2450.8;

let points = Number(
  localStorage.getItem("gamgoPoints") || 120,
);

let selectedBet = {
  game: 0,
  odd: 0,
};

let activeGame = "";
let gameChoice = "";
let crashTimer = null;
let crashMultiplier = 1;
let crashPoint = 0;
let crashWager = 0;
let blackjack = null;
let poker = null;
let cooldownTimer = null;

const sessionStarted = Date.now();

const gamesGrid = document.querySelector("#gamesGrid");
const stakeInput = document.querySelector("#stake");
const selectedTeam = document.querySelector("#selectedTeam");
const selectedOdd = document.querySelector("#selectedOdd");
const selectedMatch = document.querySelector("#selectedMatch");
const potentialReturn = document.querySelector(
  "#potentialReturn",
);
const searchInput = document.querySelector("#searchInput");
const gameModal = document.querySelector("#gameModal");
const gameTitle = document.querySelector("#gameTitle");
const gameStage = document.querySelector("#gameStage");
const gameControls = document.querySelector("#gameControls");
const gameStatus = document.querySelector("#gameStatus");

function money(value) {
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function updateBalance() {
  document
    .querySelectorAll(".balance-value")
    .forEach((element) => {
      element.textContent = money(balance);
    });
}

function updatePoints() {
  document.querySelector("#pointsBalance").textContent =
    points;

  localStorage.setItem(
    "gamgoPoints",
    String(points),
  );
}

function renderGames(filter = "") {
  const query = filter.trim().toLowerCase();

  gamesGrid.innerHTML = "";

  games.forEach((game, gameIndex) => {
    const searchableText =
      `${game.league} ${game.home} ${game.away}`.toLowerCase();

    if (
      query &&
      !searchableText.includes(query)
    ) {
      return;
    }

    const labels =
      game.odds.length === 3
        ? ["1", "X", "2"]
        : [game.homeCode, game.awayCode];

    const card = document.createElement("article");

    card.className = "game-card";

    card.innerHTML = `
      <div class="game-meta">
        <span>${game.league}</span>

        <span class="live">
          Live ${game.time}
        </span>
      </div>

      <div class="matchup">
        <div class="team">
          <span
            class="team-badge"
            style="background: ${game.colors[0]}"
          >
            ${game.homeCode[0]}
          </span>

          <strong>${game.home}</strong>
        </div>

        <div class="score">
          <b>${game.score}</b>
          <small>Score</small>
        </div>

        <div class="team">
          <span
            class="team-badge"
            style="background: ${game.colors[1]}"
          >
            ${game.awayCode[0]}
          </span>

          <strong>${game.away}</strong>
        </div>
      </div>

      <p class="market-label">
        Match winner
      </p>

      <div class="odds ${
        game.odds.length === 3
          ? "three"
          : "two"
      }">
        ${game.odds
          .map((odd, oddIndex) => {
            const isSelected =
              selectedBet.game === gameIndex &&
              selectedBet.odd === oddIndex;

            return `
              <button
                class="odd-button ${
                  isSelected ? "selected" : ""
                }"
                data-game="${gameIndex}"
                data-odd="${oddIndex}"
              >
                <span>${labels[oddIndex]}</span>
                <b>${odd.toFixed(2)}</b>
              </button>
            `;
          })
          .join("")}
      </div>
    `;

    gamesGrid.appendChild(card);
  });

  if (!gamesGrid.children.length) {
    gamesGrid.innerHTML = `
      <p class="fine-print">
        No matching events found.
      </p>
    `;
  }
}

function getSelectionName(game, oddIndex) {
  if (oddIndex === 0) {
    return game.home;
  }

  if (
    game.odds.length === 3 &&
    oddIndex === 1
  ) {
    return "Draw";
  }

  return game.away;
}

function updateBetSlip() {
  const game = games[selectedBet.game];
  const odd = game.odds[selectedBet.odd];

  const stake = Math.max(
    1,
    Number(stakeInput.value) || 1,
  );

  stakeInput.value = stake;

  selectedTeam.textContent = getSelectionName(
    game,
    selectedBet.odd,
  );

  selectedOdd.textContent = odd.toFixed(2);

  selectedMatch.textContent =
    `${game.home} vs ${game.away}`;

  potentialReturn.textContent = money(
    stake * odd,
  );
}

gamesGrid.addEventListener("click", (event) => {
  const button = event.target.closest(
    ".odd-button",
  );

  if (!button) {
    return;
  }

  selectedBet = {
    game: Number(button.dataset.game),
    odd: Number(button.dataset.odd),
  };

  renderGames(searchInput.value);
  updateBetSlip();
});

stakeInput.addEventListener(
  "input",
  updateBetSlip,
);

document
  .querySelector("#decreaseStake")
  .addEventListener("click", () => {
    stakeInput.value = Math.max(
      1,
      Number(stakeInput.value) - 5,
    );

    updateBetSlip();
  });

document
  .querySelector("#increaseStake")
  .addEventListener("click", () => {
    stakeInput.value =
      Number(stakeInput.value) + 5;

    updateBetSlip();
  });

searchInput.addEventListener(
  "input",
  (event) => {
    renderGames(event.target.value);
  },
);

document
  .querySelector("#placeBet")
  .addEventListener("click", () => {
    const stake = Number(stakeInput.value);

    const message =
      document.querySelector("#betMessage");

    if (!takeWager(stake)) {
      message.textContent =
        "Not enough demo credits for this bet.";

      message.style.color = "#ff6173";

      return;
    }

    const odd =
      games[selectedBet.game].odds[
        selectedBet.odd
      ];

    const won = Math.random() < 0.48;

    if (won) {
      const payout = stake * odd;

      balance += payout;

      message.textContent =
        `Bet won — ${money(payout)} added to your demo balance.`;

      message.style.color = "#66aaff";
    } else {
      message.textContent =
        "Bet settled — better luck on the next demo round.";

      message.style.color = "#ff7a8a";
    }

    updateBalance();
  });

document
  .querySelectorAll(".nav-item[data-page]")
  .forEach((item) => {
    item.addEventListener("click", () => {
      document
        .querySelectorAll(".nav-item[data-page]")
        .forEach((navigationItem) => {
          navigationItem.classList.remove(
            "active",
          );
        });

      item.classList.add("active");

      closeMenu();

      if (item.dataset.page === "Casino") {
        document
          .querySelector("#casinoGames")
          .scrollIntoView({
            behavior: "smooth",
          });
      }

      if (
        item.dataset.page === "Sports" ||
        item.dataset.page === "Live Betting"
      ) {
        document
          .querySelector(".live-section")
          .scrollIntoView({
            behavior: "smooth",
          });
      }

      if (
        item.dataset.page === "Promotions"
      ) {
        document
          .querySelector(".offers-section")
          .scrollIntoView({
            behavior: "smooth",
          });
      }
    });
  });

const sidebar = document.querySelector("#sidebar");
const backdrop = document.querySelector("#backdrop");

function openMenu() {
  sidebar.classList.add("open");
  backdrop.classList.add("open");
}

function closeMenu() {
  sidebar.classList.remove("open");
  backdrop.classList.remove("open");
}

document
  .querySelector("#openMenu")
  .addEventListener("click", openMenu);

document
  .querySelector("#closeMenu")
  .addEventListener("click", closeMenu);

backdrop.addEventListener("click", closeMenu);

function takeWager(amount) {
  if (
    !Number.isFinite(amount) ||
    amount < 1 ||
    amount > balance
  ) {
    return false;
  }

  balance -= amount;

  updateBalance();

  return true;
}

function gameWager() {
  return Number(
    document.querySelector("#gameWager")
      ?.value || 10,
  );
}

function wagerField() {
  return `
    <label for="gameWager">
      Demo credit wager
    </label>

    <input
      id="gameWager"
      type="number"
      min="1"
      value="10"
    />
  `;
}

function setStatus(message, type = "") {
  gameStatus.textContent = message;

  gameStatus.style.color =
    type === "win"
      ? "#66aaff"
      : type === "loss"
        ? "#ff7182"
        : "";

  if (type === "win") {
    gameStage.classList.remove("win-flash");

    requestAnimationFrame(() => {
      gameStage.classList.add("win-flash");
    });
  }
}

function openGame(type) {
  activeGame = type;
  gameChoice = "";

  gameModal.classList.add("open");

  gameModal.setAttribute(
    "aria-hidden",
    "false",
  );

  document.body.style.overflow = "hidden";

  setupGame(type);
}

function closeGame() {
  clearInterval(crashTimer);

  crashTimer = null;

  gameModal.classList.remove("open");

  gameModal.setAttribute(
    "aria-hidden",
    "true",
  );

  document.body.style.overflow = "";
}

document
  .querySelectorAll(".casino-card")
  .forEach((card) => {
    card.addEventListener("click", () => {
      openGame(card.dataset.gameType);
    });
  });

document
  .querySelector("#closeGame")
  .addEventListener("click", closeGame);

document
  .querySelector("#modalBackdrop")
  .addEventListener("click", closeGame);

document.addEventListener(
  "keydown",
  (event) => {
    if (event.key === "Escape") {
      closeGame();
    }
  },
);

function setupGame(type) {
  clearInterval(crashTimer);

  const setups = {
    slots: setupSlots,
    roulette: setupRoulette,
    dice: setupDice,
    coin: setupCoin,
    crash: setupCrash,
    blackjack: setupBlackjack,
    poker: setupPoker,
  };

  setups[type]();
}

/* ---------------------- */
/* Slots                  */
/* ---------------------- */

function setupSlots() {
  gameTitle.textContent = "Neon Slots";

  gameStage.innerHTML = `
    <div class="reels">
      <div class="reel">7</div>
      <div class="reel">G</div>
      <div class="reel">★</div>
    </div>
  `;

  gameControls.innerHTML = `
    ${wagerField()}

    <button
      class="game-action"
      id="spinSlots"
    >
      Spin reels
    </button>
  `;

  setStatus(
    "Three matching symbols pay 10×. Two matching symbols pay 2×.",
  );

  document
    .querySelector("#spinSlots")
    .addEventListener("click", playSlots);
}

function playSlots() {
  const wager = gameWager();

  if (!takeWager(wager)) {
    setStatus(
      "Enter a valid wager within your demo balance.",
      "loss",
    );

    return;
  }

  const symbols = [
    "7",
    "G",
    "★",
    "◆",
    "BAR",
  ];

  const reels = [
    ...document.querySelectorAll(".reel"),
  ];

  reels.forEach((reel) => {
    reel.classList.add("spinning");
  });

  setTimeout(() => {
    const result = reels.map((reel) => {
      const symbol =
        symbols[
          Math.floor(
            Math.random() * symbols.length,
          )
        ];

      reel.textContent = symbol;

      reel.classList.remove("spinning");

      return symbol;
    });

    const unique =
      new Set(result).size;

    const multiplier =
      unique === 1
        ? 10
        : unique === 2
          ? 2
          : 0;

    if (multiplier) {
      const payout =
        wager * multiplier;

      balance += payout;

      updateBalance();

      setStatus(
        `${
          multiplier === 10
            ? "Jackpot"
            : "Pair"
        } — you won ${money(payout)}!`,
        "win",
      );
    } else {
      setStatus(
        "No match this spin. Try again.",
        "loss",
      );
    }
  }, 650);
}

/* ---------------------- */
/* Roulette               */
/* ---------------------- */

function setupRoulette() {
  gameTitle.textContent =
    "Quick Roulette";

  gameStage.innerHTML = `
    <div
      class="roulette-result"
      id="rouletteResult"
    >
      ?
    </div>
  `;

  gameControls.innerHTML = `
    ${wagerField()}

    <button
      class="choice-button"
      data-choice="red"
    >
      Red · 2×
    </button>

    <button
      class="choice-button"
      data-choice="black"
    >
      Black · 2×
    </button>

    <button
      class="choice-button"
      data-choice="green"
    >
      Green · 14×
    </button>

    <button
      class="game-action"
      id="spinRoulette"
    >
      Spin wheel
    </button>
  `;

  bindChoices();

  document
    .querySelector("#spinRoulette")
    .addEventListener(
      "click",
      playRoulette,
    );

  setStatus(
    "Choose a color, then spin.",
  );
}

function playRoulette() {
  if (!gameChoice) {
    setStatus(
      "Choose red, black, or green first.",
      "loss",
    );

    return;
  }

  const wager = gameWager();

  if (!takeWager(wager)) {
    setStatus(
      "Enter a valid wager within your demo balance.",
      "loss",
    );

    return;
  }

  const number =
    Math.floor(Math.random() * 37);

  const color =
    number === 0
      ? "green"
      : number % 2
        ? "red"
        : "black";

  const result =
    document.querySelector(
      "#rouletteResult",
    );

  result.textContent = number;

  result.className =
    `roulette-result ${color}`;

  if (gameChoice === color) {
    const payout =
      wager *
      (color === "green" ? 14 : 2);

    balance += payout;

    updateBalance();

    setStatus(
      `${color.toUpperCase()} ${number} — you won ${money(payout)}!`,
      "win",
    );
  } else {
    setStatus(
      `${color.toUpperCase()} ${number} — the wheel had other plans.`,
      "loss",
    );
  }
}

/* ---------------------- */
/* Dice                   */
/* ---------------------- */

function setupDice() {
  gameTitle.textContent = "Dice Duel";

  gameStage.innerHTML = `
    <div
      class="dice-result"
      id="diceResult"
    >
      ?
    </div>
  `;

  gameControls.innerHTML = `
    ${wagerField()}

    <button
      class="choice-button"
      data-choice="low"
    >
      Low · 1–3
    </button>

    <button
      class="choice-button"
      data-choice="high"
    >
      High · 4–6
    </button>

    <button
      class="game-action"
      id="rollDice"
    >
      Roll dice
    </button>
  `;

  bindChoices();

  document
    .querySelector("#rollDice")
    .addEventListener("click", playDice);

  setStatus(
    "Predict whether the roll will be high or low.",
  );
}

function playDice() {
  if (!gameChoice) {
    setStatus(
      "Choose high or low first.",
      "loss",
    );

    return;
  }

  const wager = gameWager();

  if (!takeWager(wager)) {
    setStatus(
      "Enter a valid wager within your demo balance.",
      "loss",
    );

    return;
  }

  const roll =
    Math.floor(Math.random() * 6) + 1;

  document.querySelector(
    "#diceResult",
  ).textContent = roll;

  const result =
    roll <= 3 ? "low" : "high";

  if (gameChoice === result) {
    const payout = wager * 1.9;

    balance += payout;

    updateBalance();

    setStatus(
      `You called ${result} correctly and won ${money(payout)}!`,
      "win",
    );
  } else {
    setStatus(
      `The roll was ${roll}. Try another prediction.`,
      "loss",
    );
  }
}

/* ---------------------- */
/* Coin flip              */
/* ---------------------- */

function setupCoin() {
  gameTitle.textContent = "Coin Flip";

  gameStage.innerHTML = `
    <div
      class="coin-result"
      id="coinResult"
    >
      G
    </div>
  `;

  gameControls.innerHTML = `
    ${wagerField()}

    <button
      class="choice-button"
      data-choice="heads"
    >
      Heads
    </button>

    <button
      class="choice-button"
      data-choice="tails"
    >
      Tails
    </button>

    <button
      class="game-action"
      id="flipCoin"
    >
      Flip coin
    </button>
  `;

  bindChoices();

  document
    .querySelector("#flipCoin")
    .addEventListener("click", playCoin);

  setStatus(
    "Pick a side for a 2× return.",
  );
}

function playCoin() {
  if (!gameChoice) {
    setStatus(
      "Choose heads or tails first.",
      "loss",
    );

    return;
  }

  const wager = gameWager();

  if (!takeWager(wager)) {
    setStatus(
      "Enter a valid wager within your demo balance.",
      "loss",
    );

    return;
  }

  const result =
    Math.random() < 0.5
      ? "heads"
      : "tails";

  document.querySelector(
    "#coinResult",
  ).textContent =
    result === "heads"
      ? "HEADS"
      : "TAILS";

  if (gameChoice === result) {
    balance += wager * 2;

    updateBalance();

    setStatus(
      `${result.toUpperCase()} — you won ${money(wager * 2)}!`,
      "win",
    );
  } else {
    setStatus(
      `${result.toUpperCase()} — close one.`,
      "loss",
    );
  }
}

function bindChoices() {
  document
    .querySelectorAll(".choice-button")
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          gameChoice =
            button.dataset.choice;

          document
            .querySelectorAll(
              ".choice-button",
            )
            .forEach((item) => {
              item.classList.remove(
                "selected",
              );
            });

          button.classList.add(
            "selected",
          );
        },
      );
    });
}

/* ---------------------- */
/* Crash                  */
/* ---------------------- */

function setupCrash() {
  gameTitle.textContent = "Sky Crash";

  gameStage.innerHTML = `
    <div
      class="crash-display"
      id="crashDisplay"
    >
      <strong>1.00×</strong>
      <small>Waiting for takeoff</small>
    </div>
  `;

  gameControls.innerHTML = `
    ${wagerField()}

    <button
      class="game-action"
      id="startCrash"
    >
      Start flight
    </button>
  `;

  document.querySelector(
    "#startCrash",
  ).onclick = startCrash;

  setStatus(
    "Start a round, then cash out before the multiplier crashes.",
  );
}

function startCrash() {
  crashWager = gameWager();

  if (!takeWager(crashWager)) {
    setStatus(
      "Enter a valid wager within your demo balance.",
      "loss",
    );

    return;
  }

  crashMultiplier = 1;

  crashPoint =
    1.15 + Math.random() * 4.85;

  const display =
    document.querySelector(
      "#crashDisplay",
    );

  const button =
    document.querySelector(
      "#startCrash",
    );

  button.textContent =
    "Cash out at 1.00×";

  button.onclick = cashOutCrash;

  setStatus(
    "The multiplier is climbing...",
  );

  crashTimer = setInterval(() => {
    crashMultiplier += 0.05;

    display.querySelector(
      "strong",
    ).textContent =
      `${crashMultiplier.toFixed(2)}×`;

    button.textContent =
      `Cash out at ${crashMultiplier.toFixed(2)}×`;

    if (
      crashMultiplier >= crashPoint
    ) {
      clearInterval(crashTimer);

      crashTimer = null;

      display.classList.add(
        "crashed",
      );

      display.querySelector(
        "small",
      ).textContent = "Crashed";

      button.textContent =
        "Start another flight";

      button.onclick = startCrash;

      setStatus(
        `Crashed at ${crashMultiplier.toFixed(2)}×.`,
        "loss",
      );
    }
  }, 90);
}

function cashOutCrash() {
  if (!crashTimer) {
    return;
  }

  clearInterval(crashTimer);

  crashTimer = null;

  const payout =
    crashWager * crashMultiplier;

  balance += payout;

  updateBalance();

  document.querySelector(
    "#crashDisplay small",
  ).textContent =
    "Cashed out safely";

  const button =
    document.querySelector(
      "#startCrash",
    );

  button.textContent =
    "Start another flight";

  button.onclick = startCrash;

  setStatus(
    `Cashed out at ${crashMultiplier.toFixed(2)}× for ${money(payout)}!`,
    "win",
  );
}

/* ---------------------- */
/* Playing-card helpers   */
/* ---------------------- */

const suits = ["♠", "♥", "♦", "♣"];

function drawCard() {
  const rank =
    Math.floor(Math.random() * 13) + 1;

  return {
    rank,
    suit:
      suits[
        Math.floor(
          Math.random() * suits.length,
        )
      ],
    label:
      rank === 1
        ? "A"
        : rank === 11
          ? "J"
          : rank === 12
            ? "Q"
            : rank === 13
              ? "K"
              : String(rank),
  };
}

function handValue(hand) {
  let value = hand.reduce(
    (sum, card) => {
      return (
        sum +
        (card.rank === 1
          ? 11
          : Math.min(card.rank, 10))
      );
    },
    0,
  );

  let aces = hand.filter(
    (card) => card.rank === 1,
  ).length;

  while (value > 21 && aces--) {
    value -= 10;
  }

  return value;
}

function cardMarkup(card) {
  const isRed =
    card.suit === "♥" ||
    card.suit === "♦";

  return `
    <span class="playing-card ${
      isRed ? "red-card" : ""
    }">
      ${card.label}${card.suit}
    </span>
  `;
}

/* ---------------------- */
/* Blackjack              */
/* ---------------------- */

function setupBlackjack() {
  gameTitle.textContent = "Blackjack";

  gameStage.innerHTML = `
    <div
      class="cards-table"
      id="cardsTable"
    >
      <div class="hand-label">
        Dealer
      </div>

      <div class="hand">
        <span class="playing-card">
          ?
        </span>
      </div>

      <div class="hand-label">
        Your hand
      </div>

      <div class="hand">
        <span class="playing-card">
          ?
        </span>
      </div>
    </div>
  `;

  gameControls.innerHTML = `
    ${wagerField()}

    <button
      class="game-action"
      id="dealCards"
    >
      Deal cards
    </button>
  `;

  document
    .querySelector("#dealCards")
    .addEventListener(
      "click",
      dealBlackjack,
    );

  setStatus(
    "Get closer to 21 than the dealer without going over.",
  );
}

function dealBlackjack() {
  const wager = gameWager();

  if (!takeWager(wager)) {
    setStatus(
      "Enter a valid wager within your demo balance.",
      "loss",
    );

    return;
  }

  blackjack = {
    wager,
    player: [
      drawCard(),
      drawCard(),
    ],
    dealer: [
      drawCard(),
      drawCard(),
    ],
    active: true,
  };

  gameControls.innerHTML = `
    <button
      class="choice-button"
      id="hitCards"
    >
      Hit
    </button>

    <button
      class="game-action"
      id="standCards"
    >
      Stand
    </button>
  `;

  document
    .querySelector("#hitCards")
    .addEventListener(
      "click",
      hitBlackjack,
    );

  document
    .querySelector("#standCards")
    .addEventListener(
      "click",
      standBlackjack,
    );

  renderBlackjack(false);

  if (
    handValue(blackjack.player) === 21
  ) {
    standBlackjack();
  }
}

function renderBlackjack(revealDealer) {
  const dealerCards = revealDealer
    ? blackjack.dealer
        .map(cardMarkup)
        .join("")
    : `
      ${cardMarkup(blackjack.dealer[0])}
      <span class="playing-card">?</span>
    `;

  document.querySelector(
    "#cardsTable",
  ).innerHTML = `
    <div class="hand-label">
      Dealer
      ${
        revealDealer
          ? `· ${handValue(blackjack.dealer)}`
          : ""
      }
    </div>

    <div class="hand">
      ${dealerCards}
    </div>

    <div class="hand-label">
      Your hand ·
      ${handValue(blackjack.player)}
    </div>

    <div class="hand">
      ${blackjack.player
        .map(cardMarkup)
        .join("")}
    </div>
  `;
}

function hitBlackjack() {
  blackjack.player.push(drawCard());

  renderBlackjack(false);

  if (
    handValue(blackjack.player) > 21
  ) {
    finishBlackjack(
      "You busted. The dealer wins.",
      0,
    );
  } else if (
    handValue(blackjack.player) === 21
  ) {
    standBlackjack();
  }
}

function standBlackjack() {
  while (
    handValue(blackjack.dealer) < 17
  ) {
    blackjack.dealer.push(drawCard());
  }

  const player =
    handValue(blackjack.player);

  const dealer =
    handValue(blackjack.dealer);

  renderBlackjack(true);

  if (
    dealer > 21 ||
    player > dealer
  ) {
    finishBlackjack(
      `You beat the dealer ${player} to ${dealer}!`,
      blackjack.wager *
        (player === 21 ? 2.5 : 2),
    );
  } else if (player === dealer) {
    finishBlackjack(
      `Push at ${player}. Your wager was returned.`,
      blackjack.wager,
    );
  } else {
    finishBlackjack(
      `Dealer wins ${dealer} to ${player}.`,
      0,
    );
  }
}

function finishBlackjack(
  message,
  payout,
) {
  blackjack.active = false;

  if (payout) {
    balance += payout;
    updateBalance();
  }

  gameControls.innerHTML = `
    <button
      class="game-action"
      id="newBlackjack"
    >
      Play another hand
    </button>
  `;

  document
    .querySelector("#newBlackjack")
    .addEventListener(
      "click",
      setupBlackjack,
    );

  setStatus(
    payout
      ? `${message} ${money(payout)} returned.`
      : message,
    payout ? "win" : "loss",
  );
}

/* ---------------------- */
/* Video Poker            */
/* ---------------------- */

function setupPoker() {
  gameTitle.textContent =
    "Video Poker";

  poker = null;

  gameStage.innerHTML = `
    <div class="poker-hand">
      <span class="playing-card">?</span>
      <span class="playing-card">?</span>
      <span class="playing-card">?</span>
      <span class="playing-card">?</span>
      <span class="playing-card">?</span>
    </div>
  `;

  gameControls.innerHTML = `
    ${wagerField()}

    <button
      class="game-action"
      id="dealPoker"
    >
      Deal hand
    </button>
  `;

  document
    .querySelector("#dealPoker")
    .addEventListener(
      "click",
      dealPoker,
    );

  setStatus(
    "Deal five cards, hold the ones you want, then draw once.",
  );
}

function dealPoker() {
  const wager = gameWager();

  if (!takeWager(wager)) {
    setStatus(
      "Enter a valid wager within your demo balance.",
      "loss",
    );

    return;
  }

  poker = {
    wager,
    hand: [
      drawCard(),
      drawCard(),
      drawCard(),
      drawCard(),
      drawCard(),
    ],
    held: new Set(),
  };

  renderPoker();

  gameControls.innerHTML = `
    <button
      class="game-action"
      id="drawPoker"
    >
      Draw replacement cards
    </button>
  `;

  document
    .querySelector("#drawPoker")
    .addEventListener(
      "click",
      drawPoker,
    );

  setStatus(
    "Select cards to hold, then draw.",
  );
}

function renderPoker() {
  gameStage.innerHTML = `
    <div class="poker-hand">
      ${poker.hand
        .map((card, index) => {
          return `
            <button
              class="poker-card-button ${
                poker.held.has(index)
                  ? "held"
                  : ""
              }"
              data-card-index="${index}"
            >
              ${cardMarkup(card)}
            </button>
          `;
        })
        .join("")}
    </div>
  `;

  document
    .querySelectorAll(
      ".poker-card-button",
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          const index = Number(
            button.dataset.cardIndex,
          );

          if (
            poker.held.has(index)
          ) {
            poker.held.delete(index);
          } else {
            poker.held.add(index);
          }

          renderPoker();
        },
      );
    });
}

function evaluatePoker(hand) {
  const values = hand
    .map((card) => card.rank)
    .sort((a, b) => a - b);

  const counts = {};

  values.forEach((value) => {
    counts[value] =
      (counts[value] || 0) + 1;
  });

  const groups = Object.values(
    counts,
  ).sort((a, b) => b - a);

  const flush = hand.every(
    (card) =>
      card.suit === hand[0].suit,
  );

  const unique = [
    ...new Set(values),
  ];

  const straight =
    unique.length === 5 &&
    (
      unique[4] - unique[0] === 4 ||
      JSON.stringify(unique) ===
        JSON.stringify([
          1,
          10,
          11,
          12,
          13,
        ])
    );

  const royal =
    flush &&
    JSON.stringify(unique) ===
      JSON.stringify([
        1,
        10,
        11,
        12,
        13,
      ]);

  if (royal) {
    return {
      name: "Royal flush",
      multiplier: 50,
    };
  }

  if (straight && flush) {
    return {
      name: "Straight flush",
      multiplier: 20,
    };
  }

  if (groups[0] === 4) {
    return {
      name: "Four of a kind",
      multiplier: 10,
    };
  }

  if (
    groups[0] === 3 &&
    groups[1] === 2
  ) {
    return {
      name: "Full house",
      multiplier: 7,
    };
  }

  if (flush) {
    return {
      name: "Flush",
      multiplier: 5,
    };
  }

  if (straight) {
    return {
      name: "Straight",
      multiplier: 4,
    };
  }

  if (groups[0] === 3) {
    return {
      name: "Three of a kind",
      multiplier: 3,
    };
  }

  if (
    groups[0] === 2 &&
    groups[1] === 2
  ) {
    return {
      name: "Two pair",
      multiplier: 2,
    };
  }

  if (groups[0] === 2) {
    return {
      name: "Pair",
      multiplier: 1,
    };
  }

  return {
    name: "High card",
    multiplier: 0,
  };
}

function drawPoker() {
  poker.hand = poker.hand.map(
    (card, index) => {
      return poker.held.has(index)
        ? card
        : drawCard();
    },
  );

  renderPoker();

  document
    .querySelectorAll(
      ".poker-card-button",
    )
    .forEach((button) => {
      button.disabled = true;
    });

  const result = evaluatePoker(
    poker.hand,
  );

  const payout =
    poker.wager * result.multiplier;

  if (payout) {
    balance += payout;

    updateBalance();

    setStatus(
      `${result.name} — ${money(payout)} returned to your demo wallet!`,
      "win",
    );
  } else {
    setStatus(
      `${result.name}. Deal again whenever you are ready.`,
      "loss",
    );
  }

  gameControls.innerHTML = `
    <button
      class="game-action"
      id="newPoker"
    >
      Deal another hand
    </button>
  `;

  document
    .querySelector("#newPoker")
    .addEventListener(
      "click",
      setupPoker,
    );
}

/* ---------------------- */
/* Safety tools           */
/* ---------------------- */

function startCooldown(seconds = 60) {
  closeGame();

  clearInterval(cooldownTimer);

  document.body.classList.add(
    "cooldown-active",
  );

  const message =
    document.querySelector(
      "#safetyMessage",
    );

  let remaining = seconds;

  const update = () => {
    message.textContent =
      `Cooldown active — games are paused for ${remaining} second${
        remaining === 1 ? "" : "s"
      }. Try a stretch, water, or a short walk.`;

    remaining -= 1;

    if (remaining < 0) {
      clearInterval(cooldownTimer);

      document.body.classList.remove(
        "cooldown-active",
      );

      message.textContent =
        "Cooldown complete. You are always free to take more time.";
    }
  };

  update();

  cooldownTimer = setInterval(
    update,
    1000,
  );

  document
    .querySelector("#safetyCenter")
    .scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
}

document
  .querySelector("#cooldownButton")
  .addEventListener("click", () => {
    startCooldown(60);
  });

document
  .querySelector("#takeBreak")
  .addEventListener("click", () => {
    startCooldown(60);
  });

document
  .querySelector("#setReminder")
  .addEventListener("click", () => {
    document.querySelector(
      "#safetyMessage",
    ).textContent =
      "Reality reminder set. GamGo will remind you after 20 minutes of play.";
  });

document
  .querySelector("#resetCredits")
  .addEventListener("click", () => {
    balance = 1000;

    updateBalance();

    document.querySelector(
      "#safetyMessage",
    ).textContent =
      "Your demo wallet was reset to $1,000. No value was gained or lost.";
  });

document
  .querySelector(
    "#earnCreditsButton",
  )
  .addEventListener("click", () => {
    document
      .querySelector(".offers-section")
      .scrollIntoView({
        behavior: "smooth",
      });
  });

document
  .querySelector("#dailyCheckin")
  .addEventListener("click", () => {
    const today =
      new Date().toDateString();

    if (
      localStorage.getItem(
        "gamgoCheckin",
      ) === today
    ) {
      document.querySelector(
        "#safetyMessage",
      ).textContent =
        "You already completed today's healthy-play check-in.";
    } else {
      points += 25;

      updatePoints();

      localStorage.setItem(
        "gamgoCheckin",
        today,
      );

      document.querySelector(
        "#safetyMessage",
      ).textContent =
        "Check-in complete: 25 GoPoints earned for engaging with your play controls.";
    }

    document
      .querySelector("#safetyCenter")
      .scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
  });

document
  .querySelectorAll(".redeem-button")
  .forEach((button) => {
    button.addEventListener(
      "click",
      () => {
        const cost = Number(
          button.dataset.cost,
        );

        if (points < cost) {
          document.querySelector(
            "#safetyMessage",
          ).textContent =
            `You need ${cost - points} more GoPoints. Check in and complete healthy-play activities to earn them.`;

          document
            .querySelector(
              "#safetyCenter",
            )
            .scrollIntoView({
              behavior: "smooth",
              block: "center",
            });

          return;
        }

        points -= cost;

        updatePoints();

        button.textContent =
          `${button.dataset.reward} redeemed`;

        button.disabled = true;
      },
    );
  });

/* ---------------------- */
/* Session timer          */
/* ---------------------- */

setInterval(() => {
  const elapsed = Math.floor(
    (Date.now() - sessionStarted) /
      1000,
  );

  const minutes = String(
    Math.floor(elapsed / 60),
  ).padStart(2, "0");

  const seconds = String(
    elapsed % 60,
  ).padStart(2, "0");

  document.querySelector(
    "#sessionTime",
  ).textContent =
    `${minutes}:${seconds}`;

  if (elapsed === 1200) {
    document.querySelector(
      "#safetyMessage",
    ).textContent =
      "You have been playing for 20 minutes. This is a good time to pause and check in with yourself.";

    document
      .querySelector("#safetyCenter")
      .scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
  }
}, 1000);

/* ---------------------- */
/* Start the application  */
/* ---------------------- */

renderGames();
updateBetSlip();
updateBalance();
updatePoints();