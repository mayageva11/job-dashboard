# Design System — enforce on every UI component

## Aesthetic
- Target feel: developer tool, not HR portal
- References: Linear, Vercel dashboard, Railway
- Never use default Tailwind blue or generic card shadows

## Color Palette
- Page background:  #0a0a0a
- Card background:  #111111
- Card border:      #1e1e1e
- Subtle text:      #6b7280
- Primary text:     #f0f0f0
- Accent:           #7c3aed
- Accent hover:     #6d28d9
- Success:          #16a34a
- Warning:          #ea580c
- Error:            #dc2626

## Typography
- Import Geist from Google Fonts — use everywhere, no system font fallbacks
- Sizes: 12px labels, 14px body, 16px card titles, 24px page headings
- Weights: 400 normal, 500 medium, 600 headings

## Match Score Badge
- Color is dynamic HSL interpolated from the score value:
  70  → hsl(25,  90%, 55%)  orange
  80  → hsl(45,  90%, 52%)  yellow
  90  → hsl(90,  80%, 42%)  yellow-green
  100 → hsl(142, 70%, 40%)  green
- Never two static colors — always interpolate between these stops
- Shape: rounded pill, monospace font, number + % symbol

## Cards
- border: 1px solid #1e1e1e, border-radius: 12px, padding: 20px
- Hover: border-color → #7c3aed40,
  box-shadow: 0 0 0 1px #7c3aed40, 0 4px 24px #7c3aed15
- Transition: all 150ms ease
- No white backgrounds, no generic drop shadows

## Buttons
- Primary (Apply):    bg #7c3aed, hover #6d28d9, text white
- Destructive (Dismiss): transparent, border #1e1e1e,
  hover border #dc2626, hover text #dc2626
- All buttons: transform scale(0.97) on active, transition 100ms
- border-radius: 8px, padding: 8px 16px

## Spacing
- Strict 8px grid — all margins and paddings are multiples of 8px
- Card grid gap: 16px
- Page padding: 32px desktop, 16px mobile

## Empty States
- Never a blank area
- Every empty state: inline SVG icon + one-line message + optional action button
- "No matching jobs yet — click Scrape Now to fetch listings"
- "Nothing applied yet — your applications will appear here"

## Loading States
- Skeleton screens only, never spinners
- Skeleton cards: same dimensions as real cards, bg #1a1a1a
- Shimmer: background-position 200% → -200%, 1.5s infinite

## Animations
- Stats numbers count up from 0 on first load, 300ms ease-out
- New cards: opacity 0→1, translateY 8px→0, 150ms
- Dismissed cards: opacity 1→0, scale 1→0.97, 150ms, then remove from DOM
- Animations only on meaningful state changes, not on every interaction

## Toasts (react-hot-toast)
- Override defaults: background #1a1a1a, color #f0f0f0,
  border 1px solid #2a2a2a
- Success: left border 3px solid #16a34a
- Error: left border 3px solid #dc2626

## Responsive
- Desktop: 3-column job grid
- Tablet < 1024px: 2-column
- Mobile < 768px: 1-column full-width
- Stats bar: wraps to 2×2 on mobile

## Never Do
- No Bootstrap, Material UI, or Chakra
- No colored or gradient page backgrounds
- No generic box-shadow: 0 2px 4px rgba(0,0,0,0.1)
- No lorem ipsum or placeholder text anywhere
- No default browser focus rings —
  replace with outline: 2px solid #7c3aed, outline-offset: 2px
