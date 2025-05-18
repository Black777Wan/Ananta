/* Roam Research JS - Exact Replica */

document.addEventListener('DOMContentLoaded', function() {
    // Global variables
    let currentNoteId = null;
    let blockIdCounter = 1;
    
    // Initialize the app
    initializeApp();
    
    /**
     * Initialize the application
     */
    function initializeApp() {
        // Set up event listeners
        setupEventListeners();
        
        // Load today's daily note by default
        loadTodayNote();
        
        // Focus on first block
        focusOnFirstBlock();
    }
    
    /**
     * Set up all event listeners
     */
    function setupEventListeners() {
        // Daily notes link
        document.getElementById('daily-notes-link').addEventListener('click', function(e) {
            e.preventDefault();
            loadTodayNote();
        });
        
        // Search input
        const searchInput = document.getElementById('search-input');
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = this.value.trim();
                if (query) {
                    createOrNavigateToPage(query);
                }
            }
        });
        
        // Page title
        document.getElementById('page-title').addEventListener('blur', function() {
            if (currentNoteId) {
                updateNoteTitle(currentNoteId, this.value);
            }
        });
        
        // Block container - delegate events for dynamic blocks
        const blocksContainer = document.getElementById('blocks-container');
        
        // Handle block content editing
        blocksContainer.addEventListener('keydown', function(e) {
            if (e.target.classList.contains('block-content')) {
                handleBlockKeydown(e);
            }
        });
        
        // Handle bullet clicks
        blocksContainer.addEventListener('click', function(e) {
            if (e.target.classList.contains('block-bullet')) {
                toggleBlockCollapse(e.target.closest('.block-wrapper'));
            }
        });
        
        // Handle input for wiki-links detection
        blocksContainer.addEventListener('input', function(e) {
            if (e.target.classList.contains('block-content')) {
                processBlockContent(e.target);
            }
        });
    }
    
    /**
     * Handle keydown events in blocks
     */
    function handleBlockKeydown(e) {
        const blockContent = e.target;
        const blockWrapper = blockContent.closest('.block-wrapper');
        
        // Enter key - create new block
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            createNewBlockAfter(blockWrapper);
        }
        
        // Tab key - indent block
        else if (e.key === 'Tab' && !e.shiftKey) {
            e.preventDefault();
            indentBlock(blockWrapper);
        }
        
        // Shift+Tab - outdent block
        else if (e.key === 'Tab' && e.shiftKey) {
            e.preventDefault();
            outdentBlock(blockWrapper);
        }
        
        // Backspace on empty block - delete and move up
        else if (e.key === 'Backspace' && blockContent.textContent.trim() === '') {
            e.preventDefault();
            deleteEmptyBlock(blockWrapper);
        }
        
        // Up arrow - navigate to previous block
        else if (e.key === 'ArrowUp' && isCaretAtStart(blockContent)) {
            e.preventDefault();
            navigateToPreviousBlock(blockWrapper);
        }
        
        // Down arrow - navigate to next block
        else if (e.key === 'ArrowDown' && isCaretAtEnd(blockContent)) {
            e.preventDefault();
            navigateToNextBlock(blockWrapper);
        }
    }
    
    /**
     * Process block content for wiki-links
     */
    function processBlockContent(blockContent) {
        const text = blockContent.textContent;
        
        // Check for wiki-links [[Page Name]]
        const linkRegex = /\[\[(.*?)\]\]/g;
        let match;
        let processedHTML = text;
        
        // Replace wiki-links with styled spans
        while ((match = linkRegex.exec(text)) !== null) {
            const pageName = match[1];
            processedHTML = processedHTML.replace(
                match[0],
                `<span class="roam-link" data-page="${pageName}">${pageName}</span>`
            );
        }
        
        // Only update if there are links
        if (processedHTML !== text) {
            // Preserve cursor position
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            const cursorOffset = range.startOffset;
            
            // Update content
            blockContent.innerHTML = processedHTML;
            
            // Restore cursor position (approximate)
            placeCursorInElement(blockContent, cursorOffset);
            
            // Add click handlers to links
            blockContent.querySelectorAll('.roam-link').forEach(link => {
                link.addEventListener('click', function() {
                    const pageName = this.dataset.page;
                    createOrNavigateToPage(pageName);
                });
            });
        }
    }
    
    /**
     * Create a new block after the specified block
     */
    function createNewBlockAfter(blockWrapper) {
        const newBlockId = 'block-' + blockIdCounter++;
        const template = document.getElementById('block-template');
        const newBlockWrapper = template.content.cloneNode(true).querySelector('.block-wrapper');
        
        newBlockWrapper.dataset.blockId = newBlockId;
        
        // Insert after the current block
        const parent = blockWrapper.parentNode;
        
        // If this is a child block, insert in the same children container
        if (parent.classList.contains('block-children')) {
            parent.insertBefore(newBlockWrapper, blockWrapper.nextSibling);
        } 
        // Otherwise, insert in the main container
        else {
            parent.insertBefore(newBlockWrapper, blockWrapper.nextSibling);
        }
        
        // Focus on the new block
        const newBlockContent = newBlockWrapper.querySelector('.block-content');
        newBlockContent.focus();
        
        return newBlockWrapper;
    }
    
    /**
     * Indent a block (make it a child of the previous block)
     */
    function indentBlock(blockWrapper) {
        const prevBlock = getPreviousBlock(blockWrapper);
        
        // Can't indent if there's no previous block
        if (!prevBlock) return;
        
        // Get or create children container for the previous block
        let childrenContainer = prevBlock.querySelector('.block-children');
        if (!childrenContainer) {
            childrenContainer = document.createElement('div');
            childrenContainer.className = 'block-children';
            prevBlock.appendChild(childrenContainer);
        }
        
        // Move the current block to the children container
        childrenContainer.appendChild(blockWrapper);
        
        // Focus back on the block content
        blockWrapper.querySelector('.block-content').focus();
    }
    
    /**
     * Outdent a block (move it to parent level)
     */
    function outdentBlock(blockWrapper) {
        const parent = blockWrapper.parentNode;
        
        // Can only outdent if inside a children container
        if (!parent.classList.contains('block-children')) return;
        
        const parentBlock = parent.parentNode;
        const grandparent = parentBlock.parentNode;
        
        // Insert after the parent block
        grandparent.insertBefore(blockWrapper, parentBlock.nextSibling);
        
        // Focus back on the block content
        blockWrapper.querySelector('.block-content').focus();
    }
    
    /**
     * Delete an empty block and move focus to previous block
     */
    function deleteEmptyBlock(blockWrapper) {
        const prevBlock = getPreviousBlock(blockWrapper);
        
        // Don't delete if it's the only block
        if (!prevBlock) return;
        
        // Remove the current block
        blockWrapper.remove();
        
        // Focus on the previous block's content
        const prevBlockContent = prevBlock.querySelector('.block-content');
        prevBlockContent.focus();
        
        // Place cursor at the end
        placeCursorAtEnd(prevBlockContent);
    }
    
    /**
     * Navigate to the previous block
     */
    function navigateToPreviousBlock(blockWrapper) {
        const prevBlock = getPreviousBlock(blockWrapper);
        if (prevBlock) {
            const prevBlockContent = prevBlock.querySelector('.block-content');
            prevBlockContent.focus();
            placeCursorAtEnd(prevBlockContent);
        }
    }
    
    /**
     * Navigate to the next block
     */
    function navigateToNextBlock(blockWrapper) {
        const nextBlock = getNextBlock(blockWrapper);
        if (nextBlock) {
            const nextBlockContent = nextBlock.querySelector('.block-content');
            nextBlockContent.focus();
            placeCursorAtStart(nextBlockContent);
        }
    }
    
    /**
     * Toggle collapse state of a block
     */
    function toggleBlockCollapse(blockWrapper) {
        const childrenContainer = blockWrapper.querySelector('.block-children');
        if (childrenContainer && childrenContainer.children.length > 0) {
            childrenContainer.classList.toggle('collapsed');
            blockWrapper.classList.toggle('collapsed');
        }
    }
    
    /**
     * Get the previous block in the hierarchy
     */
    function getPreviousBlock(blockWrapper) {
        // Check if there's a previous sibling
        let prevSibling = blockWrapper.previousElementSibling;
        if (prevSibling && prevSibling.classList.contains('block-wrapper')) {
            // If previous sibling has children, get the last descendant
            return getLastDescendantBlock(prevSibling) || prevSibling;
        }
        
        // If no previous sibling, go up to parent
        const parent = blockWrapper.parentNode;
        if (parent.classList.contains('block-children')) {
            return parent.parentNode;
        }
        
        return null;
    }
    
    /**
     * Get the last descendant block of a block
     */
    function getLastDescendantBlock(blockWrapper) {
        const childrenContainer = blockWrapper.querySelector('.block-children');
        if (!childrenContainer || childrenContainer.children.length === 0) {
            return null;
        }
        
        const lastChild = childrenContainer.lastElementChild;
        return getLastDescendantBlock(lastChild) || lastChild;
    }
    
    /**
     * Get the next block in the hierarchy
     */
    function getNextBlock(blockWrapper) {
        // Check if there are children
        const childrenContainer = blockWrapper.querySelector('.block-children');
        if (childrenContainer && childrenContainer.children.length > 0 && 
            !childrenContainer.classList.contains('collapsed')) {
            return childrenContainer.firstElementChild;
        }
        
        // Check if there's a next sibling
        let nextSibling = blockWrapper.nextElementSibling;
        if (nextSibling && nextSibling.classList.contains('block-wrapper')) {
            return nextSibling;
        }
        
        // If no next sibling, go up to parent and find its next sibling
        let current = blockWrapper;
        while (current) {
            const parent = current.parentNode;
            if (parent.classList.contains('block-children')) {
                const parentBlock = parent.parentNode;
                const parentNextSibling = parentBlock.nextElementSibling;
                if (parentNextSibling && parentNextSibling.classList.contains('block-wrapper')) {
                    return parentNextSibling;
                }
                current = parentBlock;
            } else {
                break;
            }
        }
        
        return null;
    }
    
    /**
     * Check if caret is at the start of an element
     */
    function isCaretAtStart(element) {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return false;
        
        const range = selection.getRangeAt(0);
        return range.startOffset === 0;
    }
    
    /**
     * Check if caret is at the end of an element
     */
    function isCaretAtEnd(element) {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return false;
        
        const range = selection.getRangeAt(0);
        return range.startOffset === element.textContent.length;
    }
    
    /**
     * Place cursor at the end of an element
     */
    function placeCursorAtEnd(element) {
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(element);
        range.collapse(false); // false = collapse to end
        selection.removeAllRanges();
        selection.addRange(range);
    }
    
    /**
     * Place cursor at the start of an element
     */
    function placeCursorAtStart(element) {
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(element);
        range.collapse(true); // true = collapse to start
        selection.removeAllRanges();
        selection.addRange(range);
    }
    
    /**
     * Place cursor at a specific offset in an element
     */
    function placeCursorInElement(element, offset) {
        const range = document.createRange();
        const selection = window.getSelection();
        
        // Adjust offset if it's beyond the content length
        const textNode = element.firstChild || element;
        const maxOffset = textNode.textContent ? textNode.textContent.length : 0;
        const safeOffset = Math.min(offset, maxOffset);
        
        try {
            range.setStart(textNode, safeOffset);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
        } catch (e) {
            console.error('Error setting cursor position:', e);
            // Fallback to end of element
            placeCursorAtEnd(element);
        }
    }
    
    /**
     * Focus on the first block in the document
     */
    function focusOnFirstBlock() {
        const firstBlock = document.querySelector('.block-content');
        if (firstBlock) {
            firstBlock.focus();
        }
    }
    
    /**
     * Load today's daily note
     */
    function loadTodayNote() {
        // Format today's date in Roam style: "May 18th, 2025"
        const today = new Date();
        const options = { month: 'long', day: 'numeric', year: 'numeric' };
        let dateStr = today.toLocaleDateString('en-US', options);
        
        // Add ordinal suffix to day
        const day = today.getDate();
        const suffix = getOrdinalSuffix(day);
        dateStr = dateStr.replace(day, day + suffix);
        
        // Set page title
        document.getElementById('page-title').value = dateStr;
        
        // Clear existing blocks except the first one
        const blocksContainer = document.getElementById('blocks-container');
        const firstBlockWrapper = blocksContainer.querySelector('.block-wrapper');
        blocksContainer.innerHTML = '';
        blocksContainer.appendChild(firstBlockWrapper);
        
        // Clear the first block content
        const firstBlockContent = firstBlockWrapper.querySelector('.block-content');
        firstBlockContent.innerHTML = '';
        
        // Focus on the first block
        firstBlockContent.focus();
        
        // Set current note ID
        const dateId = for
(Content truncated due to size limit. Use line ranges to read in chunks)