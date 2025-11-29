/**
 * DOM Selector Generator Utility
 *
 * Generates unique CSS selectors for DOM elements using a cascade strategy:
 * 1. ID selector (if element has an ID)
 * 2. Unique class selector (if element has a unique class)
 * 3. Full path selector from body to element
 */

/**
 * CSS.escape polyfill for environments that don't support it (like jsdom)
 * Based on https://drafts.csswg.org/cssom/#serialize-an-identifier
 */
function cssEscape(value: string): string {
  if (typeof CSS !== 'undefined' && CSS.escape) {
    return CSS.escape(value);
  }

  // Polyfill implementation
  const string = String(value);
  const length = string.length;
  let result = '';

  for (let index = 0; index < length; index++) {
    const codeUnit = string.charCodeAt(index);

    // If the character is NULL, replace with U+FFFD
    if (codeUnit === 0x0000) {
      result += '\uFFFD';
      continue;
    }

    if (
      // If the character is in the range [\1-\1F] (U+0001 to U+001F) or is U+007F
      (codeUnit >= 0x0001 && codeUnit <= 0x001f) ||
      codeUnit === 0x007f ||
      // If the character is the first character and is in the range [0-9]
      (index === 0 && codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
      // If the character is the second character and is in the range [0-9]
      // and the first character is a `-`
      (index === 1 &&
        codeUnit >= 0x0030 &&
        codeUnit <= 0x0039 &&
        string.charCodeAt(0) === 0x002d)
    ) {
      // Escape as code point
      result += '\\' + codeUnit.toString(16) + ' ';
      continue;
    }

    // If the character is the first character and is `-` and there's no second character
    if (index === 0 && length === 1 && codeUnit === 0x002d) {
      result += '\\' + string.charAt(index);
      continue;
    }

    // If the character is not handled by one of the above rules
    if (
      codeUnit >= 0x0080 ||
      codeUnit === 0x002d || // -
      codeUnit === 0x005f || // _
      (codeUnit >= 0x0030 && codeUnit <= 0x0039) || // 0-9
      (codeUnit >= 0x0041 && codeUnit <= 0x005a) || // A-Z
      (codeUnit >= 0x0061 && codeUnit <= 0x007a) // a-z
    ) {
      result += string.charAt(index);
      continue;
    }

    // Otherwise, escape the character
    result += '\\' + string.charAt(index);
  }

  return result;
}

/**
 * Check if a selector uniquely identifies a single element in the document
 */
export function isUniqueSelector(selector: string, document: Document): boolean {
  try {
    const matches = document.querySelectorAll(selector);
    return matches.length === 1;
  } catch {
    return false;
  }
}

/**
 * Get the tag name with nth-child position for path building
 */
function getElementPosition(element: Element): string {
  const parent = element.parentElement;
  if (!parent) {
    return element.tagName.toLowerCase();
  }

  const siblings = Array.from(parent.children);
  const sameTagSiblings = siblings.filter(
    (sibling) => sibling.tagName === element.tagName
  );

  // If this is the only element of its type, just use the tag name
  if (sameTagSiblings.length === 1) {
    return element.tagName.toLowerCase();
  }

  // Otherwise, use nth-child
  const index = siblings.indexOf(element) + 1;
  return `${element.tagName.toLowerCase()}:nth-child(${index})`;
}

/**
 * Build the full path from body to the element
 */
export function getElementPath(element: Element): string {
  const path: string[] = [];
  let current: Element | null = element;

  while (current && current.tagName.toLowerCase() !== 'body' && current.tagName.toLowerCase() !== 'html') {
    const tagWithPosition = getElementPosition(current);

    // Add class names if they exist (for better readability)
    const classes = Array.from(current.classList)
      .filter((cls) => !cls.includes(':') && !cls.includes('[') && cls.trim() !== '')
      .slice(0, 2) // Limit to first 2 classes for readability
      .join('.');

    if (classes) {
      path.unshift(`${tagWithPosition}.${classes}`);
    } else {
      path.unshift(tagWithPosition);
    }

    current = current.parentElement;
  }

  return path.join(' > ');
}

/**
 * Try to find a unique class selector for the element
 */
function findUniqueClassSelector(element: Element, document: Document): string | null {
  const classes = Array.from(element.classList);

  if (classes.length === 0) {
    return null;
  }

  // Try each class individually first
  for (const cls of classes) {
    // Skip classes that might be dynamic or utility classes
    if (cls.includes(':') || cls.includes('[') || cls.trim() === '') {
      continue;
    }

    const selector = `.${cls}`;
    if (isUniqueSelector(selector, document)) {
      return selector;
    }
  }

  // Try combining tag with class
  const tagName = element.tagName.toLowerCase();
  for (const cls of classes) {
    if (cls.includes(':') || cls.includes('[') || cls.trim() === '') {
      continue;
    }

    const selector = `${tagName}.${cls}`;
    if (isUniqueSelector(selector, document)) {
      return selector;
    }
  }

  // Try combining two classes
  if (classes.length >= 2) {
    for (let i = 0; i < classes.length; i++) {
      for (let j = i + 1; j < classes.length; j++) {
        const cls1 = classes[i];
        const cls2 = classes[j];

        if (cls1.includes(':') || cls1.includes('[') || cls1.trim() === '') continue;
        if (cls2.includes(':') || cls2.includes('[') || cls2.trim() === '') continue;

        const selector = `.${cls1}.${cls2}`;
        if (isUniqueSelector(selector, document)) {
          return selector;
        }
      }
    }
  }

  return null;
}

/**
 * Generate a unique CSS selector for the given element
 *
 * Strategy (cascade/waterfall):
 * 1. If element has an ID, return ID selector (#element-id)
 * 2. If element has a unique class, return class selector (.unique-class)
 * 3. Otherwise, return full path from body to element
 *
 * @param element - The HTML element to generate a selector for
 * @returns A CSS selector string that uniquely identifies the element
 */
export function generateSelector(element: HTMLElement): string {
  const document = element.ownerDocument;

  if (!document) {
    throw new Error('Element must be attached to a document');
  }

  // Strategy 1: Try ID selector
  if (element.id && element.id.trim() !== '') {
    const idSelector = `#${cssEscape(element.id)}`;
    // Verify the ID is unique (it should be, but validate anyway)
    if (isUniqueSelector(idSelector, document)) {
      return idSelector;
    }
  }

  // Strategy 2: Try unique class selector
  const classSelector = findUniqueClassSelector(element, document);
  if (classSelector) {
    return classSelector;
  }

  // Strategy 3: Build full path
  const pathSelector = getElementPath(element);

  // Verify path selector works
  if (isUniqueSelector(pathSelector, document)) {
    return pathSelector;
  }

  // Fallback: Add more specificity if needed
  // This shouldn't normally happen, but handle it gracefully
  return pathSelector;
}

/**
 * Validate if a selector is valid CSS
 */
export function isValidSelector(selector: string): boolean {
  try {
    document.querySelector(selector);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get all elements matching a selector
 */
export function getMatchingElements(selector: string, doc: Document): Element[] {
  try {
    return Array.from(doc.querySelectorAll(selector));
  } catch {
    return [];
  }
}
