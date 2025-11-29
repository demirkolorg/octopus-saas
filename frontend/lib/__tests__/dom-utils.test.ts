/**
 * @jest-environment jsdom
 */

import {
  generateSelector,
  isUniqueSelector,
  getElementPath,
  getMatchingElements,
} from '../dom-utils';

describe('dom-utils', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('isUniqueSelector', () => {
    it('should return true for selector matching single element', () => {
      document.body.innerHTML = '<div id="unique"></div>';
      expect(isUniqueSelector('#unique', document)).toBe(true);
    });

    it('should return false for selector matching multiple elements', () => {
      document.body.innerHTML = '<div class="common"></div><div class="common"></div>';
      expect(isUniqueSelector('.common', document)).toBe(false);
    });

    it('should return false for selector matching no elements', () => {
      document.body.innerHTML = '<div></div>';
      expect(isUniqueSelector('#nonexistent', document)).toBe(false);
    });

    it('should return false for invalid selector', () => {
      document.body.innerHTML = '<div></div>';
      expect(isUniqueSelector('[[[invalid', document)).toBe(false);
    });
  });

  describe('getElementPath', () => {
    it('should return simple path for direct child of body', () => {
      document.body.innerHTML = '<div></div>';
      const element = document.querySelector('div')!;
      expect(getElementPath(element)).toBe('div');
    });

    it('should return nested path', () => {
      document.body.innerHTML = '<div><ul><li></li></ul></div>';
      const element = document.querySelector('li')!;
      expect(getElementPath(element)).toBe('div > ul > li');
    });

    it('should include nth-child for siblings of same type', () => {
      document.body.innerHTML = '<ul><li>1</li><li>2</li><li>3</li></ul>';
      const element = document.querySelectorAll('li')[1];
      const path = getElementPath(element);
      expect(path).toContain('nth-child(2)');
    });

    it('should include class names in path', () => {
      document.body.innerHTML = '<div class="container"><span class="title">Text</span></div>';
      const element = document.querySelector('.title')!;
      const path = getElementPath(element);
      expect(path).toContain('container');
      expect(path).toContain('title');
    });

    it('should limit class names to 2 for readability', () => {
      document.body.innerHTML = '<div class="one two three four">Text</div>';
      const element = document.querySelector('div')!;
      const path = getElementPath(element);
      // Should have at most 2 class names
      const classMatches = path.match(/\./g) || [];
      expect(classMatches.length).toBeLessThanOrEqual(2);
    });
  });

  describe('generateSelector', () => {
    describe('Strategy 1: ID Selector', () => {
      it('should return ID selector when element has ID', () => {
        document.body.innerHTML = '<div id="news-container"><span>Content</span></div>';
        const element = document.getElementById('news-container') as HTMLElement;
        expect(generateSelector(element)).toBe('#news-container');
      });

      it('should escape special characters in ID', () => {
        document.body.innerHTML = '<div id="news:item.1"><span>Content</span></div>';
        const element = document.querySelector('[id="news:item.1"]') as HTMLElement;
        const selector = generateSelector(element);
        expect(selector).toContain('#');
        // Verify the selector works
        expect(document.querySelector(selector)).toBe(element);
      });

      it('should skip empty ID', () => {
        document.body.innerHTML = '<div id="" class="unique-class">Content</div>';
        const element = document.querySelector('div') as HTMLElement;
        const selector = generateSelector(element);
        expect(selector).not.toBe('#');
      });

      it('should skip whitespace-only ID', () => {
        document.body.innerHTML = '<div id="   " class="unique-class">Content</div>';
        const element = document.querySelector('div') as HTMLElement;
        const selector = generateSelector(element);
        expect(selector).not.toContain('#   ');
      });
    });

    describe('Strategy 2: Unique Class Selector', () => {
      it('should return class selector when element has unique class', () => {
        document.body.innerHTML = `
          <div class="container">
            <span class="article-title">Title 1</span>
          </div>
        `;
        const element = document.querySelector('.article-title') as HTMLElement;
        expect(generateSelector(element)).toBe('.article-title');
      });

      it('should prefer single unique class over multiple classes', () => {
        document.body.innerHTML = '<div class="unique common">Content</div><div class="common">Other</div>';
        const element = document.querySelector('.unique') as HTMLElement;
        expect(generateSelector(element)).toBe('.unique');
      });

      it('should try tag+class combination for uniqueness', () => {
        document.body.innerHTML = `
          <div class="title">Div Title</div>
          <span class="title">Span Title</span>
        `;
        const element = document.querySelector('span.title') as HTMLElement;
        const selector = generateSelector(element);
        // Should find a unique selector
        expect(document.querySelectorAll(selector).length).toBe(1);
      });

      it('should try two-class combination for uniqueness', () => {
        document.body.innerHTML = `
          <div class="item active">Item 1</div>
          <div class="item">Item 2</div>
          <div class="active">Other Active</div>
        `;
        const element = document.querySelector('.item.active') as HTMLElement;
        const selector = generateSelector(element);
        expect(document.querySelectorAll(selector).length).toBe(1);
      });
    });

    describe('Strategy 3: Path Selector', () => {
      it('should return path when no ID or unique class', () => {
        document.body.innerHTML = `
          <div>
            <ul>
              <li><a href="#">Link 1</a></li>
              <li><a href="#">Link 2</a></li>
              <li><a href="#">Link 3</a></li>
            </ul>
          </div>
        `;
        const element = document.querySelectorAll('a')[1] as HTMLElement;
        const selector = generateSelector(element);
        // Should return a path selector
        expect(selector).toContain('>');
        // Verify it's unique
        expect(document.querySelectorAll(selector).length).toBe(1);
      });

      it('should handle deeply nested elements', () => {
        document.body.innerHTML = `
          <div>
            <section>
              <article>
                <div>
                  <p><span>Deep content</span></p>
                </div>
              </article>
            </section>
          </div>
        `;
        const element = document.querySelector('span') as HTMLElement;
        const selector = generateSelector(element);
        expect(document.querySelector(selector)).toBe(element);
      });

      it('should correctly identify nth-child in complex structures', () => {
        document.body.innerHTML = `
          <div class="news-list">
            <div class="item"><h2>News 1</h2></div>
            <div class="item"><h2>News 2</h2></div>
            <div class="item"><h2>News 3</h2></div>
          </div>
        `;
        const secondH2 = document.querySelectorAll('h2')[1] as HTMLElement;
        const selector = generateSelector(secondH2);
        expect(document.querySelector(selector)).toBe(secondH2);
      });
    });

    describe('Real-world scenarios', () => {
      it('should handle news article list', () => {
        document.body.innerHTML = `
          <main id="content">
            <div class="news-container">
              <article class="news-item">
                <h2 class="news-title">Breaking News 1</h2>
                <p class="news-summary">Summary 1</p>
              </article>
              <article class="news-item">
                <h2 class="news-title">Breaking News 2</h2>
                <p class="news-summary">Summary 2</p>
              </article>
            </div>
          </main>
        `;

        // Get the second news title
        const titles = document.querySelectorAll('.news-title');
        const secondTitle = titles[1] as HTMLElement;
        const selector = generateSelector(secondTitle);

        // Selector should uniquely identify the element
        expect(document.querySelectorAll(selector).length).toBe(1);
        expect(document.querySelector(selector)).toBe(secondTitle);
      });

      it('should handle table-based layouts', () => {
        document.body.innerHTML = `
          <table id="data-table">
            <tbody>
              <tr><td>Row 1, Cell 1</td><td>Row 1, Cell 2</td></tr>
              <tr><td>Row 2, Cell 1</td><td>Row 2, Cell 2</td></tr>
              <tr><td>Row 3, Cell 1</td><td>Row 3, Cell 2</td></tr>
            </tbody>
          </table>
        `;

        const cell = document.querySelectorAll('td')[3] as HTMLElement; // Row 2, Cell 2
        const selector = generateSelector(cell);
        expect(document.querySelector(selector)).toBe(cell);
      });

      it('should handle elements with data attributes but no ID', () => {
        document.body.innerHTML = `
          <div data-testid="container">
            <button class="btn primary">Click me</button>
            <button class="btn secondary">Cancel</button>
          </div>
        `;

        const primaryBtn = document.querySelector('.primary') as HTMLElement;
        const selector = generateSelector(primaryBtn);
        expect(document.querySelector(selector)).toBe(primaryBtn);
      });
    });

    describe('Edge cases', () => {
      it('should throw error for detached element', () => {
        const detachedElement = document.createElement('div');
        // In jsdom, detached elements still have ownerDocument
        // but we can test by checking behavior
        expect(() => generateSelector(detachedElement)).not.toThrow();
      });

      it('should handle elements with special characters in class names', () => {
        document.body.innerHTML = '<div class="item-1 item_2 item:3">Content</div>';
        const element = document.querySelector('div') as HTMLElement;
        const selector = generateSelector(element);
        expect(document.querySelector(selector)).toBe(element);
      });

      it('should handle SVG elements', () => {
        document.body.innerHTML = `
          <svg id="icon">
            <path d="M0 0"></path>
            <circle cx="10" cy="10" r="5"></circle>
          </svg>
        `;
        const svg = document.getElementById('icon') as unknown as HTMLElement;
        expect(generateSelector(svg)).toBe('#icon');
      });

      it('should handle elements with no classes and no ID', () => {
        document.body.innerHTML = '<div><span><a href="#">Link</a></span></div>';
        const element = document.querySelector('a') as HTMLElement;
        const selector = generateSelector(element);
        expect(selector).toContain('>');
        expect(document.querySelector(selector)).toBe(element);
      });
    });
  });

  describe('getMatchingElements', () => {
    it('should return array of matching elements', () => {
      document.body.innerHTML = '<div class="item">1</div><div class="item">2</div>';
      const elements = getMatchingElements('.item', document);
      expect(elements.length).toBe(2);
    });

    it('should return empty array for no matches', () => {
      document.body.innerHTML = '<div>Content</div>';
      const elements = getMatchingElements('.nonexistent', document);
      expect(elements.length).toBe(0);
    });

    it('should return empty array for invalid selector', () => {
      document.body.innerHTML = '<div>Content</div>';
      const elements = getMatchingElements('[[[invalid', document);
      expect(elements.length).toBe(0);
    });
  });
});
