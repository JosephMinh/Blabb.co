const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));
document.querySelector('#year').textContent = new Date().getFullYear();

const demoButton = document.querySelector('#voice-demo');
const typedMessage = document.querySelector('#typed-message');
const typingHint = document.querySelector('#typing-hint');
const phrase = 'Absolutely—how about 12:30?';
let demoTimer;

function runDemo() {
  window.clearInterval(demoTimer);
  typedMessage.textContent = '';
  typingHint.textContent = 'Listening on this phone…';
  demoButton.classList.add('listening');
  demoButton.setAttribute('aria-label', 'Blabb is listening');

  window.setTimeout(() => {
    demoButton.classList.remove('listening');
    typingHint.textContent = 'Typing locally…';
    let index = 0;
    demoTimer = window.setInterval(() => {
      typedMessage.textContent = phrase.slice(0, ++index);
      if (index === phrase.length) {
        window.clearInterval(demoTimer);
        typingHint.textContent = 'Done — nothing sent to the cloud';
        demoButton.setAttribute('aria-label', 'Replay the Blabb voice typing demo');
      }
    }, 42);
  }, 950);
}

demoButton.addEventListener('click', runDemo);

