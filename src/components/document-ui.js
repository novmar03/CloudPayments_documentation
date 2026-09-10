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

async function handleCodeCopy(event) {
  const button = event.target.closest('[data-copy-code]');
  if (!button) return;
  const code = document.getElementById(button.dataset.copyCode);
  if (!code) return;
  try {
    await copyCodeText(code.textContent);
    button.textContent = 'Скопировано';
  } catch {
    button.textContent = 'Выделите код для копирования';
  }
  setTimeout(() => {button.textContent = 'Копировать';}, 2000);
}

if (typeof module !== 'undefined') module.exports = {copyCodeText, handleCodeCopy};
