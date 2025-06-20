// ==UserScript==
// @name         Feasibly Use the Web
// @namespace    http://github.com/Echoinbyte/
// @version      2.0
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
      UIManager.init(this);
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
        UIManager.render(this.filteredHeadings);
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
            UIManager.updateActiveLink(topMostEntry.target.id);
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
      UIManager.render(this.filteredHeadings);
    },
  };

  // --- UI Manager: Manages all DOM elements and basic rendering ---
  const UIManager = {
    core: null,
    elements: {},
    isCollapsed: false,

    init(coreInstance) {
      this.core = coreInstance;
      this.isCollapsed =
        localStorage.getItem("feasible-nav-collapsed") === "true";
      this.createStyles();
      this.createContainer();
    },

    render(headings) {
      // Basic rendering - updates the list with current headings
      this.updateList(headings);
    },

    getStyleSheet(colors) {
      return `
        #feasible-heading-nav {
          position: fixed !important; top: 20px; right: 20px; width: 320px; max-height: 85vh;
          background: ${colors.menuBackground}; border: 1px solid ${colors.menuBorder};
          border-radius: 12px; box-shadow: 0 8px 32px ${colors.shadow};
          z-index: 999999 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          overflow: hidden; transition: width 0.3s ease, min-width 0.3s ease; backdrop-filter: blur(10px);
          user-select: none; pointer-events: auto !important; display: flex; flex-direction: column;
          color: ${colors.menuText};
        }
        .feasible-header {
          padding: 12px 16px; border-bottom: 1px solid ${colors.menuBorder}; display: flex;
          justify-content: space-between; align-items: center; cursor: grab; flex-shrink: 0;
        }
        .feasible-title-container { display: flex; align-items: center; gap: 8px; overflow: hidden; }
        .feasible-title-icon { font-size: 20px; user-select: none; }
        .feasible-title { margin: 0; font-size: 16px; font-weight: 600; color: ${colors.menuText}; white-space: nowrap; }
        .feasible-header button {
          color: ${colors.menuTextSecondary}; background: transparent; border: none; font-size: 24px;
          cursor: pointer; padding: 0 4px; display: flex; align-items: center; justify-content: center;
          width: 32px; height: 32px; line-height: 1;
        }
        .feasible-filter-input {
          width: calc(100% - 32px); padding: 8px 12px; margin: 8px 16px; border-radius: 6px; 
          border: 1px solid ${colors.menuBorder}; background-color: ${colors.menuBackground}; 
          color: ${colors.menuText}; font-size: 13px; transition: border-color 0.2s ease;
          box-sizing: border-box; flex-shrink: 0;
        }
        .feasible-filter-input:focus { border-color: ${colors.accent}; outline: none; }
        .feasible-content { flex-grow: 1; overflow-y: auto; scroll-behavior: smooth; }
        .feasible-content::-webkit-scrollbar { width: 8px; }
        .feasible-content::-webkit-scrollbar-track { background: transparent; }
        .feasible-content::-webkit-scrollbar-thumb { background: ${colors.scrollbar}; border-radius: 4px; }
        .feasible-content::-webkit-scrollbar-thumb:hover { background: ${colors.scrollbarHover}; }
        .feasible-list { list-style: none; margin: 0; padding: 0; }
        .feasible-list-item {
          display: flex; align-items: center; padding: 8px 16px;
          color: ${colors.menuText}; text-decoration: none;
          transition: background-color 0.2s ease; cursor: pointer;
        }
        .feasible-list-item.active { background-color: ${colors.menuActive}; font-weight: 600; }
        .feasible-list-item:hover { background-color: ${colors.menuHover}; }
        .item-number {
          font-size: 11px; font-weight: bold; text-align: center; line-height: 18px;
          border-radius: 4px; margin-right: 10px; color: white; padding: 0 6px;
        }
        .item-text { flex: 1; min-width: 0; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; font-size: 13px; }
      `;
    },

    createStyles() {
      this.elements.style = document.createElement("style");
      this.elements.style.textContent = this.getStyleSheet(CONFIG.colors);
      document.head.appendChild(this.elements.style);
    },

    createContainer() {
      const nav = document.createElement("nav");
      nav.id = "feasible-heading-nav";
      nav.setAttribute("role", "navigation");
      nav.setAttribute("aria-label", "Page headings navigation");
      this.elements.nav = nav;

      const header = this.createHeader();
      const filter = this.createFilterInput();
      const content = this.createContentArea();

      nav.appendChild(header);
      nav.appendChild(filter);
      nav.appendChild(content);
      document.body.appendChild(nav);

      this.setupBasicEventListeners();
      this.applyCollapseState();
    },

    createHeader() {
      const header = document.createElement("div");
      header.className = "feasible-header";
      this.elements.header = header;

      const titleContainer = document.createElement("div");
      titleContainer.className = "feasible-title-container";
      titleContainer.innerHTML = `<span class="feasible-title-icon">🧭</span><h2 class="feasible-title">Feasibley Navigate</h2>`;
      this.elements.titleContainer = titleContainer;

      const toggleBtn = document.createElement("button");
      toggleBtn.setAttribute("aria-label", "Collapse navigation");
      toggleBtn.innerHTML = "−";
      this.elements.toggleBtn = toggleBtn;

      header.appendChild(titleContainer);
      header.appendChild(toggleBtn);
      return header;
    },

    createFilterInput() {
      const filterInput = document.createElement("input");
      filterInput.type = "text";
      filterInput.placeholder = "Navigate to...";
      filterInput.className = "feasible-filter-input";
      filterInput.setAttribute("aria-label", "Filter headings");
      this.elements.filterInput = filterInput;
      return filterInput;
    },

    createContentArea() {
      const content = document.createElement("div");
      content.className = "feasible-content";
      this.elements.content = content;

      const list = document.createElement("ul");
      list.className = "feasible-list";
      list.setAttribute("role", "menu");
      this.elements.list = list;

      content.appendChild(list);
      return content;
    },

    updateList(headings) {
      const list = this.elements.list;
      list.innerHTML = "";

      headings.forEach((heading) => {
        const li = this.createListItem(heading);
        list.appendChild(li);
      });
    },

    createListItem(heading) {
      const li = document.createElement("li");
      li.className = "feasible-list-item";
      li.dataset.id = heading.id;
      li.setAttribute("role", "menuitem");

      const level = heading.level;
      const indent = (level - 1) * 15;
      li.style.paddingLeft = `${16 + indent}px`;

      const colors = [
        "#3182ce",
        "#38a169",
        "#d69e2e",
        "#e53e3e",
        "#805ad5",
        "#dd6b20",
      ];
      const color = colors[level - 1] || colors[5];

      li.innerHTML = `
        <span class="item-number" style="background-color: ${color};">${heading.number}</span>
        <span class="item-text">${heading.text}</span>
      `;

      return li;
    },

    setupBasicEventListeners() {
      // Toggle collapse functionality
      this.elements.toggleBtn.addEventListener("click", () => {
        this.isCollapsed = !this.isCollapsed;
        localStorage.setItem("feasible-nav-collapsed", this.isCollapsed);
        this.applyCollapseState();
      });

      // Filter functionality
      this.elements.filterInput.addEventListener("input", (e) => {
        this.core.filterHeadings(e.target.value);
      });

      // Basic click navigation
      this.elements.list.addEventListener("click", (e) => {
        const item = e.target.closest(".feasible-list-item");
        if (!item) return;

        const targetId = item.dataset.id;
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          this.updateActiveLink(targetId);
          targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    },

    applyCollapseState() {
      const { nav, titleContainer, content, toggleBtn, filterInput } =
        this.elements;

      if (this.isCollapsed) {
        titleContainer.style.display = "none";
        content.style.display = "none";
        filterInput.style.display = "none";
        toggleBtn.innerHTML = "＋";
        nav.style.width = "auto";
        nav.style.minWidth = "48px";
      } else {
        titleContainer.style.display = "flex";
        content.style.display = "block";
        filterInput.style.display = "block";
        toggleBtn.innerHTML = "−";
        nav.style.width = "320px";
      }
    },

    updateActiveLink(id) {
      this.elements.list
        .querySelectorAll(".feasible-list-item")
        .forEach((item) => {
          item.classList.toggle("active", item.dataset.id === id);
        });
    },
  };

  CoreLogic.init();
})();
