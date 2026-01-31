# Mobile-Responsive Features Quick Reference

## Visual Layout Comparison

### Desktop View (> 1024px)
```
┌────────────────────────────────────────────────────────────┐
│ ← Board Title                        [Add Column]          │
├────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│  │ To Do 3 │  │ Progress│  │ Review 2│  │  Done 5 │  →   │
│  ├─────────┤  ├─────────┤  ├─────────┤  ├─────────┤      │
│  │ Card 1  │  │ Card 3  │  │ Card 6  │  │ Card 8  │      │
│  │ Card 2  │  │ Card 4  │  │ Card 7  │  │ Card 9  │      │
│  │         │  │ Card 5  │  │         │  │ Card 10 │      │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘      │
└────────────────────────────────────────────────────────────┘
    Horizontal scroll →
```

### Mobile View (< 768px)
```
┌──────────────────────────┐
│ ← Board     [Add]        │
├──────────────────────────┤
│ ┌────────────────────┐   │
│ │ To Do          [3] │ ← Tap to expand/collapse
│ ├────────────────────┤   │
│ │ ▼ Card 1          │   │
│ │ ▼ Card 2          │   │
│ │ [+ Add a card]    │   │
│ └────────────────────┘   │
│                          │
│ ┌────────────────────┐   │
│ │ In Progress    [1] │ ← Collapsed
│ └────────────────────┘   │
│                          │
│ ┌────────────────────┐   │
│ │ Review         [2] │   │
│ ├────────────────────┤   │
│ │ ▼ Card 6          │   │
│ │ ▼ Card 7          │   │
│ │ [+ Add a card]    │   │
│ └────────────────────┘   │
│         ↓ Scroll         │
└──────────────────────────┘
    Vertical stack
```

## Touch Interactions

### Swipe Gestures
```
┌──────────────────────────┐
│ Column Header        [3] │ ← Swipe LEFT to collapse
├──────────────────────────┤ → Swipe RIGHT to expand
│ Content area...          │
│                          │
└──────────────────────────┘
```

**Swipe Detection:**
- **Minimum distance:** 50px
- **Direction:** Horizontal only
- **Result:** Toggle column expansion

### Tap Interactions
```
        Tap anywhere on header
               ↓
┌──────────────────────────┐
│ ✓ To Do              [3] │ ← Touch target: Full header
└──────────────────────────┘
```

### Card Interactions
```
┌──────────────────────────┐
│ ▢ Task Title          👤 │ ← Tap to open
├──────────────────────────┤   Checkbox to select
│ [High] 💬2               │   Min height: 60px
└──────────────────────────┘
    ↑ Active state on touch
```

## Touch Target Sizes

### Standard Button (Mobile)
```
┌────────────────┐
│   [+ Add]      │ ← 44x44px minimum
└────────────────┘
     Touch safe
```

### Icon Button (Mobile)
```
┌──────┐
│  🗑   │ ← 44x44px
└──────┘
```

### Card Touch Target
```
┌────────────────────────────┐
│  Full card is clickable    │ ← Min 60px height
│  Larger than desktop       │
└────────────────────────────┘
```

## Responsive Header

### Desktop
```
[←] Board Title Is Very Long Here    [Add Column]
```

### Mobile
```
[←] Board Title...    
                [Add] ← Shorter text
```

## Bulk Actions Bar

### Desktop
```
        ┌─────────────────────────────────┐
        │ 3 cards selected [Bulk Delete] ✕│
        └─────────────────────────────────┘
```

### Mobile
```
    ┌──────────────────────┐
    │ 3 cards selected     │
    │ [Delete] ✕           │ ← Wrapped layout
    └──────────────────────┘
```

## Accordion States

### Expanded Column
```
┌────────────────────────┐
│ ▼ To Do            [3] │ ← Header
├────────────────────────┤
│                        │
│  ┌──────────────────┐  │
│  │ Task 1          │  │ ← Visible cards
│  └──────────────────┘  │
│                        │
│  ┌──────────────────┐  │
│  │ Task 2          │  │
│  └──────────────────┘  │
│                        │
│  [+ Add a card]        │ ← Visible button
│                        │
└────────────────────────┘
```

### Collapsed Column
```
┌────────────────────────┐
│ ▶ To Do            [3] │ ← Header only
└────────────────────────┘
     ↑ Indicator
```

## Animation Flow

```
Tap/Swipe Detected
        ↓
State Changes (expandedColumns)
        ↓
CSS Transition Triggers
        ↓
   ┌─────────┐
   │ 300ms   │ ← Smooth animation
   │ ease    │
   └─────────┘
        ↓
Final State Rendered
```

## Feature Matrix

| Feature                  | Mobile | Tablet | Desktop |
|-------------------------|--------|--------|---------|
| Horizontal Scroll       | ✗      | ✓      | ✓       |
| Vertical Stack          | ✓      | ✗      | ✗       |
| Accordion Columns       | ✓      | ✗      | ✗       |
| Swipe Gestures          | ✓      | ✓      | ✗       |
| 44px Touch Targets      | ✓      | ✓      | ✗       |
| Hover Effects           | ✗      | ✗      | ✓       |
| Drag & Drop             | ✓*     | ✓      | ✓       |
| Column Count Badge      | ✓      | ✓      | ✗       |

*Long-press required on touch devices

## Responsive Breakpoint Logic

```javascript
// Material-UI breakpoints used in sx prop:

xs: 0px       →  Mobile phones
sm: 600px     →  Large phones / small tablets  
md: 900px     →  Tablets
lg: 1200px    →  Desktop
xl: 1536px    →  Large desktop

// Custom breakpoints in CSS:
< 768px       →  Mobile (vertical stack)
768-1024px    →  Tablet (optimized spacing)
> 1024px      →  Desktop (horizontal scroll)
```

## CSS Media Query Examples

```css
/* Mobile-first approach */
@media (max-width: 768px) {
  .column {
    width: 100%;
    flex-direction: column;
  }
}

/* Touch device detection */
@media (hover: none) and (pointer: coarse) {
  button {
    min-height: 44px;
  }
}

/* Landscape mobile */
@media (max-width: 768px) and (orientation: landscape) {
  .header {
    padding: 8px;
  }
}
```

## State Management

```javascript
// Column expansion state
expandedColumns = {
  'column-1': true,   // Expanded
  'column-2': false,  // Collapsed
  'column-3': true    // Expanded
}

// Touch gesture state
touchStart: 150      // Starting X position
touchEnd: 80         // Ending X position
distance: 70         // 150 - 80 = 70px (left swipe)
```

## Performance Tips

1. **Hardware Acceleration**
   ```css
   transform: translate3d(0, 0, 0);
   will-change: transform;
   ```

2. **Smooth Scrolling**
   ```css
   -webkit-overflow-scrolling: touch;
   ```

3. **Prevent Overscroll**
   ```css
   overscroll-behavior-y: contain;
   ```

4. **Optimize Animations**
   ```css
   transition: max-height 0.3s ease, opacity 0.3s ease;
   ```

## Testing Devices

### Recommended Test Resolutions:
- **iPhone SE:** 375 x 667
- **iPhone 12/13:** 390 x 844  
- **iPhone 12/13 Pro Max:** 428 x 926
- **iPad Mini:** 768 x 1024
- **iPad Pro:** 1024 x 1366
- **Samsung Galaxy S21:** 360 x 800

### Chrome DevTools Device Emulation:
1. Open DevTools (F12)
2. Click device toggle (Ctrl+Shift+M)
3. Select device from dropdown
4. Test portrait & landscape

## Common Use Cases

### User wants to see all columns at once (Mobile)
→ All columns expanded by default (can change in code)

### User wants to focus on one column
→ Collapse others, expand target column

### User accidentally triggers swipe
→ Minimum distance prevents accidental triggers

### User needs to quickly navigate
→ Tap headers for quick expand/collapse

### User has large board with many columns
→ Scroll vertically through stacked columns
