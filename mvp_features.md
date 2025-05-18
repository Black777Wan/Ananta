# Minimal Viable Product (MVP) Features

Based on the user's request and our research of Roam Research, we've identified the following essential features for our MVP note-taking application:

## Core MVP Features

### 1. Daily Notes
**Priority: High**
- Automatic creation of dated pages (e.g., "May 18, 2025")
- Easy access to today's note from the main interface
- Calendar navigation to access past daily notes
- Simple implementation: Each day gets its own page with a standardized date format

### 2. Markdown Support
**Priority: High**
- Basic markdown formatting (headers, bold, italic, lists, code blocks)
- Live preview of formatted text
- Simple editor with markdown shortcuts
- Implementation: Use existing markdown libraries for parsing and rendering

### 3. Backlinks
**Priority: High**
- Automatic tracking of references to a page
- Display of backlinks at the bottom of each page
- Click-through navigation to referenced pages
- Implementation: Parse content for [[Page Name]] references and maintain an index

### 4. Block-Based Structure
**Priority: Medium**
- Individual paragraphs/bullets as blocks
- Unique identifiers for blocks
- Collapsible nested blocks
- Implementation: Represent content as a hierarchical structure of blocks rather than a single text field

### 5. Bidirectional Linking
**Priority: High**
- Create links using [[Page Name]] syntax
- Automatic page creation when linking to non-existent pages
- Visual indication of links in the editor
- Implementation: Parse content for link syntax and create navigation between pages

## Secondary Features (Post-MVP)

These features are important but can be implemented after the core MVP:

1. **Graph View**: Visual representation of connections between notes
2. **Block References**: Ability to reference and embed specific blocks from other pages
3. **Advanced Search**: Full-text search with filtering options
4. **Tags**: Additional categorization system beyond page links
5. **Multiple Panels**: Side-by-side viewing of related notes
6. **Export/Import**: Data portability options

## Technical Requirements

1. **Real-time Saving**: Changes should be saved automatically
2. **Responsive Design**: Works well on both desktop and mobile devices
3. **Local Storage**: Initial version can use browser's local storage
4. **Performance**: Fast loading and rendering, even with many notes

## Justification

The selected MVP features directly address the user's requirements:
- **Daily Notes**: Explicitly requested by the user
- **Markdown Support**: Explicitly requested by the user ("markdown way")
- **Backlinks**: Explicitly requested by the user
- **Block-Based Structure**: Essential for implementing proper backlinks and references
- **Bidirectional Linking**: Core to the "networked thought" concept of Roam Research

These five features represent the minimum set required to deliver a functional Roam Research-like experience while keeping the initial development scope manageable.
