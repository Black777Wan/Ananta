# Roam Research UI Analysis and Redesign Plan

## Core UI Elements

### 1. Layout Structure
- **Left Sidebar**
  - Daily Notes link at top
  - Graph Overview link
  - All Pages link
  - Shortcuts section
  - Clean, minimalist design with subtle borders
  - Dark navy/gray background (in dark mode)

- **Main Content Area**
  - Page title as large editable text field
  - Date format for daily notes: "Month Day, Year" (e.g., "October 12th, 2019")
  - Block-based content with bullet points
  - Hierarchical indentation
  - Clean white background (light mode) or dark gray (dark mode)

- **Top Navigation**
  - Search/Create Page bar in top-right
  - Three-dot menu for additional options
  - Minimal, unobtrusive design

### 2. Block-Based Editing (Critical Feature)
- Each paragraph is a distinct block with its own bullet point
- Blocks can be nested hierarchically through indentation
- Clicking on a bullet opens focus on that specific block
- Tab key indents, Shift+Tab outdents
- Blocks can be referenced and embedded from other pages
- Blocks automatically expand/collapse with toggle controls

### 3. Daily Notes Interface
- Automatically dated with current date
- Bullet-point structure identical to regular pages
- Chronological organization
- Calendar navigation for accessing past daily notes

### 4. Linking System
- Double bracket syntax for page links: [[Page Name]]
- Links are displayed in a distinct blue color
- New pages are automatically created when linked
- References section at bottom of page shows backlinks

### 5. Search and Navigation
- Combined search/create field in top-right
- Instant search results
- Quick page creation from search bar
- Recent pages easily accessible

### 6. Visual Styling
- Clean, minimalist aesthetic
- Subtle borders and dividers
- Comfortable spacing between elements
- Consistent typography throughout
- Monospaced font for code blocks
- Blue highlight color for links and selections

## Implementation Plan

### 1. HTML Structure Redesign
- Recreate the exact three-panel layout
- Implement proper sidebar with all navigation elements
- Structure main content area for block-based editing
- Add references/backlinks panel at bottom

### 2. CSS Styling Overhaul
- Match exact Roam Research color scheme
- Implement proper typography and spacing
- Create bullet point and indentation styling
- Design block hover and selection states
- Ensure consistent styling across all elements

### 3. JavaScript Functionality
- Implement true block-based editing
- Create bullet-point interaction logic
- Build proper indentation handling with Tab/Shift+Tab
- Develop bidirectional linking with proper syntax highlighting
- Implement backlinks collection and display
- Create daily notes automation

### 4. Critical Interaction Details
- Block manipulation (indent/outdent)
- Block reference creation
- Block focus and selection
- Link creation with double brackets
- Page creation from links
- Backlinks display and navigation

## Key Visual References
- Daily notes format matches "October 12th, 2019" style
- Bullet points are small circles, not dashes or other symbols
- Indentation is clear with consistent spacing
- Links use [[double bracket]] syntax with blue highlighting
- Blocks have subtle hover states
- Clean, distraction-free writing environment

This redesign will focus on creating an exact visual and functional replica of Roam Research, with special attention to the block-based editing system that makes Roam unique.
