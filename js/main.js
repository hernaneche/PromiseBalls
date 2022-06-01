let mainBallsArray = [];
let mainPushFunctionsArray = [];
let mainAllPaused = false;
const RACE = "race",
  ALL_OK_OR_ERROR = "all", //all ok or any error
  ALL_SETTLED = "allSettled";

const BUTTON_PAUSE_STR = "Pause";
const BUTTON_CONTINUE_STR = "Continue";
const BUTTON_START_STR = "Start";

async function ballHandler(pushFunctions, modo) {
  console.log(
    "<span class='console-blue'> await Promise." + modo + "...&#8987;</span>"
  );
  switch (modo) {
    case RACE:
      try {
        const x = await Promise.race(pushFunctions);
        console.log(
          " 1º <span class='console-green'>fullfilled</span>: " +
            JSON.stringify({ ball: x.index })
        );
      } catch (x) {
        console.log(
          "1º <span class='console-red'>rejected</span>: " +
            JSON.stringify({ ball: x.index, reason: x.reason })
        );
      }
      break;

    case ALL_OK_OR_ERROR:
      try {
        const x = await Promise.all(pushFunctions);
        console.log(
          "<span class='console-green'>fullfilled</span>: " +
            JSON.stringify(
              x
                .map((obj) => ({ ball: obj.index, place: obj.order }))
                .sort((a, b) => a.place - b.place)
            )
        );
      } catch (e) {
        console.log(
          "1º <span class='console-red'>rejected(fast-fail)</span>: " +
            JSON.stringify({ ball: e.index, reason: e.reason })
        );
      }
      break;
    case ALL_SETTLED:
      try {
        const x = await Promise.allSettled(pushFunctions); // returns array {status, value}
        console.log(
          "<span class='console-green'>fullfilled</span>: " +
            JSON.stringify(
              x
                .filter((i) => i.status == "fulfilled")
                .map((obj) => ({
                  ball: obj.value.index,
                  place: obj.value.order,
                }))
                .sort((a, b) => a.place - b.place)
            ) +
            " <span class='console-red'>rejected</span>: " +
            JSON.stringify(
              x
                .filter((i) => i.status != "fulfilled")
                .map((obj) => ({
                  ball: obj.reason.index,
                  reason: obj.reason.reason,
                }))
            )
        );
      } catch (e) {
        //<-- este catch NO va a dispararse con las promesas rejected, pero sí con un throw exception el then
        console.log("Catch :" + JSON.stringify(e));
      }
      break;
  }
}

function addBallsWithPromises(balls, pushFuncsArr, total) {
  for (let i = 0; i < total; i++) {
    let p = new Promise((res, rej) => {
      let ball = new Ball(randomColor(0.9), res, rej);
      balls.push(ball);
    });
    pushFuncsArr.push(p);
  }
}

async function addNewBalls(balls, pushFunctionsArray, n, launch, mode) {
  let oldIndex = balls.length;
  console.log("launch=" + launch + " mode:" + mode);

  addBallsWithPromises(balls, pushFunctionsArray, n);

  switch (launch) {
    case "serial":
      console.log("Run all " + n + " balls");
      for (let i = oldIndex; i < Number(Number(oldIndex) + Number(n)); i++) {
        setTimeout(() => {
          balls[i].run = true;
          console.log("Run ball " + i);
        }, 100 * i);
      }
      await ballHandler(
        pushFunctionsArray,
        document.getElementById("mode").value
      );
      break;
    case "serial wait":
      for (let i = oldIndex; i < Number(Number(oldIndex) + Number(n)); i++) {
        console.log("Run ball " + i);
        balls[i].run = true;
        await ballHandler(
          [pushFunctionsArray[i]],
          document.getElementById("mode").value
        );
      }
      break;
    case "parallel":
      console.log("Run all " + n + " balls");
      for (let i = oldIndex; i < Number(Number(oldIndex) + Number(n)); i++) {
        balls[i].run = true;
      }
      await ballHandler(
        pushFunctionsArray,
        document.getElementById("mode").value
      );
      break;
  }
  endBalls("arena1", "Done");
}

function reloadPage() {
  window.location.reload();
}
function clearLog() {
  localStorage.setItem("console", "");
  reloadPage();
}
const resetConsole = clearLog;

function initConsole() {
  const initialText = localStorage.getItem("console");
  console.oldlog = console.log;
  let odd;
  function webConsole(id, message) {
    const conElement = document.getElementById(id);
    conElement.innerHTML +=
      "<div class='new line " +
      (odd ? "odd" : "even") +
      "'>" +
      /*new Date().toISOString().split('T')[1].split('Z')[0] +
          " " +*/
      message.replaceAll("\n", "\n<br>").replaceAll("new", "");
    ("</div>");
    conElement.scrollTop = conElement.scrollHeight;
    localStorage.setItem("console", conElement.innerHTML);

    odd = !odd;
  }
  console.log = function (message) {
    console.oldlog(message);
    webConsole("webConsole", message);
  };
  console.log((initialText != null ? initialText : "") + " \u{26A1}");
}

function initListeners() {
  const startButtonElement = document.getElementById("start");
  startButtonElement.addEventListener("mousedown", () => {
    if (startButtonElement.innerText == BUTTON_START_STR) {
      Ball.collisionEnabled = document.getElementById("collision").checked;
      addNewBalls(
        mainBallsArray,
        mainPushFunctionsArray,
        document.getElementById("ballCount").value,
        document.getElementById("launch").value,
        document.getElementById("mode").value
      );
      startButtonElement.innerText = BUTTON_PAUSE_STR;
    } else {
      mainAllPaused = !mainAllPaused;
      pauseBalls(mainBallsArray, mainAllPaused);
    }
    startButtonElement.innerText = mainAllPaused
      ? BUTTON_CONTINUE_STR
      : BUTTON_PAUSE_STR;
    startButtonElement.style.backgroundColor = mainAllPaused ? "green" : "gray";
  });

  document.getElementById("reset").addEventListener("mousedown", () => {
    resetConsole();
    reloadPage();
  });

  document.getElementById("collision").addEventListener("change", () => {
    Ball.collisionEnabled = document.getElementById("collision").checked;
    console.log("Ball.collisionEnabled:" + Ball.collisionEnabled);
  });
}

function init() {
  mainBallsArray = [];
  mainPushFunctionsArray = [];
  mainAllPaused = false;
  initBallScene("arena1", mainBallsArray);

  let resizeFunc = () => {
    var width = window.innerWidth || document.documentElement.clientWidth;
    var height = window.innerHeight || document.documentElement.clientHeight;
    var canvas = [...document.getElementsByTagName("canvas")];

    canvas.forEach((canvas) => {
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    });
  };

  window.addEventListener("resize", resizeFunc);
  resizeFunc();

  document.getElementById("start").innerText = BUTTON_START_STR;

  initConsole();

  initListeners();
}

init();
