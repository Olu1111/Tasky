# Mobile-Responsive Layout Testing Guide

## Quick Start Testing

### Prerequisites
- Frontend development server running (`npm run dev`)
- Access to Chrome DevTools or physical mobile device
- Test board with multiple columns and cards

### Quick Smoke Test (5 minutes)
1. Open board in mobile view (< 768px width)
2. Verify columns stack vertically ✓
3. Tap a column header → Should expand/collapse ✓
4. Swipe left on column → Should collapse ✓
5. Swipe right on column → Should expand ✓
6. Tap "Add a card" → Modal should open ✓
7. Tap back button → Should be easily clickable (44px+) ✓

---

## Comprehensive Testing Checklist

### 1. Layout Responsiveness

#### Desktop View (> 1024px)
- [ ] Columns display horizontally
- [ ] Horizontal scroll enabled
- [ ] Each column width: 300px
- [ ] Column headers not clickable to collapse
- [ ] Swipe gestures disabled
- [ ] Standard button sizes

#### Tablet View (768px - 1024px)  
- [ ] Columns display horizontally with optimized spacing
- [ ] Touch targets increased to 44px
- [ ] Swipe gestures work
- [ ] Accordion NOT active
- [ ] Responsive padding applied

#### Mobile View (< 768px)
- [ ] Columns stack vertically
- [ ] Full-width columns (100%)
- [ ] No horizontal scroll
- [ ] Accordion active
- [ ] Swipe gestures work
- [ ] Touch targets 44px minimum

### 2. Accordion Functionality

#### Column Expansion
- [ ] Click/tap header toggles expansion
- [ ] Smooth animation (300ms)
- [ ] Content fades in/out
- [ ] Badge always visible
- [ ] Delete icon always visible

#### Visual Indicators
- [ ] Task count badge shows on header
- [ ] "Add a card" button hidden when collapsed
- [ ] Cards hidden when collapsed
- [ ] No layout shift on toggle

#### Default State
- [ ] All columns expanded on first load (can customize)
- [ ] State persists during session
- [ ] Independent expansion (one doesn't affect others)

### 3. Swipe Gesture Detection

#### Left Swipe (Collapse)
- [ ] Detects swipe > 50px
- [ ] Collapses the column
- [ ] Works anywhere on column
- [ ] Doesn't interfere with card selection
- [ ] Smooth visual feedback

#### Right Swipe (Expand)
- [ ] Detects swipe > 50px
- [ ] Expands the column
- [ ] Works on collapsed header
- [ ] Doesn't interfere with browser back gesture

#### Edge Cases
- [ ] Short swipes (<50px) ignored
- [ ] Vertical swipes ignored
- [ ] Multiple rapid swipes handled
- [ ] Swipe during drag doesn't break functionality

### 4. Touch Target Optimization

#### Button Sizes (Mobile)
- [ ] "Add Column" button: 44px height minimum
- [ ] "Add a card" button: 44px height minimum
- [ ] Back button: 44x44px
- [ ] Delete icons: 44x44px touch area
- [ ] Bulk delete button: 44px height

#### Card Interactions
- [ ] Card minimum height: 60px
- [ ] Full card clickable
- [ ] Checkbox has expanded touch area
- [ ] Cards have active state on tap
- [ ] No accidental selections

#### Interactive Elements
- [ ] Column header: Full width tappable
- [ ] Input fields: No zoom on focus (iOS)
- [ ] Modal close buttons: 44x44px
- [ ] Filter buttons: Adequate spacing

### 5. Animation & Transitions

#### Expand/Collapse Animation
- [ ] Duration: 300ms
- [ ] Easing: ease-in-out
- [ ] Height transition smooth
- [ ] Opacity fade smooth
- [ ] No content flash

#### Active States
- [ ] Button press shows feedback
- [ ] Card press shows feedback (scale 0.98)
- [ ] Header tap shows feedback
- [ ] Transitions don't lag

#### Drag & Drop
- [ ] Visual feedback during drag
- [ ] Smooth return animation
- [ ] Works with long-press
- [ ] Compatible with touch

### 6. Responsive Header

#### Mobile (< 768px)
- [ ] "Add Column" text shortened to "Add"
- [ ] Title font size reduced
- [ ] Back button enlarged
- [ ] Layout wraps if needed
- [ ] Padding reduced

#### Tablet (768-1024px)
- [ ] Balanced spacing
- [ ] Full button text visible
- [ ] Adequate padding

#### Landscape Mobile
- [ ] Header height reduced
- [ ] Still fully functional
- [ ] No overflow

### 7. Bulk Actions Bar

#### Mobile View
- [ ] Fixed at bottom (20px from edge)
- [ ] Button text shortened ("Bulk Delete" → "Delete")
- [ ] Responsive width (max-width with margins)
- [ ] Wraps content if needed
- [ ] Close button 44x44px
- [ ] Safe area from screen edge

#### Functionality
- [ ] Appears on selection
- [ ] Smooth fade-in
- [ ] Doesn't block content
- [ ] Touch-friendly positioning
- [ ] Z-index correct

### 8. Modal Dialogs

#### Mobile Optimization
- [ ] Full-width with 16px margins
- [ ] Max-height: calc(100% - 32px)
- [ ] Scrollable content
- [ ] Close button accessible
- [ ] No zoom on input focus

#### Ticket Modal
- [ ] Opens on "Add a card"
- [ ] Form inputs accessible
- [ ] Submit button 44px height
- [ ] Cancel button 44px height

#### Edit Modal
- [ ] Opens on card tap
- [ ] All controls accessible
- [ ] Delete button prominent
- [ ] Save button prominent

#### Delete Confirmation
- [ ] Clear messaging
- [ ] Easy to cancel
- [ ] Confirm button distinct

### 9. Performance

#### Rendering
- [ ] Smooth scrolling
- [ ] No lag on expand/collapse
- [ ] No jank during animations
- [ ] 60fps maintained

#### Touch Response
- [ ] Immediate feedback (<100ms)
- [ ] No delayed responses
- [ ] No stuck gestures
- [ ] Clean touch event handling

#### Memory
- [ ] No memory leaks on interaction
- [ ] Efficient state management
- [ ] Proper event cleanup

### 10. Cross-Browser Testing

#### iOS Safari
- [ ] Touch events work
- [ ] Smooth scrolling
- [ ] No zoom on input focus
- [ ] Active states visible
- [ ] Safe area respected (notch)
- [ ] Swipe doesn't trigger back

#### Chrome Mobile
- [ ] All features work
- [ ] Performance smooth
- [ ] Touch feedback clear
- [ ] No console errors

#### Firefox Mobile
- [ ] Touch events work
- [ ] Animations smooth
- [ ] Layout correct

#### Samsung Internet
- [ ] Full functionality
- [ ] No browser-specific issues

---

## Device-Specific Testing

### iPhone SE (Small Screen)
- Width: 375px
- [ ] All content visible
- [ ] No horizontal overflow
- [ ] Touch targets adequate
- [ ] Text readable

### iPhone 12/13 (Standard)
- Width: 390px
- [ ] Optimal layout
- [ ] Balanced spacing
- [ ] All features work

### iPhone 12/13 Pro Max (Large)
- Width: 428px
- [ ] Uses extra space well
- [ ] Not too stretched
- [ ] Comfortable to use

### iPad Mini (Small Tablet)
- Width: 768px (breakpoint!)
- [ ] Desktop OR mobile layout
- [ ] Clear which mode active
- [ ] Touch targets still good

### iPad Pro (Large Tablet)
- Width: 1024px
- [ ] Desktop layout
- [ ] Horizontal scroll works
- [ ] Adequate column sizing

---

## Automated Testing Scripts

### Test with Chrome DevTools

```javascript
// Open DevTools Console and run:

// Test 1: Check if mobile.css loaded
console.log('Mobile CSS loaded:', 
  !!document.querySelector('link[href*="mobile.css"]'));

// Test 2: Check current breakpoint
const width = window.innerWidth;
const breakpoint = width < 768 ? 'mobile' : 
                   width < 1024 ? 'tablet' : 'desktop';
console.log('Current breakpoint:', breakpoint);

// Test 3: Verify touch targets
const buttons = document.querySelectorAll('button');
const inadequate = Array.from(buttons).filter(btn => {
  const rect = btn.getBoundingClientRect();
  return (rect.height < 44 || rect.width < 44) && width < 768;
});
console.log('Buttons below 44px on mobile:', inadequate.length);

// Test 4: Check for horizontal overflow
const body = document.body;
console.log('Horizontal overflow:', 
  body.scrollWidth > body.clientWidth);
```

### Resize Window Test

```javascript
// Gradually resize window and check layout
const testBreakpoints = [375, 768, 1024, 1440];
testBreakpoints.forEach(width => {
  window.resizeTo(width, 800);
  setTimeout(() => {
    console.log(`Width ${width}px:`, {
      columns: document.querySelectorAll('.MuiBox-root').length,
      overflow: body.scrollWidth > body.clientWidth
    });
  }, 500);
});
```

---

## Manual Testing Procedure

### Setup (5 min)
1. Start frontend: `cd frontend && npm run dev`
2. Open browser: `http://localhost:5173`
3. Open DevTools: F12
4. Enable device toolbar: Ctrl+Shift+M
5. Select "iPhone 12 Pro" or similar

### Core Flow Test (10 min)

**Test 1: Navigate to Board**
1. Login if needed
2. Click on any board
3. ✓ Board loads without errors
4. ✓ Columns visible

**Test 2: Mobile Layout**
1. Resize to 375px width
2. ✓ Columns stack vertically
3. ✓ Full-width columns
4. ✓ Scroll vertically to see all

**Test 3: Accordion**
1. Tap first column header
2. ✓ Column collapses
3. ✓ Animation smooth
4. ✓ Badge still visible
5. Tap again
6. ✓ Column expands
7. ✓ Cards appear

**Test 4: Swipe Gestures**
1. Swipe left on second column
2. ✓ Column collapses
3. Swipe right on same column
4. ✓ Column expands
5. Try short swipe (<50px)
6. ✓ Nothing happens (correct)

**Test 5: Touch Targets**
1. Try tapping "Add Column"
2. ✓ Easy to tap, opens modal
3. Try tapping back button
4. ✓ Easy to tap, navigates back
5. Return to board
6. Try tapping a card
7. ✓ Easy to tap, opens edit modal

**Test 6: Bulk Actions**
1. Select multiple cards (tap checkboxes)
2. ✓ Bulk action bar appears
3. ✓ Positioned at bottom
4. ✓ Text readable
5. Tap delete
6. ✓ Button responsive

**Test 7: Landscape Mode**
1. Rotate device (or change DevTools)
2. ✓ Layout adapts
3. ✓ Header compressed
4. ✓ Content still accessible

**Test 8: Return to Desktop**
1. Resize to 1200px
2. ✓ Horizontal layout returns
3. ✓ Accordion disabled
4. ✓ Standard button sizes
5. ✓ No layout issues

### Edge Cases (5 min)

**Empty Board**
- [ ] Empty state displays correctly on mobile
- [ ] "Add Column" button accessible

**Many Columns**
- [ ] 10+ columns scroll smoothly
- [ ] Performance maintained
- [ ] All expandable

**Long Card Titles**
- [ ] Text wraps correctly
- [ ] Card height adjusts
- [ ] Touch target maintained

**Rapid Interactions**
- [ ] Multiple rapid taps handled
- [ ] No stuck states
- [ ] Animations don't break

---

## Regression Testing

After any code changes, re-run:
- [ ] All columns stack on mobile
- [ ] Tap to expand/collapse works
- [ ] Swipe gestures functional
- [ ] Touch targets adequate (44px)
- [ ] No console errors
- [ ] Performance smooth

---

## Issue Reporting Template

```markdown
**Issue:** [Brief description]
**Device:** [iPhone 12, iPad, etc.]
**Screen Size:** [375x667]
**Browser:** [Safari 14, Chrome 90, etc.]
**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Behavior:**

**Actual Behavior:**

**Screenshots:**

**Console Errors:**
```

---

## Success Criteria

All tests passing means:
✓ Mobile layout works 100%
✓ Touch interactions responsive
✓ Animations smooth
✓ No accessibility issues
✓ Cross-browser compatible
✓ Performance optimized

## Notes

- Test on real devices when possible
- Emulators are good but not perfect
- Check both portrait and landscape
- Test with slow network (throttling)
- Test with reduced motion settings
- Consider color contrast in bright light
