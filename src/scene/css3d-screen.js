import { CSS3DObject } from "three/addons/renderers/CSS3DRenderer.js";

const keys = [
  ["Q","W","E","R","T","Y","U","I","O","P"],
  ["A","S","D","F","G","H","J","K","L"],
  ["⇧","Z","X","C","V","B","N","M","⌫"],
  ["?123","☺","English","·","↵"]
];

function keyboardMarkup() {
  return keys.map((row, rowIndex) => `<div class="ui-key-row">${row.map((key) => {
    const classes = ["ui-key"];
    if (rowIndex === 2 && (key === "⇧" || key === "⌫")) classes.push("wide");
    if (key === "English") classes.push("space");
    return `<span class="${classes.join(" ")}">${key}</span>`;
  }).join("")}</div>`).join("");
}

export function createScreenSurface() {
  const logoUrl = new URL("../../assets/blabb-glyph.svg", import.meta.url).href;
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
      <div class="ui-state-card"><div class="ui-wave"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><b>Listening on this phone</b><span>No words appear until you stop.</span></div>
      <div class="ui-notification"><img src="${logoUrl}" alt=""><span>Blabb bubble snoozed<small>Returns automatically in 10 minutes</small></span><em>End snooze</em></div>
    </div>
    <div class="ui-composer"><div class="ui-field"><span class="ui-base">Lunch tomorrow works.</span><span class="ui-insert ui-insert-one"></span><span class="ui-insert ui-insert-two"></span><i class="ui-cursor"></i></div><span class="ui-send">↑</span></div>
    <div class="ui-keyboard">${keyboardMarkup()}</div>`;

  const object = new CSS3DObject(element);
  object.scale.setScalar(0.00522);
  object.position.set(0, -0.01, 0.205);

  const stateCard = element.querySelector(".ui-state-card");
  const stateTitle = stateCard.querySelector("b");
  const stateDetail = stateCard.querySelector("span");
  const insertionOne = element.querySelector(".ui-insert-one");
  const insertionTwo = element.querySelector(".ui-insert-two");

  function update(state, phase = 0) {
    element.dataset.state = state;
    insertionOne.textContent = ["insert", "continue", "undo", "snooze", "snoozed"].includes(state) ? " I can meet at 12:30." : "";
    insertionTwo.textContent = state === "continue" && phase < 0.68 ? " I’ll bring the notes." : "";

    if (state === "dictate") {
      stateTitle.textContent = "Listening on this phone";
      stateDetail.textContent = "No words appear until you stop.";
    } else if (state === "process") {
      stateTitle.textContent = "Processing full recording";
      stateDetail.textContent = "Local voice engine · network not used";
    }
  }

  return { object, element, update };
}
