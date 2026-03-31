const iconPaths = {
  bar: `
    <path d="M4 19.5h16" />
    <rect x="5.5" y="10.5" width="3" height="9" rx="1" />
    <rect x="10.5" y="6.5" width="3" height="13" rx="1" />
    <rect x="15.5" y="3.5" width="3" height="16" rx="1" />
  `,
  kids: `
    <path d="M8 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
    <path d="M16.5 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
    <path d="M3.5 19c.7-2.6 3-4 5.8-4s5.2 1.4 5.8 4" />
    <path d="M14 19c.4-1.7 1.8-2.8 3.8-2.8 1.4 0 2.6.5 3.2 1.5" />
  `,
  calendar: `
    <rect x="3.5" y="5.5" width="17" height="15" rx="3" />
    <path d="M7 3.5v4M17 3.5v4M3.5 9.5h17" />
    <path d="M8 13h2M13 13h2M8 17h2M13 17h2" />
  `,
  food: `
    <path d="M5 4.5v6a2.5 2.5 0 0 0 5 0v-6" />
    <path d="M7.5 4.5v7" />
    <path d="M15 4.5v15" />
    <path d="M15 11h2a2 2 0 0 0 2-2V4.5" />
  `,
  grid: `
    <rect x="4" y="4" width="6" height="6" rx="1.2" />
    <rect x="14" y="4" width="6" height="6" rx="1.2" />
    <rect x="4" y="14" width="6" height="6" rx="1.2" />
    <rect x="14" y="14" width="6" height="6" rx="1.2" />
  `,
  bell: `
    <path d="M7 10a5 5 0 1 1 10 0v4l1.5 2.5H5.5L7 14v-4Z" />
    <path d="M10 18.5a2 2 0 0 0 4 0" />
  `,
  pdf: `
    <path d="M7 3.5h7l4 4v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-15a2 2 0 0 1 2-2Z" />
    <path d="M14 3.5v5h5" />
    <path d="M8.5 17.5h7" />
    <path d="M8.5 13.5h5" />
  `,
  settings: `
    <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
    <path d="M19 12a7 7 0 0 0-.1-1.1l2-1.5-2-3.4-2.3.8a7.9 7.9 0 0 0-1.9-1.1L14.3 3h-4.6l-.4 2.7c-.7.2-1.3.6-1.9 1.1l-2.3-.8-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .7.1 1.1l-2 1.5 2 3.4 2.3-.8c.6.5 1.2.9 1.9 1.1l.4 2.7h4.6l.4-2.7c.7-.2 1.3-.6 1.9-1.1l2.3.8 2-3.4-2-1.5c.1-.4.1-.7.1-1.1Z" />
  `,
  plus: `
    <path d="M12 5v14M5 12h14" />
  `,
  edit: `
    <path d="m4.5 16.5 1-4L14.8 3.2a1.9 1.9 0 0 1 2.7 0l1.3 1.3a1.9 1.9 0 0 1 0 2.7l-9.3 9.3-4 1Z" />
    <path d="M13 5l4 4" />
  `,
  trash: `
    <path d="M4.5 6.5h15" />
    <path d="M8 6.5V5a1.5 1.5 0 0 1 1.5-1.5h5A1.5 1.5 0 0 1 16 5v1.5" />
    <path d="M7 6.5 8 19a1.5 1.5 0 0 0 1.5 1.4h5A1.5 1.5 0 0 0 16 19l1-12.5" />
    <path d="M10 10.5v6M14 10.5v6" />
  `,
  book: `
    <path d="M6 4.5h10a2 2 0 0 1 2 2v12H8a2 2 0 0 0-2 2V4.5Z" />
    <path d="M18 18.5H8a2 2 0 0 0-2 2" />
  `,
  ball: `
    <circle cx="12" cy="12" r="7.5" />
    <path d="M7 7c2.3 1 3.7 3 5 5 1 1.6 2.3 3 5 4" />
    <path d="M16.5 5.5c-.3 2.5-1.4 4.6-3.1 6.3S9.5 15 7 15.5" />
  `,
  wave: `
    <path d="M3.5 14c1.2-1.4 2.5-2.1 4-2.1 2.5 0 2.8 2.7 5.2 2.7 1.4 0 2.4-.6 3.5-1.8 1.3-1.4 2.5-2.1 4.3-2.1" />
    <path d="M3.5 18c1.2-1.4 2.5-2.1 4-2.1 2.5 0 2.8 2.7 5.2 2.7 1.4 0 2.4-.6 3.5-1.8 1.3-1.4 2.5-2.1 4.3-2.1" />
  `,
  spark: `
    <path d="M12 3.5 13.9 8l4.6 1.1-3.4 3 1 4.9L12 14.9 7.9 17l1-4.9-3.4-3L10.1 8 12 3.5Z" />
  `,
  code: `
    <path d="m9 8-4 4 4 4" />
    <path d="m15 8 4 4-4 4" />
    <path d="m13 6-2 12" />
  `,
  court: `
    <rect x="4.5" y="4.5" width="15" height="15" rx="2.5" />
    <path d="M12 4.5v15M4.5 12h15" />
    <circle cx="12" cy="12" r="2.5" />
  `,
  chevron: `
    <path d="m8 10 4 4 4-4" />
  `,
  close: `
    <path d="M6 6 18 18M18 6 6 18" />
  `
};

export function icon(name, className = '') {
  const path = iconPaths[name] || iconPaths.grid;
  return `
    <svg class="icon ${className}" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      ${path}
    </svg>
  `;
}

export function availableActivityIcons() {
  return ['court', 'book', 'ball', 'spark', 'wave', 'code', 'bar'];
}
