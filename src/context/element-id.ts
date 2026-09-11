let counter = 0;

function generateElementId(element: HTMLElement) {
  if (element.id) return `#${element.id}`;
  counter += 1;
  return `${element.tagName.toLowerCase()} ${counter}`;
}

export function getElementId(element: Element) {
  const htmlElement = element as HTMLElement;
  let motionId = htmlElement.dataset.motionId;
  if (!motionId) {
    htmlElement.dataset.motionId = motionId = generateElementId(htmlElement);
  }
  return motionId;
}
