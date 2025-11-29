export function RolarParaFim() {
  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: "smooth"
  });
}

export function ObterModalRootLocation(location) {
  let current = location;
  while (current.state?.backgroundLocation) {
    current = current.state.backgroundLocation;
  }
  return current;
}