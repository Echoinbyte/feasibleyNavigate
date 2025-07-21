# Feasibley Use the Web
A highly performant, beautiful, and dynamic heading navigation menu with virtualization for seamless browsing.

[Greasy Fork](https://greasyfork.org/en/scripts/540246-feasibly-use-the-web)

## Overview
Feasibley Use the Web is a lightweight, customizable userscript that enhances web navigation by providing a floating, interactive menu of all headings (h1–h6) on a webpage. It uses virtualization for performance, ensuring smooth operation even on pages with numerous headings. The menu is draggable, collapsible, and supports filtering, keyboard navigation, and automatic updates when page content changes.

## Features
- Dynamic Heading Detection: Automatically detects and lists all h1–h6 headings on the page, assigning unique IDs if none exist.
- Virtualized Rendering: Efficiently renders only visible menu items, optimized for pages with many headings.
- Collapsible Interface: Toggle between expanded and collapsed states with a single click or keyboard shortcut (Alt+T).
- Drag-and-Drop Positioning: Move the menu anywhere on the screen, with position saved across sessions.
- Filterable Headings: Search headings using a text input (Alt+N to focus).
- Keyboard Navigation: Navigate headings with arrow keys, Home, End, PageUp, PageDown, and select with Enter or Space (Alt+H to focus the list).
- Active Heading Highlighting: Highlights the current heading based on scroll position and provides visual feedback when navigating.
- Responsive Design: Adapts to page changes via MutationObserver, updating the menu when headings are added or removed.
- Customizable Styling: Modern, semi-transparent design with a customizable color scheme.
- Persistent State: Saves collapse state and menu position using localStorage.
- Accessibility: Includes ARIA attributes and keyboard-friendly navigation for improved usability.
  
## Installation
1. Install a userscript manager like Tampermonkey or Greasemonkey.
2. Copy the provided userscript code into a new script in your userscript manager.
3. Save and enable the script. It will automatically run on all webpages (*://*/*).

## Usage
### Opening and Navigating
- The navigation menu appears as a floating panel in the top-right corner of the webpage.
- Toggle Menu: Click the −/＋ button or press Alt+T to collapse/expand the menu.
- Filter Headings: Click the search input or press Alt+N to focus it, then type to filter headings.
- Navigate Headings: Press Alt+H to focus the headings list, then use:
    - Arrow Up/Down: Move between headings.
    - Home/End: Jump to the first/last heading.
    - PageUp/PageDown: Move 5 headings up or down.
    - Enter/Space: Navigate to the selected heading with smooth scrolling and a brief highlight.
    - Escape: Return focus to the navigation panel or clear the filter.
    - Click Navigation: Click any heading in the menu to jump to it with a visual highlight.
      
### Dragging the Menu
- Click and drag the header (🧭 Feasibley Navigate) to reposition the menu.
- The position is saved and persists across page reloads.
  
### Automatic Updates
- The menu updates automatically when the page content changes (e.g., dynamic content loading).
- It tracks URL changes (e.g., hash navigation or history state changes) to refresh the heading list as needed.
  
## Configuration
- The script includes a CONFIG object for customization:

```js
const CONFIG = {
  debounceDelay: 750, // Delay for debouncing page updates (ms)
  virtualization: {
    itemHeight: 38, // Height of each menu item (px)
    buffer: 8, // Number of extra items rendered above/below the visible area
  },
  colors: {
    menuBackground: "rgba(30, 41, 59, 0.85)", // Menu background color
    menuBorder: "#475569", // Border color
    menuText: "#e2e8f0", // Primary text color
    menuTextSecondary: "#94a3b8", // Secondary text color
    menuHover: "rgba(51, 65, 85, 0.9)", // Hover background
    menuActive: "#1e293b", // Active heading background
    focusOutline: "#60a5fa", // Focus outline color
    shadow: "rgba(0, 0, 0, 0.3)", // Shadow color
    accent: "#60a5fa", // Highlight color
    scrollbar: "#475569", // Scrollbar color
    scrollbarHover: "#64748b", // Scrollbar hover color
  },
};
```

Modify these values in the script to adjust the menu's appearance or behavior.

## Technical Details

- Performance: Uses virtualization to render only visible headings, reducing DOM overhead on pages with many headings.
- MutationObserver: Monitors the DOM for changes to headings, ensuring the menu stays up-to-date.
- IntersectionObserver: Tracks visible headings to highlight the active one based on scroll position.
- Debouncing: Limits update frequency to prevent performance issues during rapid DOM changes.
- Accessibility: Implements ARIA roles (navigation, menu, menuitem) and keyboard navigation for inclusivity.
- Storage: Uses localStorage to persist menu position and collapse state.
- Compatibility: Works on all webpages (*://*/*) with no external dependencies.
- 
## Limitations and TODOs

- Custom Selectors: Future versions may support custom heading selectors beyond h1–h6.
- Nested Numbering: Plans to add support for more complex heading numbering schemes.
- Custom Shortcuts: Additional keyboard shortcuts may be configurable in future updates.
- Edge Cases: May not handle dynamically generated IDs perfectly if pages use conflicting ID schemes.
  
## Troubleshooting
- Menu Not Appearing: Ensure the page has h1–h6 headings. If none exist, the menu will be empty.
- Position Reset: If the menu's position is off-screen, clear localStorage for feasible-nav-position or reload the page.
- Performance Issues: On very dynamic pages, increase debounceDelay in the CONFIG object to reduce updates.
- Conflicts: Disable other userscripts to check for interference with DOM manipulation or event listeners.
  
## Contributing

Contributions are welcome! Visit the GitHub repository to report issues, suggest features, or submit pull requests.

## License
This userscript is released under the MIT License. See the GitHub repository for details.

Enjoy seamless web navigation with Feasibley Use the Web! For support, contact the author via GitHub.
