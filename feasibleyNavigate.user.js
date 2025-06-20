// ==UserScript==
// @name         Feasibly Use the Web
// @namespace    http://github.com/Echoinbyte/
// @version      1.2
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
      this.setupObservers();
      this.setupEventListeners();
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
        this.observeVisibleHeadings();
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

    setupObservers() {
      this.mutationObserver = new MutationObserver(() => this.scheduleUpdate());
      this.mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    },

    observeVisibleHeadings() {
      if (this.scrollObserver) this.scrollObserver.disconnect();
      if (this.headings.length === 0) return;

      this.scrollObserver = new IntersectionObserver(
        (entries) => {
          // Find the most relevant heading to highlight
          let topMostEntry = null;
          let topMostPosition = Infinity;

          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const rect = entry.boundingClientRect;
              // Prioritize headings that are closer to the top of the viewport
              if (rect.top < topMostPosition && rect.top >= 0) {
                topMostPosition = rect.top;
                topMostEntry = entry;
              }
            }
          });

          // Only update the active link if we found a valid entry
          if (topMostEntry) {
            console.log("Active heading:", topMostEntry.target.id);
          }
        },
        { rootMargin: "0px 0px -80% 0px", threshold: 0.1 }
      );

      this.headings.forEach((h) => this.scrollObserver.observe(h.element));
    },

    scheduleUpdate() {
      clearTimeout(this.updateTimeout);
      this.updateTimeout = setTimeout(() => {
        if (window.location.href !== this.currentUrl) {
          this.currentUrl = window.location.href;
          this.discoverAndUpdateHeadings(true); // Force update on URL change
        } else {
          this.discoverAndUpdateHeadings();
        }
      }, CONFIG.debounceDelay);
    },

    setupEventListeners() {
      const schedule = () => this.scheduleUpdate();
      window.addEventListener("popstate", schedule);
      window.addEventListener("hashchange", schedule);

      // TODO: Add support for custom keyboard shortcuts
      document.addEventListener("keydown", (e) => {
        if (e.altKey && e.key.toLowerCase() === "h") {
          e.preventDefault();
          console.log("Alt+H pressed - should focus navigation");
        }

        if (e.altKey && e.key.toLowerCase() === "n") {
          e.preventDefault();
          console.log("Alt+N pressed - should focus filter");
        }

        if (e.altKey && e.key.toLowerCase() === "t") {
          e.preventDefault();
          console.log("Alt+T pressed - should toggle navigation");
        }
      });

      const originalPushState = history.pushState;
      history.pushState = function (...args) {
        originalPushState.apply(history, args);
        schedule();
      };
      const originalReplaceState = history.replaceState;
      history.replaceState = function (...args) {
        originalReplaceState.apply(history, args);
        schedule();
      };
    },

    filterHeadings(query) {
      const lowerQuery = query.toLowerCase();
      this.filteredHeadings = this.headings.filter((h) =>
        h.text.toLowerCase().includes(lowerQuery)
      );
    },
  };

  CoreLogic.init();
})();
