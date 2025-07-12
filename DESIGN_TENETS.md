# Sales RCA Dashboard – Design Tenets

These design principles guide all UI/UX and component decisions for this project. All new features and changes should be reviewed for alignment with these tenets.

---

## 1. Color Palette (Japanese-Inspired)

This palette is inspired by traditional Japanese colors (和色 "washo") for a refined, harmonious, and professional dashboard aesthetic.

### Primary Colors
- **Aizome (藍染)** — Japanese Indigo: `#274a78`
  - For primary actions, highlights, and navigation
- **Shironeri (白練)** — Raw Silk White: `#f8f6f3`
  - Main background, card backgrounds
- **Kurenai (紅)** — Crimson: `#d9333f`
  - For error states, destructive actions
- **Wakaba (若葉)** — Young Leaf Green: `#7ebea5`
  - Success states, positive indicators
- **Toki (鴇色)** — Peach Pink: `#f5b5c3`
  - Alerts, highlights, or accent backgrounds
- **Kikyo (桔梗色)** — Bellflower Violet: `#5654a2`
  - Secondary actions, info states

### Neutral Colors
- **Sumi (墨)** — Charcoal Black: `#2d2d2d`
  - Primary text, headings
- **Ginnezu (銀鼠)** — Silver Gray: `#b0b4b9`
  - Secondary text, icons
- **Usuzumi (薄墨色)** — Light Charcoal: `#a3a3a3`
  - Borders, subtle separators
- **White**: `#ffffff`
  - Contrasting text, highlights

### Status Colors
- **Akane (茜色)** — Madder Red: `#b7282e`
  - Error, warnings
- **Matsuba (松葉色)** — Pine Needle Green: `#395b50`
  - For success, confirmation
- **Asagi (浅葱色)** — Pale Blue: `#33a6b8`
  - Informational backgrounds, badges

### Usage Guidelines
- Use **Aizome** for primary buttons, links, and navigation highlights
- **Shironeri** is the main background for a soft, modern look
- **Kurenai** and **Akane** are reserved for errors and destructive actions only
- **Wakaba** and **Matsuba** are for success, confirmations, and positive states
- **Kikyo** and **Asagi** for secondary actions, info, or badges
- Maintain a minimum contrast ratio of 4.5:1 for text
- Accent colors (**Toki**) should be used sparingly for highlights, alerts, or visual interest
- Neutrals provide balance and structure, ensuring the UI feels calm and uncluttered

#### Rationale
This palette is chosen for its balance, subtlety, and connection to Japanese aesthetics, supporting a calm, focused, and professional interface while remaining accessible and visually distinct.

## 2. Typography

### Font Family
- **Primary Font**: `Inter` (system font stack as fallback)
- **Code/Monospace**: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas`

### Type Scale
- **H1**: `2.25rem` (36px) - Page titles
- **H2**: `1.875rem` (30px) - Section headers
- **H3**: `1.5rem` (24px) - Subsection headers
- **H4**: `1.25rem` (20px) - Card titles
- **Body**: `1rem` (16px) - Default text
- **Small**: `0.875rem` (14px) - Secondary text, captions
- **Extra Small**: `0.75rem` (12px) - Labels, timestamps

### Font Weights
- **Light**: 300
- **Regular**: 400 (default for body text)
- **Medium**: 500 (subheadings)
- **Semibold**: 600 (headings, buttons)
- **Bold**: 700 (important text, emphasis)

### Line Height
- **Headings**: 1.2
- **Body Text**: 1.5
- **Dense UI**: 1.25

### Letter Spacing
- **Headings**: `-0.025em`
- **Uppercase Text**: `0.05em`
- **Body Text**: `0` (normal)

### Text Colors
- **Primary**: `#1f2937` (gray-900)
- **Secondary**: `#4b5563` (gray-600)
- **Tertiary**: `#6b7280` (gray-500)
- **Inverse**: `#ffffff`
- **Interactive**: `#2563eb` (primary blue)

## 3. Spacing & Layout

### Spacing Scale (8px base)
- **xs**: `0.25rem` (4px)
- **sm**: `0.5rem` (8px)
- **md**: `1rem` (16px)
- **lg**: `1.5rem` (24px)
- **xl**: `2rem` (32px)
- **2xl**: `3rem` (48px)
- **3xl**: `4rem` (64px)

### Component Spacing
- **Container Padding**: `1.5rem` (24px)
- **Section Margins**: `3rem` (48px) vertical between sections
- **Card Padding**: `1.5rem` (24px)
- **Form Elements**:
  - Vertical spacing between form groups: `1.5rem` (24px)
  - Vertical spacing between related inputs: `0.5rem` (8px)
  - Horizontal spacing between related elements: `1rem` (16px)

### Grid System
- **Gutter Width**: `1.5rem` (24px)
- **Max Container Width**: `1280px`
- **Breakpoints**:
  - Mobile: `640px`
  - Tablet: `768px`
  - Desktop: `1024px`
  - Large Desktop: `1280px`

### Layout Guidelines
- Use `max-width` containers to prevent content from stretching too wide
- Maintain consistent vertical rhythm using the spacing scale
- Group related UI elements with less spacing between them
- Use more whitespace to separate distinct sections
- Ensure touch targets are at least `44×44px` for mobile

## 4. Component Flow & Navigation

### Sidebar
- **Width**: `16rem` (256px) when expanded, `5rem` (80px) when collapsed
- **Background**: `#ffffff` (white)
- **Active Item**: `#eff6ff` (light blue-50) with left border `3px solid #2563eb`
- **Hover State**: `#f9fafb` (gray-50)
- **Text**: `#1f2937` (gray-900) for active, `#6b7280` (gray-500) for inactive
- **Icons**: `1.25rem` (20px) with `0.5rem` (8px) right margin
- **Transition**: `all 0.2s ease-in-out`

### Navigation Items
- **Height**: `3rem` (48px)
- **Padding**: `0 1rem` (0 16px)
- **Border Radius**: `0.375rem` (6px)
- **Font Weight**: `500` for active, `400` for inactive

### Main Navigation Structure
```
- Dashboard (icon: layout-dashboard)
- Team Performance (icon: users)
  - Overview
  - Individual Performance
  - Team Comparison
- Portfolio (icon: briefcase)
  - Deals Pipeline
  - Revenue Forecast
  - Customer Segments
- Call Intelligence (icon: phone-call)
  - Call Analytics
  - Sentiment Analysis
  - Call Recordings
```

### Navigation Behavior
- Main sections remain always visible
- Sub-sections collapse/expand with smooth animation
- Current section highlighted with blue indicator
- Mobile: Sidebar slides in/out with overlay

## 5. Interactive Components

### Buttons
- **Primary Button**
  - Background: `#2563eb` (primary blue)
  - Text: `#ffffff` (white)
  - Hover: `#1d4ed8` (dark blue)
  - Active: `#1e40af` (darker blue)
  - Padding: `0.5rem 1rem` (8px 16px)
  - Border Radius: `0.375rem` (6px)
  - Font Weight: `500`
  - Height: `2.5rem` (40px)

- **Secondary Button**
  - Background: `#ffffff`
  - Border: `1px solid #d1d5db` (gray-300)
  - Text: `#374151` (gray-700)
  - Hover: `#f9fafb` (gray-50)
  - Active: `#f3f4f6` (gray-100)

- **Danger Button**
  - Background: `#ef4444` (red-500)
  - Text: `#ffffff`
  - Hover: `#dc2626` (red-600)
  - Active: `#b91c1c` (red-700)

### Form Elements
- **Input Fields**
  - Height: `2.5rem` (40px)
  - Padding: `0.5rem 0.75rem`
  - Border: `1px solidhsl(215, 34.70%, 9.60%)` (gray-300)
  - Border Radius: `0.375rem` (6px)
  - Focus: `2px solid #93c5fd` (light blue-300)
  - Placeholder: `#9ca3af` (gray-400)
  - Error State: `border-red-500` with red text

- **Select Dropdowns**
  - Same styling as input fields
  - Include a custom dropdown arrow
  - Max Height: `16rem` (256px) with scroll

- **Checkboxes & Radios**
  - Size: `1rem` (16px)
  - Border: `1px solid #d1d5db` (gray-300)
  - Checked: `#2563eb` (primary blue)
  - Focus: `2px solid #93c5fd` (light blue-300)

### Cards
- **Default Card**
  - Background: `#ffffff`
  - Border: `1px solid #e5e7eb` (gray-200)
  - Border Radius: `0.5rem` (8px)
  - Box Shadow: `0 1px 3px 0 rgba(0, 0, 0, 0.1)`
  - Padding: `1.5rem` (24px)
  - Hover: `box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1)`

### Tables
- **Header**
  - Background: `#f9fafb` (gray-50)
  - Text: `#6b7280` (gray-500)
  - Font Weight: `500`
  - Padding: `0.75rem 1.5rem`
  - Border Bottom: `1px solid #e5e7eb` (gray-200)

- **Cells**
  - Padding: `1rem 1.5rem`
  - Border Bottom: `1px solid #f3f4f6` (gray-100)
  - Text: `#1f2937` (gray-900)

- **Hover State**
  - Background: `#f9fafb` (gray-50)

### Loading States
- **Spinner**
  - Color: `#2563eb` (primary blue)
  - Size: `1.5rem` (24px) for small, `2rem` (32px) for medium, `3rem` (48px) for large
  - Animation: `spin 1s linear infinite`

- **Skeleton Loader**
  - Background: `#f3f4f6` (gray-100)
  - Animation: `pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite`
  - Border Radius: `0.375rem` (6px)

## 6. Responsiveness

### Breakpoints
- **Mobile**: `640px` and below
  - Sidebar collapses to icon-only
  - Single column layout
  - Stacked form elements
  - Larger touch targets
  - Reduced padding/margins

- **Tablet**: `641px` to `1023px`
  - Sidebar can be toggled
  - Two-column grid for metrics
  - Adjusted font sizes

- **Desktop**: `1024px` and above
  - Full sidebar visible
  - Multi-column layouts
  - Hover states active

### Touch Targets
- Minimum touch target: `44×44px`
- Add padding around clickable elements
- Ensure sufficient spacing between interactive elements
- Use `:active` states for touch feedback

### Content Scaling
- Use relative units (`rem`, `em`, `%`)
- Set `viewport` meta tag
- Test zoom to 200%
- Avoid fixed dimensions that could cause overflow

## 7. Accessibility

### Keyboard Navigation
- Logical tab order
- Visible focus states
- Skip to main content link
- Accessible modal dialogs
- No keyboard traps

### ARIA
- Use semantic HTML elements
- Add ARIA attributes when needed:
  - `aria-label` for icon buttons
  - `aria-expanded` for collapsible sections
  - `aria-live` for dynamic content
  - `aria-hidden` for decorative elements

### Color & Contrast
- Minimum contrast ratio: 4.5:1 for normal text
- Don't rely solely on color to convey information
- Test with color blindness simulators
- Provide text alternatives for color indicators

### Screen Readers
- Use proper heading hierarchy
- Add alt text for images
- Describe data visualizations
- Test with screen readers (VoiceOver, NVDA)

## 8. Animations & Transitions

### Timing
- Micro-interactions: `100ms` - `200ms`
- Modal appearances: `200ms` - `300ms`
- Page transitions: `300ms` - `500ms`
- Use `cubic-bezier(0.4, 0, 0.2, 1)` for natural feel

### Motion Preferences
- Respect `prefers-reduced-motion`
- Provide alternative interactions
- Keep animations subtle and purposeful
- Avoid auto-playing animations

### Performance
- Use `transform` and `opacity` for animations
- Avoid animating `height`, `width`, or `margin`
- Use `will-change` sparingly
- Test animations on lower-end devices

## 9. Consistency & Documentation

### Component Library
- Maintain a living styleguide
- Document props, variants, and usage
- Include interactive examples
- Show responsive behavior

### Naming Conventions
- Use consistent naming for components
- Follow BEM or similar methodology
- Keep CSS class names semantic
- Document naming conventions

### Design Tokens
- Document all design tokens
- Organize by category (colors, spacing, etc.)
- Include usage guidelines
- Keep in sync with implementation

### Versioning
- Maintain changelog
- Document breaking changes
- Provide migration guides
- Keep documentation up-to-date

---

_Review this file before starting any new UI work or code review. All design decisions should be traceable to one or more of these tenets._
