const originalValues = new WeakMap();

function updateMoneyVisibility(root = document) {
  const hidden = document.body.classList.contains('values-hidden');
  for (const amount of root.querySelectorAll('.money')) {
    if (hidden && !originalValues.has(amount)) {
      originalValues.set(amount, amount.textContent);
      amount.textContent = 'R$ ••••';
    } else if (!hidden && originalValues.has(amount)) {
      amount.textContent = originalValues.get(amount);
      originalValues.delete(amount);
    }
  }
}

export { updateMoneyVisibility };
