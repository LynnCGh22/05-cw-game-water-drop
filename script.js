// Variables to control game state
let gameRunning = false; // Keeps track of whether game is active or not
let gamePaused = false;
let dropMaker; // Will store our timer that creates drops regularly
let timerInterval;
const GAME_DURATION = 30;
let timeLeft = GAME_DURATION;
const CLEAN_DROP_CHANCE = 0.7;
const SCORE_PER_CLEAN_DROP = 10;
const SCORE_PER_DIRTY_DROP = -10;
const MAX_WATER_SCORE = 100; // 10 clean drops fills the bar
let currentScore = 0;
let waterCollected = 0;
const waterBarFill = document.getElementById("score-bar");
const catcher = document.querySelector(".catcher");
const bucket = document.querySelector(".bucket");
const grass = document.querySelector(".grass");
const gameContainer = document.getElementById("game-container");
const clouds = Array.from(document.querySelectorAll(".cloud"));
const catcherNav = document.getElementById("catcher-nav");
const scoreElement = document.getElementById("score");
const timeElement = document.getElementById("time");
const CONFETTI_COLORS = [
  "#FFC907",
  "#2E9DF7",
  "#8BD1CB",
  "#4FCB53",
  "#FF902A",
  "#F5402C",
  "#F16061",
];

function updateCatcherPosition(positionPercent) {
  catcher.style.left = `${positionPercent}%`;
}

function getRandomDropType() {
  if (Math.random() < CLEAN_DROP_CHANCE) {
    return "clean-water-drop";
  }

  return Math.random() < 0.5
    ? "dirty-water-drop-green"
    : "dirty-water-drop-brown";
}

function updateScoreDisplay() {
  scoreElement.textContent = currentScore;
}

function getDropScore(drop) {
  if (drop.classList.contains("clean-water-drop")) {
    return SCORE_PER_CLEAN_DROP;
  }

  return SCORE_PER_DIRTY_DROP;
}

function intersects(rectA, rectB) {
  return !(
    rectA.right < rectB.left ||
    rectA.left > rectB.right ||
    rectA.bottom < rectB.top ||
    rectA.top > rectB.bottom
  );
}

function getDropStartX(size) {
  const fallbackX = Math.random() * (gameContainer.offsetWidth - size);

  if (clouds.length === 0) {
    return fallbackX;
  }

  const cloud = clouds[Math.floor(Math.random() * clouds.length)];
  const cloudRect = cloud.getBoundingClientRect();
  const containerRect = gameContainer.getBoundingClientRect();
  const cloudCenterX = cloudRect.left - containerRect.left + cloudRect.width / 2;
  const jitter = (Math.random() - 0.5) * Math.min(cloudRect.width * 0.6, 34);
  const left = cloudCenterX + jitter - size / 2;

  return Math.max(0, Math.min(left, gameContainer.offsetWidth - size));
}

// Wait for button click to start the game
document.getElementById("start-btn").addEventListener("click", startGame);
document.getElementById("pause-btn").addEventListener("click", pauseGame);
document.getElementById("resume-btn").addEventListener("click", resumeGame);
document.getElementById("restart-btn").addEventListener("click", restartGame);
document.getElementById("end-btn").addEventListener("click", endGameAndReset);
catcherNav.addEventListener("input", (event) => {
  updateCatcherPosition(event.target.value);
});

updateCatcherPosition(catcherNav.value);

function showPauseOverlay() {
  document.getElementById("pause-overlay").hidden = false;
}

function hidePauseOverlay() {
  document.getElementById("pause-overlay").hidden = true;
}

function triggerConfetti() {
  const existingLayer = gameContainer.querySelector(".celebration-confetti");
  if (existingLayer) {
    existingLayer.remove();
  }

  const confettiLayer = document.createElement("div");
  confettiLayer.className = "celebration-confetti";
  confettiLayer.style.setProperty(
    "--confetti-fall-distance",
    `${gameContainer.clientHeight + 40}px`
  );

  const pieceCount = 80;

  for (let i = 0; i < pieceCount; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.backgroundColor =
      CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    piece.style.setProperty("--confetti-drift", `${(Math.random() - 0.5) * 220}px`);
    piece.style.setProperty("--confetti-rotate", `${Math.random() * 1080 - 540}deg`);
    piece.style.setProperty("--confetti-duration", `${1.8 + Math.random() * 1.2}s`);
    piece.style.setProperty("--confetti-delay", `${Math.random() * 0.35}s`);
    confettiLayer.appendChild(piece);
  }

  gameContainer.appendChild(confettiLayer);
  setTimeout(() => confettiLayer.remove(), 3200);
}

function startTimer() {
  timerInterval = setInterval(() => {
    timeLeft--;
    timeElement.textContent = timeLeft;
    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function RulesSection() {
  print("Catch the blue clean-water drops to earn +10 points each. \nWatch out for the green and brown polluted drops—touching one will cost you 10 points and slow your progress. \nFill the water bar by catching clean drops, but be careful: if you catch too many dirty drops, your water bar will decrease. \nThe game lasts for 30 seconds, so move quickly and aim for a high score! \nYou can pause or restart the game at any time using the buttons provided.");
}

function endGame() {
  gameRunning = false;
  gamePaused = false;
  clearInterval(dropMaker);
  clearInterval(timerInterval);
  document
    .querySelectorAll(".clean-water-drop, .dirty-water-drop-green, .dirty-water-drop-brown")
    .forEach((drop) => drop.remove());
  hidePauseOverlay();
  document.getElementById("pause-btn").hidden = true;
  triggerConfetti();
  setTimeout(() => {
    alert(`Game Over! Your final score is: ${currentScore}`);
    timeLeft = GAME_DURATION;
    timeElement.textContent = GAME_DURATION;
  }, 1100);
}

function pauseGame() {
  if (!gameRunning) return;
  gameRunning = false;
  gamePaused = true;
  clearInterval(dropMaker);
  clearInterval(timerInterval);
  document
    .querySelectorAll(".clean-water-drop, .dirty-water-drop-green, .dirty-water-drop-brown")
    .forEach((d) => (d.style.animationPlayState = "paused"));
  showPauseOverlay();
}

function resumeGame() {
  gamePaused = false;
  gameRunning = true;
  document
    .querySelectorAll(".clean-water-drop, .dirty-water-drop-green, .dirty-water-drop-brown")
    .forEach((d) => (d.style.animationPlayState = "running"));
  startTimer();
  dropMaker = setInterval(createDrop, 1000);
  hidePauseOverlay();
}

function restartGame() {
  clearInterval(dropMaker);
  clearInterval(timerInterval);
  gamePaused = false;
  document
    .querySelectorAll(".clean-water-drop, .dirty-water-drop-green, .dirty-water-drop-brown")
    .forEach((drop) => drop.remove());
  hidePauseOverlay();
  currentScore = 0;
  waterCollected = 0;
  updateScoreDisplay();
  updateWaterBar();
  timeLeft = GAME_DURATION;
  timeElement.textContent = GAME_DURATION;
  gameRunning = true;
  startTimer();
  dropMaker = setInterval(createDrop, 1000);
}

function endGameAndReset() {
  clearInterval(dropMaker);
  clearInterval(timerInterval);
  gameRunning = false;
  gamePaused = false;
  document
    .querySelectorAll(".clean-water-drop, .dirty-water-drop-green, .dirty-water-drop-brown")
    .forEach((drop) => drop.remove());
  hidePauseOverlay();
  document.getElementById("pause-btn").hidden = true;
  currentScore = 0;
  waterCollected = 0;
  updateScoreDisplay();
  updateWaterBar();
  timeLeft = GAME_DURATION;
  timeElement.textContent = GAME_DURATION;
}

function startGame() {
  // Prevent multiple games from running at once
  if (gameRunning || gamePaused) return;

  gameRunning = true;
  currentScore = 0;
  waterCollected = 0;
  updateWaterBar();
  updateScoreDisplay();
  timeLeft = GAME_DURATION;
  timeElement.textContent = timeLeft;
  document.getElementById("pause-btn").hidden = false;

  startTimer();

  // Create new drops every second (1000 milliseconds)
  dropMaker = setInterval(createDrop, 1000);
}

function createDrop() {
  // Create a new div element that will be our water drop
  const drop = document.createElement("div");
  drop.className = getRandomDropType();

  // Make drops different sizes for visual variety
  const initialSize = 60;
  const sizeMultiplier = Math.random() * 0.8 + 0.5;
  const size = initialSize * sizeMultiplier;
  drop.style.width = drop.style.height = `${size}px`;
  drop.style.pointerEvents = "none";

  // Position the drop randomly across the game width
  // Subtract 60 pixels to keep drops fully inside the container
  const xPosition = getDropStartX(size);
  drop.style.left = xPosition + "px";
  drop.style.top = "46px";

  // Make drops fall for 4 seconds
  drop.style.animationDuration = "4s";

  // Add the new drop to the game screen
  gameContainer.appendChild(drop);

  let dropResolved = false;
  let collisionFrameId;

  function resolveDrop(caughtByBucket = false, hitGrass = false) {
    if (dropResolved) return;

    dropResolved = true;
    cancelAnimationFrame(collisionFrameId);

    if (caughtByBucket) {
      currentScore += getDropScore(drop);
      updateScoreDisplay();
      if (drop.classList.contains("clean-water-drop")) {
        waterCollected = Math.min(waterCollected + SCORE_PER_CLEAN_DROP, MAX_WATER_SCORE);
      } else {
        waterCollected = Math.max(waterCollected + SCORE_PER_DIRTY_DROP, 0);
      }
      updateWaterBar();
      drop.style.animationPlayState = "paused";
      setTimeout(() => {
        drop.remove();
      }, 80);
      return;
    }

    if (hitGrass) {
      drop.style.animationPlayState = "paused";
      drop.classList.add("splash");
      setTimeout(() => drop.remove(), 300);
      return;
    }

    drop.remove();
  }

  function checkBucketCollision() {
    if (dropResolved || !drop.isConnected) return;

    if (gamePaused) {
      collisionFrameId = requestAnimationFrame(checkBucketCollision);
      return;
    }

    const dropRect = drop.getBoundingClientRect();
    const bucketRect = bucket.getBoundingClientRect();
    const grassRect = grass.getBoundingClientRect();

    if (intersects(dropRect, bucketRect)) {
      resolveDrop(true);
      return;
    }

    if (intersects(dropRect, grassRect)) {
      resolveDrop(false, true);
      return;
    }

    collisionFrameId = requestAnimationFrame(checkBucketCollision);
  }

  collisionFrameId = requestAnimationFrame(checkBucketCollision);
}

function updateScoreBar(currentScore, maxScore) {
    const percentage = Math.max(0, (currentScore / maxScore) * 100);
    document.getElementById("score-bar").style.height = percentage + "%";
}

function updateWaterBar() {
    const pct = (waterCollected / MAX_WATER_SCORE) * 100;
    waterBarFill.style.height = pct + "%";
}

