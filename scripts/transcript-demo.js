const results = {
  "true-true": "Hey, send the draft, then call me?<br />Comma means the word.",
  "true-false": "Hey um, send the draft, then call me?<br />Comma means the word.",
  "false-true": "Hey send the draft comma then call me question mark new line literal comma means the word.",
  "false-false": "Hey um send the draft comma then call me question mark new line literal comma means the word."
};

export function initTranscriptDemo() {
  const punctuation = document.querySelector("#punctuation-toggle");
  const fillers = document.querySelector("#filler-toggle");
  const output = document.querySelector("#transcript-result");
  if (!punctuation || !fillers || !output) return;

  function render() {
    const key = `${punctuation.checked}-${fillers.checked}`;
    output.innerHTML = results[key];
  }

  punctuation.addEventListener("change", render);
  fillers.addEventListener("change", render);
  render();
}
