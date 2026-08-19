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

// The 3D glass and rounded metal rail cover a few pixels at oblique angles.
// Keep functional UI inside this inset so no text or key is lost behind the
// physical phone frame on narrow mobile renders.
const screenSafe = { left: 64, right: 704 };

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

function opticallyCenteredText(context, value, centerX, centerY, size, weight = 700, color = colors.ink) {
  context.save();
  context.font = `${weight} ${size}px Nunito, system-ui, sans-serif`;
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  context.fillStyle = color;
  const metrics = context.measureText(value);
  const x = centerX + (metrics.actualBoundingBoxLeft - metrics.actualBoundingBoxRight) / 2;
  const y = centerY + (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2;
  context.fillText(value, x, y);
  context.restore();
}

function drawStatusIcons(context) {
  context.save();
  context.fillStyle = colors.ink;
  context.strokeStyle = colors.ink;
  context.lineCap = "round";

  // Four ascending cellular bars, matching the familiar Android status glyph.
  [7, 11, 15, 19].forEach((height, index) => {
    roundedRect(context, 610 + index * 7, 57 - height, 4, height, 2, colors.ink);
  });

  // Wi-Fi arcs and center dot are drawn as paths so they stay legible after
  // the canvas is mipmapped onto the phone screen.
  context.lineWidth = 3.5;
  context.beginPath();
  context.arc(656, 55, 16, Math.PI * 1.18, Math.PI * 1.82);
  context.stroke();
  context.beginPath();
  context.arc(656, 55, 9, Math.PI * 1.18, Math.PI * 1.82);
  context.stroke();
  context.beginPath();
  context.arc(656, 54, 2.4, 0, Math.PI * 2);
  context.fill();

  // Vertical Android-style battery, filled upward from the bottom to roughly
  // 70%, with the positive terminal centered above the outline.
  context.lineWidth = 2.5;
  roundedRect(context, 687, 35, 14, 21, 3, null, colors.ink, 2.5);
  roundedRect(context, 690, 42, 8, 11, 1.5, colors.ink);
  roundedRect(context, 691, 31, 6, 4, 1.5, colors.ink);
  context.restore();
}

function drawKeyboard(context) {
  context.fillStyle = colors.keyboard;
  context.fillRect(0, 1110, 768, 490);

  text(context, "▦", screenSafe.left, 1153, 25, 900, colors.deep, "center");
  text(context, "☺", 158, 1153, 27, 900, colors.deep, "center");
  text(context, "GIF", 270, 1153, 19, 900, colors.deep, "center");
  text(context, "▣", 386, 1153, 25, 900, colors.deep, "center");
  text(context, "⚙", 506, 1153, 25, 900, colors.deep, "center");
  roundedRect(context, 648, 1123, 56, 56, 28, colors.white);
  text(context, "●", 676, 1151, 22, 900, colors.coral, "center");

  keyRows.forEach((row, rowIndex) => {
    const gap = rowIndex === 0 ? 6 : 8;
    const normalWidth = rowIndex === 0 ? 58 : rowIndex === 1 ? 62 : 55;
    const wideWidth = 76;
    const widths = row.map((key) => (key === "⇧" || key === "⌫" ? wideWidth : normalWidth));
    const total = widths.reduce((sum, width) => sum + width, 0) + gap * (row.length - 1);
    let cursor = screenSafe.left + (screenSafe.right - screenSafe.left - total) / 2;
    const y = 1205 + rowIndex * 82;
    row.forEach((key, keyIndex) => {
      const width = widths[keyIndex];
      roundedRect(context, cursor, y, width, 66, 12, key === "⇧" || key === "⌫" ? "#dfe2ee" : colors.white);
      text(context, key, cursor + width / 2, y + 34, 28, 700, colors.deep, "center");
      cursor += width + gap;
    });
  });

  roundedRect(context, 40, 1451, 94, 70, 34, "#dfe2ee");
  text(context, "?123", 87, 1486, 20, 800, colors.deep, "center");
  roundedRect(context, 146, 1451, 58, 70, 14, colors.white);
  text(context, ",", 175, 1481, 30, 800, colors.deep, "center");
  roundedRect(context, 216, 1451, 300, 70, 14, colors.white);
  text(context, "English", 366, 1486, 19, 700, colors.muted, "center");
  roundedRect(context, 528, 1451, 58, 70, 14, colors.white);
  text(context, ".", 557, 1479, 30, 800, colors.deep, "center");
  roundedRect(context, 598, 1451, 106, 70, 34, "#cfe8e5");
  text(context, "↵", 651, 1485, 30, 900, colors.deep, "center");
  roundedRect(context, 305, 1570, 158, 7, 7, "rgba(23,10,28,.78)");
}

function drawBrandMark(context, logoImage, x, y, size, radius = size * 0.24) {
  context.save();
  context.beginPath();
  context.roundRect(x, y, size, size, radius);
  context.clip();
  context.fillStyle = colors.aqua;
  context.fillRect(x, y, size, size);
  if (logoImage) {
    const scaledSize = size * 1.25;
    const offset = (scaledSize - size) / 2;
    context.drawImage(logoImage, x - offset, y - offset, scaledSize, scaledSize);
  }
  context.restore();
}

function drawNotification(context, logoImage) {
  context.save();
  context.shadowColor = "rgba(17,7,21,.26)";
  context.shadowBlur = 34;
  context.shadowOffsetY = 16;
  roundedRect(context, 52, 260, 664, 128, 30, "#f2eaf4");
  context.restore();
  drawBrandMark(context, logoImage, 70, 281, 82);
  text(context, "Blabb bubble snoozed", 174, 307, 24, 950);
  text(context, "It will return automatically in 10 minutes.", 174, 342, 17, 700, colors.muted);
  text(context, "End snooze", 686, 323, 17, 950, colors.forest, "right");
}

export function createScreenTexture(logoImage) {
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
    context.roundRect(0, 0, canvas.width, canvas.height, 34);
    context.clip();
    context.fillStyle = colors.paper;
    context.fillRect(0, 0, canvas.width, canvas.height);

    text(context, "9:41", screenSafe.left, 48, 23, 950);
    drawStatusIcons(context);
    context.fillStyle = colors.lilac;
    context.fillRect(0, 90, 768, 2);
    roundedRect(context, 52, 112, 62, 62, 31, colors.coral);
    opticallyCenteredText(context, "M", 83, 143, 29, 950);
    text(context, "Maya", 134, 132, 29, 950);
    text(context, "online", 134, 163, 17, 750, colors.forest);
    text(context, "•••", screenSafe.right, 144, 26, 950, colors.ink, "right");
    context.fillStyle = colors.lilac;
    context.fillRect(0, 198, 768, 2);

    const gradient = context.createLinearGradient(0, 200, 0, 940);
    gradient.addColorStop(0, colors.paper);
    gradient.addColorStop(1, "#faf4fb");
    context.fillStyle = gradient;
    context.fillRect(0, 200, 768, 740);
    roundedRect(context, 326, 225, 116, 38, 19, "#f2eaf4");
    text(context, "Today", 384, 245, 15, 800, colors.muted, "center");
    roundedRect(context, 52, 290, 336, 80, [26, 26, 26, 7], colors.lilac);
    text(context, "Still good for lunch?", 78, 330, 25, 850);

    if (state === "snoozed") drawNotification(context, logoImage);

    context.fillStyle = colors.white;
    context.fillRect(0, 940, 768, 170);
    context.fillStyle = colors.lilac;
    context.fillRect(0, 940, 768, 2);
    roundedRect(context, 50, 972, 574, 104, 27, colors.white, "#d4c9d6", 3);

    const showFirst = ["insert", "continue", "undo", "snooze", "snoozed", "final"].includes(state);
    const showSecond = state === "continue" && phase < 0.68;
    const composerX = 72;
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
    // Keep the caret stable. Re-uploading this full 768x1600 canvas merely to
    // blink a three-pixel cursor can flash on tiled mobile GPUs.
    if (state !== "snoozed") {
      roundedRect(context, cursorX, cursorY, 3, 34, 2, colors.ink);
    }
    roundedRect(context, 628, 982, 76, 76, 38, colors.aqua);
    text(context, "↑", 666, 1019, 38, 950, colors.ink, "center");

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
