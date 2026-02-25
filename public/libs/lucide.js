// 1. Define the icons you want to use
const icons = {
  "file-code": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"
                  stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M16 18l6-6-6-6"/>
                  <path d="M8 6l-6 6 6 6"/>
                </svg>`,

  sun: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"
           stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
           <circle cx="12" cy="12" r="5"/>
           <line x1="12" y1="1" x2="12" y2="3"/>
           <line x1="12" y1="21" x2="12" y2="23"/>
           <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
           <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
           <line x1="1" y1="12" x2="3" y2="12"/>
           <line x1="21" y1="12" x2="23" y2="12"/>
           <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
           <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
         </svg>`,

  eye: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"
           stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
           <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
           <circle cx="12" cy="12" r="3"/>
        </svg>`,

  columns: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"
              stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 3h7v18H3z"/>
              <path d="M14 3h7v18h-7z"/>
            </svg>`,

  "file-text": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"
                  stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <line x1="10" y1="9" x2="8" y2="9"/>
                </svg>`,

  "at-sign": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"
           stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
           <circle cx="12" cy="12" r="4"/>
           <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/>
        </svg>`,

  "lock-keyhole": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"
            stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="16" r="1"/>
            <rect x="3" y="10" width="18" height="12" rx="2"/>
            <path d="M7 10V7a5 5 0 0 1 10 0v3"/>
         </svg>`,

  "user-round": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"
        stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="8" r="5"/>
        <path d="M20 21a8 8 0 1 0-16 0"/>
      </svg>`,

  "check-check": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
  width="24" height="24" stroke="currentColor" fill="none"
  stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M18 6L7 17l-5-5"/>
  <path d="M22 6l-8.5 8.5"/>
</svg>`

};

// 2. Helper function to convert SVG string to DOM element
function createElement(svgString) {
  const template = document.createElement('template');
  template.innerHTML = svgString.trim();
  return template.content.firstChild;
}

// 3. Replace all <i data-lucide="icon-name"> with actual SVGs
function replaceLucideIcons() {
  const elements = document.querySelectorAll('i[data-lucide]');
  elements.forEach(el => {
    const name = el.getAttribute('data-lucide');
    if (icons[name]) {
      const svgEl = createElement(icons[name]);
      el.replaceWith(svgEl);
    }
  });
}

// 4. Run after DOM is loaded
document.addEventListener('DOMContentLoaded', replaceLucideIcons);

// 5. Optional: expose globally
window.lucide = { icons, createElement, replaceLucideIcons };