import * as THREE from "three";

const colors = {
  ink: "#170a1c",
  deep: "#211226",
  paper: "#fffaff",
  white: "#ffffff",
  lilac: "#eddfef",
  muted: "#786b7b",
  aqua: "#88e0d9",
  coral: "#ef8354",
  forest: "#32533d",
  keyboard: "#efedf4"
};

const keyRows = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["⇧", "z", "x", "c", "v", "b", "n", "m", "⌫"]
];

function roundedRect(context, x, y, width, height, radius, fill, stroke, lineWidth = 1) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  if (fill) {
    context.fillStyle = fill;
    context.fill();
  }
  if (stroke) {
    context.strokeStyle = stroke;
    context.lineWidth = lineWidth;
    context.stroke();
  }
}

function text(context, value, x, y, size, weight = 700, color = colors.ink, align = "left") {
  context.font = `${weight} ${size}px Nunito, system-ui, sans-serif`;
  context.textAlign = align;
  context.textBaseline = "middle";
  context.fillStyle = color;
  context.fillText(value, x, y);
}

function textWidth(context, value, size, weight = 700) {
  context.font = `${weight} ${size}px Nunito, system-ui, sans-serif`;
  return context.measureText(value).width;
}

function drawKeyboard(context) {
  context.fillStyle = colors.keyboard;
  context.fillRect(0, 1110, 768, 490);

  text(context, "▦", 54, 1153, 25, 900, colors.deep, "center");
  text(context, "☺", 158, 1153, 27, 900, colors.deep, "center");
  text(context, "GIF", 270, 1153, 19, 900, colors.deep, "center");
  text(context, "▣", 386, 1153, 25, 900, colors.deep, "center");
  text(context, "⚙", 506, 1153, 25, 900, colors.deep, "center");
  roundedRect(context, 665, 1123, 56, 56, 28, colors.white);
  text(context, "●", 693, 1151, 22, 900, colors.coral, "center");

  keyRows.forEach((row, rowIndex) => {
    const gap = 8;
    const normalWidth = rowIndex === 0 ? 66 : 68;
    const wideWidth = 88;
    const widths = row.map((key) => (key === "⇧" || key === "⌫" ? wideWidth : normalWidth));
    const total = widths.reduce((sum, width) => sum + width, 0) + gap * (row.length - 1);
    let cursor = (768 - total) / 2;
    const y = 1205 + rowIndex * 82;
    row.forEach((key, keyIndex) => {
      const width = widths[keyIndex];
      roundedRect(context, cursor, y, width, 66, 12, key === "⇧" || key === "⌫" ? "#dfe2ee" : colors.white);
      text(context, key, cursor + width / 2, y + 34, 28, 700, colors.deep, "center");
      cursor += width + gap;
    });
  });

  roundedRect(context, 24, 1451, 104, 70, 34, "#dfe2ee");
  text(context, "?123", 76, 1486, 20, 800, colors.deep, "center");
  roundedRect(context, 140, 1451, 66, 70, 14, colors.white);
  text(context, ",", 173, 1481, 30, 800, colors.deep, "center");
  roundedRect(context, 218, 1451, 332, 70, 14, colors.white);
  text(context, "English", 384, 1486, 19, 700, colors.muted, "center");
  roundedRect(context, 562, 1451, 68, 70, 14, colors.white);
  text(context, ".", 596, 1479, 30, 800, colors.deep, "center");
  roundedRect(context, 642, 1451, 102, 70, 34, "#cfe8e5");
  text(context, "↵", 693, 1485, 30, 900, colors.deep, "center");
  roundedRect(context, 305, 1570, 158, 7, 7, "rgba(23,10,28,.78)");
}

function drawNotification(context) {
  context.save();
  context.shadowColor = "rgba(17,7,21,.26)";
  context.shadowBlur = 34;
  context.shadowOffsetY = 16;
  roundedRect(context, 36, 260, 696, 128, 30, "#f2eaf4");
  context.restore();
  roundedRect(context, 58, 281, 82, 82, 41, colors.aqua, colors.ink, 5);
  text(context, "B", 99, 322, 39, 950, colors.ink, "center");
  text(context, "Blabb bubble snoozed", 162, 307, 24, 950);
  text(context, "Returns automatically in 10 minutes", 162, 342, 17, 700, colors.muted);
  text(context, "END", 694, 323, 17, 950, colors.forest, "right");
}

export function createScreenTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 1600;
  const context = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;

  let state = "hero";
  let phase = 0;

  function render() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.save();
    context.beginPath();
    context.roundRect(0, 0, canvas.width, canvas.height, 46);
    context.clip();
    context.fillStyle = colors.paper;
    context.fillRect(0, 0, canvas.width, canvas.height);

    text(context, "9:41", 46, 48, 23, 950);
    text(context, "▮  ◡", 718, 48, 21, 900, colors.ink, "right");
    context.fillStyle = colors.lilac;
    context.fillRect(0, 90, 768, 2);
    roundedRect(context, 36, 112, 62, 62, 31, colors.coral);
    text(context, "M", 67, 144, 29, 950, colors.ink, "center");
    text(context, "Maya", 118, 132, 29, 950);
    text(context, "online", 118, 163, 17, 750, colors.forest);
    text(context, "•••", 716, 144, 26, 950, colors.ink, "right");
    context.fillStyle = colors.lilac;
    context.fillRect(0, 198, 768, 2);

    const gradient = context.createLinearGradient(0, 200, 0, 940);
    gradient.addColorStop(0, colors.paper);
    gradient.addColorStop(1, "#faf4fb");
    context.fillStyle = gradient;
    context.fillRect(0, 200, 768, 740);
    roundedRect(context, 326, 225, 116, 38, 19, "#f2eaf4");
    text(context, "Tomorrow", 384, 245, 15, 800, colors.muted, "center");
    roundedRect(context, 36, 290, 336, 80, [26, 26, 26, 7], colors.lilac);
    text(context, "Still good for lunch?", 62, 330, 25, 850);

    if (state === "snoozed") drawNotification(context);

    context.fillStyle = colors.white;
    context.fillRect(0, 940, 768, 170);
    context.fillStyle = colors.lilac;
    context.fillRect(0, 940, 768, 2);
    roundedRect(context, 30, 972, 622, 104, 27, colors.white, "#d4c9d6", 3);

    const showFirst = ["insert", "continue", "undo", "snooze", "snoozed", "final"].includes(state);
    const showSecond = state === "continue" && phase < 0.68;
    const composerX = 56;
    const baseLineY = showFirst ? 1003 : 1024;
    const insertionLineY = 1047;
    const baseText = "Lunch tomorrow works.";
    const firstInsertion = "I can meet at 12:30.";
    const secondInsertion = "I’ll bring the notes.";
    text(context, baseText, composerX, baseLineY, 23, 750);

    let cursorX = composerX + textWidth(context, baseText, 23, 750) + 7;
    let cursorY = baseLineY - 17;
    if (showFirst) {
      const firstWidth = textWidth(context, firstInsertion, 22, 800);
      roundedRect(context, composerX - 4, insertionLineY - 16, firstWidth + 8, 30, 6, "rgba(136,224,217,.64)");
      text(context, firstInsertion, composerX, insertionLineY, 22, 800);
      cursorX = composerX + firstWidth + 7;
      cursorY = insertionLineY - 17;
    }
    if (showSecond) {
      const firstWidth = textWidth(context, firstInsertion, 22, 800);
      const secondX = composerX + firstWidth + 18;
      const secondWidth = textWidth(context, secondInsertion, 22, 800);
      roundedRect(context, secondX - 4, insertionLineY - 16, secondWidth + 8, 30, 6, "rgba(239,131,84,.4)");
      text(context, secondInsertion, secondX, insertionLineY, 22, 800);
      cursorX = secondX + secondWidth + 7;
    }
    if (Math.floor(performance.now() / 520) % 2 === 0 && state !== "snoozed") {
      roundedRect(context, cursorX, cursorY, 3, 34, 2, colors.ink);
    }
    roundedRect(context, 674, 990, 66, 66, 33, colors.ink);
    text(context, "↑", 707, 1022, 34, 950, colors.paper, "center");

    drawKeyboard(context);
    context.restore();
    texture.needsUpdate = true;
  }

  function update(nextState, nextPhase = 0) {
    state = nextState;
    phase = nextPhase;
    render();
  }

  render();
  return { canvas, texture, update, render, get state() { return state; } };
}
