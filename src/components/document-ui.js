async function copyCodeText(text) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {await navigator.clipboard.writeText(text);return;} catch {}
  }
  const previous = document.activeElement;
  const field = document.createElement('textarea');
  field.value = text;
  field.setAttribute('readonly', '');
  field.style.cssText = 'position:fixed;left:-9999px;top:0';
  document.body.appendChild(field);
  field.select();
  const copied = document.execCommand('copy');
  field.remove();
  previous?.focus({preventScroll: true});
  if (!copied) throw new Error('Clipboard unavailable');
}

const copyFeedbackTimers = new WeakMap();

async function handleCodeCopy(event) {
  const button = event.target.closest('[data-copy-code]');
  if (!button) return;
  const code = document.getElementById(button.dataset.copyCode);
  if (!code) return;
  clearTimeout(copyFeedbackTimers.get(button));
  const feedback = (state, label) => {
    button.dataset.copyState = state;
    button.setAttribute('aria-label', label);
    button.setAttribute('title', label);
    button.querySelector('[data-copy-status]').textContent = state === 'ready' ? '' : label;
  };
  try {
    await copyCodeText(code.textContent);
    feedback('copied', 'Код скопирован');
  } catch {
    feedback('error', 'Не удалось скопировать. Выделите код для копирования.');
  }
  copyFeedbackTimers.set(button, setTimeout(() => {
    feedback('ready', 'Копировать код');
    copyFeedbackTimers.delete(button);
  }, 2000));
}

if (typeof module !== 'undefined') module.exports = {copyCodeText, handleCodeCopy};
