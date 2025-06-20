// ==UserScript==
// @name         Feasibly Use the Web
// @namespace    http://github.com/Echoinbyte/
// @version      1.1
// @description  A highly performant, beautiful, and dynamic heading navigation menu with virtualization.
// @author       Echoinbyte
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // --- Configuration ---
  const CONFIG = {
    debounceDelay: 750,
    virtualization: {
      itemHeight: 38,
      buffer: 8,
    },
    colors: {
      menuBackground: "rgba(30, 41, 59, 0.85)",
      menuBorder: "#475569",
      menuText: "#e2e8f0",
      menuTextSecondary: "#94a3b8",
      menuHover: "rgba(51, 65, 85, 0.9)",
      menuActive: "#1e293b",
      focusOutline: "#60a5fa",
      shadow: "rgba(0, 0, 0, 0.3)",
      accent: "#60a5fa",
      scrollbar: "#475569",
      scrollbarHover: "#64748b",
    },
  };

  // --- Core Logic: Manages state, data, and page observation ---
  const CoreLogic = {
    headings: [],
    filteredHeadings: [],
    mutationObserver: null,
    scrollObserver: null,
    updateTimeout: null,
    currentUrl: window.location.href,

    init() {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => this.run());
      } else {
        this.run();
      }
    },

    run() {
      this.discoverAndUpdateHeadings();
    },

    discoverAndUpdateHeadings(force = false) {
      const newHeadings = this.collectHeadings();
      const hasChanged =
        force ||
        this.headings.length !== newHeadings.length ||
        JSON.stringify(this.headings.map((h) => h.id)) !==
          JSON.stringify(newHeadings.map((h) => h.id));

      if (hasChanged) {
        this.headings = newHeadings;
        this.filteredHeadings = newHeadings;
        console.log("Headings discovered:", this.headings.length);
      }
    },

    collectHeadings() {
      const headingNodes = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
      const headings = [];
      const counters = [0, 0, 0, 0, 0, 0];

      headingNodes.forEach((node, index) => {
        if (!node.textContent.trim() || node.closest("#feasible-heading-nav")) {
          return;
        }

        // TODO: Add support for custom heading selectors
        if (
          !node.id ||
          document.querySelector(
            `[id="${node.id}"]:not([data-heading-processed])`
          ) !== node
        ) {
          const baseId =
            "feasible-h-" +
            (node.textContent
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9\s]/g, "")
              .replace(/\s+/g, "-")
              .substring(0, 50) || index);

          let finalId = baseId;
          let counter = 2;
          while (
            document.getElementById(finalId) &&
            document.getElementById(finalId) !== node
          ) {
            finalId = `${baseId}-${counter++}`;
          }
          node.id = finalId;
        }

        node.setAttribute("data-heading-processed", "true");

        const level = parseInt(node.tagName.substring(1));

        // TODO: Add support for nested numbering schemes
        for (let i = 0; i < level - 1; i++) {
          if (counters[i] === 0) {
            counters[i] = 1;
          }
        }

        counters[level - 1]++;

        for (let i = level; i < 6; i++) {
          counters[i] = 0;
        }

        const numberLabel = counters
          .slice(0, level)
          .filter((c) => c > 0)
          .join(".");

        headings.push({
          id: node.id,
          text: node.textContent.trim(),
          level: level,
          number: numberLabel,
          element: node,
        });
      });
      return headings;
    },

    filterHeadings(query) {
      const lowerQuery = query.toLowerCase();
      this.filteredHeadings = this.headings.filter((h) =>
        h.text.toLowerCase().includes(lowerQuery)
      );
      console.log("Filtered headings:", this.filteredHeadings.length);
    },
  };

  CoreLogic.init();
})();
