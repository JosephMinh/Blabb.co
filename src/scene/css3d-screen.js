import { CSS3DObject } from "three/addons/renderers/CSS3DRenderer.js";

const keys = [
  ["q","w","e","r","t","y","u","i","o","p"],
  ["a","s","d","f","g","h","j","k","l"],
  ["⇧","z","x","c","v","b","n","m","⌫"],
  ["?123",",","☺","",".","↵"]
];

function keyboardMarkup() {
  return keys.map((row, rowIndex) => `<div class="ui-key-row">${row.map((key) => {
    const classes = ["ui-key"];
    if (rowIndex === 2 && (key === "⇧" || key === "⌫")) classes.push("wide");
    if (rowIndex === 3 && key === "") classes.push("space");
    if (rowIndex === 3 && (key === "?123" || key === "↵")) classes.push("pill");
    return `<span class="${classes.join(" ")}">${key || "&nbsp;"}</span>`;
  }).join("")}</div>`).join("");
}

export function createScreenSurface() {
  const logoUrl = new URL("../../assets/blabb-mark.png", import.meta.url).href;
  const element = document.createElement("div");
  element.className = "phone-ui-3d";
  element.setAttribute("aria-hidden", "true");
  element.inert = true;
  element.dataset.state = "ready";
  element.innerHTML = `
    <div class="ui-status"><span>9:41</span><i class="ui-island"></i><span>▮ ◡</span></div>
    <div class="ui-appbar"><span class="ui-avatar">M</span><span class="ui-person">Maya<small>online</small></span><b>•••</b></div>
    <div class="ui-chat">
      <span class="ui-date">Tomorrow</span>
      <div class="ui-message">Still good for lunch?</div>
      <div class="ui-notification"><img src="${logoUrl}" alt=""><span>Blabb bubble snoozed<small>Returns automatically in 10 minutes</small></span><em>End snooze</em></div>
    </div>
    <div class="ui-composer"><div class="ui-field"><span class="ui-base">Lunch tomorrow works.</span><span class="ui-insert ui-insert-one"></span><span class="ui-insert ui-insert-two"></span><i class="ui-cursor"></i></div><span class="ui-send">↑</span></div>
    <div class="ui-keyboard"><div class="ui-key-tools"><span>▦</span><span>☺</span><span>GIF</span><span>▣</span><span>⚙</span><span>◉</span><b>●</b></div>${keyboardMarkup()}</div>
    <div class="ui-bubble"><span class="ui-bubble-ring"></span><span class="ui-bubble-core"><img src="${logoUrl}" alt=""></span><span class="ui-bubble-badge"><i></i><i></i><i></i></span></div>
    <div class="ui-snooze-target"><span>⌄</span><b>SNOOZE · 10 MIN</b></div>
    <i class="ui-gesture"></i>`;

  const object = new CSS3DObject(element);
  object.scale.setScalar(0.00522);
  object.position.set(0, -0.01, 0.205);

  const insertionOne = element.querySelector(".ui-insert-one");
  const insertionTwo = element.querySelector(".ui-insert-two");

  function update(state, phase = 0) {
    element.dataset.state = state;
    const isListening = state === "dictate" || (state === "continue" && phase > 0.18 && phase < 0.39);
    const isProcessing = state === "process" || (state === "continue" && phase >= 0.39 && phase < 0.56);
    const isSuccess = ["insert", "continue"].includes(state) && !isListening && !isProcessing;
    element.dataset.bubbleState = isListening ? "listening" : isProcessing ? "processing" : isSuccess ? "success" : "ready";

    let bubbleX = 0;
    let bubbleY = 0;
    let bubbleOpacity = state === "snoozed" ? 0 : 1;
    let snoozeOpacity = 0;
    if (state === "snooze") {
      if (phase < 0.25) bubbleX = -540 * (phase / 0.25);
      else if (phase < 0.5) {
        bubbleX = -540;
        bubbleY = 327 * ((phase - 0.25) / 0.25);
        snoozeOpacity = 1;
      } else if (phase < 0.76) {
        bubbleX = -540;
        bubbleY = 327;
        bubbleOpacity = 0;
        snoozeOpacity = phase < 0.62 ? 1 : 0;
      } else bubbleX = -540 * (1 - (phase - 0.76) / 0.24);
    }
    element.style.setProperty("--ui-bubble-x", `${bubbleX}px`);
    element.style.setProperty("--ui-bubble-y", `${bubbleY}px`);
    element.style.setProperty("--ui-bubble-opacity", bubbleOpacity);
    element.style.setProperty("--ui-snooze-opacity", snoozeOpacity);
    insertionOne.textContent = ["insert", "continue", "undo", "snooze", "snoozed"].includes(state) ? " I can meet at 12:30." : "";
    insertionTwo.textContent = state === "continue" && phase < 0.68 ? " I’ll bring the notes." : "";
  }

  return { object, element, update };
}
