export default class AppHelpers {
  static delayTransition(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static debounceMove(func, timeoutId, delay, numberOfOpenPanels) {
    return function() {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const panelCount = typeof numberOfOpenPanels !== 'undefined' ? numberOfOpenPanels() : 0;
        if (Number.isInteger(panelCount) && panelCount > 0) {
          // When this debounce is used to call the `toggleBottomMargin` function,
          // it needs to know if there are any open panels to make its calculations.
          // Any param integer greater than zero indicates an open panel (0 is default).
          func(panelCount);
        } else {
          func();
        }
      }, delay);
    };
  }

  static formatDate(date) {
    return new Date(date).toLocaleDateString();
  }

  static isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Array of keys for int properties in a given class.
  static listOfKeysWithInts() {
    let intProps = [];
    for (const key in this) {
      if (typeof this[key] === 'number') {
        intProps.push(key);
      }
    }
    return intProps;
  }

  static unescapeHTML(code) {
    return code.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /**
   * Function: injectHtml
   *
   * Injects the content of a `.htmlh` file into a target DOM element.
   * @param {string} filePath - Path to the .htmlh file.
   * @param {Element} targetElement - The DOM element where the content will be injected.
   * @param {Function} callback - A callback function called after the content is injected.
   * @returns {Promise<void>} A promise that resolves once the content is injected.
   * @param {string} thanks - ChatGPT 4o [2024-11-25]
   *
   * Exmple using callback:
   *   AppHelper.injectHtml('./path/to/example.htmlh', placeholder, (target) => {
   *     console.log('Content injected into:', target);
   *     // Add event listeners or modify the injected content
   *     target.querySelector('h2').style.color = 'blue';
   *   });
   */
  static async injectHtml(filePath, targetElement, callback) {
    try {
      const response = await fetch(filePath);

      if (!response.ok) {
        throw new Error(`Failed to load file: ${filePath}, status: ${response.status}`);
      }

      const htmlContent = await response.text();
      targetElement.innerHTML = htmlContent;

      // Call the callback function if provided.
      if (callback) {
        callback(targetElement);
      }
    } catch (error) {
      console.error('Error injecting HTML:', error);
      targetElement.innerHTML = '<p>Failed to load content. Please try again later.</p>';
    }
  }
}
