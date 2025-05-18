// Main application JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Global variables
    let currentNoteId = null;
    let editor = null;
    
    // Initialize the editor
    initEditor();
    
    // Load today's note by default
    loadTodayNote();
    
    // Load recent notes
    loadRecentNotes();
    
    // Set up event listeners
    setupEventListeners();
    
    /**
     * Initialize the Markdown editor
     */
    function initEditor() {
        editor = new EasyMDE({
            element: document.getElementById('note-editor'),
            autofocus: true,
            spellChecker: false,
            placeholder: "Start typing with Markdown...",
            toolbar: [
                "bold", "italic", "heading", "|", 
                "quote", "unordered-list", "ordered-list", "|",
                "link", "image", "|",
                "preview", "side-by-side", "fullscreen", "|",
                "guide"
            ],
            renderingConfig: {
                singleLineBreaks: false,
                codeSyntaxHighlighting: true,
            },
            status: ["autosave", "lines", "words"],
            autoSave: {
                enabled: true,
                delay: 1000,
                uniqueId: "note-editor"
            }
        });
        
        // Add custom handler for wiki-style links
        editor.codemirror.on("change", function() {
            const content = editor.value();
            highlightWikiLinks(content);
        });
    }
    
    /**
     * Highlight wiki-style links in the editor
     */
    function highlightWikiLinks(content) {
        // This would be implemented with CodeMirror's overlay mode
        // For simplicity, we're just handling the rendering in the preview
        
        // Custom markdown renderer for wiki links
        const renderer = new marked.Renderer();
        const originalLinkRenderer = renderer.link;
        
        renderer.link = function(href, title, text) {
            if (text.match(/^\[\[.*\]\]$/)) {
                const pageName = text.substring(2, text.length - 2);
                return `<a class="wiki-link" href="#" data-page="${pageName}">${pageName}</a>`;
            }
            return originalLinkRenderer.call(this, href, title, text);
        };
        
        marked.setOptions({ renderer });
    }
    
    /**
     * Set up event listeners for UI interactions
     */
    function setupEventListeners() {
        // Today note button
        document.getElementById('today-note-btn').addEventListener('click', loadTodayNote);
        
        // New note button
        document.getElementById('new-note-btn').addEventListener('click', createNewNote);
        
        // Save note button
        document.getElementById('save-note-btn').addEventListener('click', saveCurrentNote);
        
        // Calendar toggle
        document.getElementById('calendar-toggle').addEventListener('click', toggleCalendar);
        
        // Search input
        const searchInput = document.getElementById('search-input');
        searchInput.addEventListener('input', debounce(function() {
            if (searchInput.value.length >= 2) {
                searchNotes(searchInput.value);
            } else {
                document.getElementById('search-results').innerHTML = '';
            }
        }, 300));
        
        // Note title input
        document.getElementById('note-title').addEventListener('blur', function() {
            if (currentNoteId) {
                updateNoteTitle(currentNoteId, this.value);
            }
        });
    }
    
    /**
     * Load today's daily note
     */
    function loadTodayNote() {
        fetch('/api/daily/today')
            .then(response => response.json())
            .then(data => {
                displayNote(data);
            })
            .catch(error => console.error('Error loading today\'s note:', error));
    }
    
    /**
     * Load recent notes into the sidebar
     */
    function loadRecentNotes() {
        fetch('/api/search/recent?limit=10')
            .then(response => response.json())
            .then(data => {
                const recentNotesContainer = document.getElementById('recent-notes');
                recentNotesContainer.innerHTML = '';
                
                data.forEach(note => {
                    const noteItem = document.createElement('div');
                    noteItem.className = 'note-item';
                    noteItem.textContent = note.title;
                    noteItem.dataset.id = note.id;
                    
                    noteItem.addEventListener('click', function() {
                        loadNote(note.id);
                    });
                    
                    recentNotesContainer.appendChild(noteItem);
                });
            })
            .catch(error => console.error('Error loading recent notes:', error));
    }
    
    /**
     * Load a specific note by ID
     */
    function loadNote(noteId) {
        fetch(`/api/notes/${noteId}`)
            .then(response => response.json())
            .then(data => {
                displayNote(data);
            })
            .catch(error => console.error(`Error loading note ${noteId}:`, error));
    }
    
    /**
     * Display a note in the editor
     */
    function displayNote(note) {
        currentNoteId = note.id;
        
        // Set title
        document.getElementById('note-title').value = note.title;
        
        // Set content in editor
        let content = '';
        if (note.blocks && note.blocks.length > 0) {
            content = note.blocks.map(block => block.content).join('\n\n');
        }
        editor.value(content);
        
        // Display backlinks
        displayBacklinks(note.backlinks || []);
        
        // Update active note in sidebar
        updateActiveSidebarNote(note.id);
    }
    
    /**
     * Display backlinks for the current note
     */
    function displayBacklinks(backlinks) {
        const backlinksContainer = document.getElementById('backlinks-content');
        backlinksContainer.innerHTML = '';
        
        if (backlinks.length === 0) {
            backlinksContainer.innerHTML = '<p class="text-muted">No backlinks found</p>';
            return;
        }
        
        backlinks.forEach(link => {
            const backlinkItem = document.createElement('div');
            backlinkItem.className = 'backlink-item';
            
            const backlinkTitle = document.createElement('div');
            backlinkTitle.className = 'backlink-title';
            backlinkTitle.textContent = link.note_title;
            backlinkTitle.addEventListener('click', function() {
                loadNote(link.note_id);
            });
            
            const backlinkPreview = document.createElement('div');
            backlinkPreview.className = 'backlink-preview';
            backlinkPreview.textContent = link.block_content;
            
            backlinkItem.appendChild(backlinkTitle);
            backlinkItem.appendChild(backlinkPreview);
            backlinksContainer.appendChild(backlinkItem);
        });
    }
    
    /**
     * Update the active note in the sidebar
     */
    function updateActiveSidebarNote(noteId) {
        // Remove active class from all notes
        document.querySelectorAll('.note-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to current note
        const activeNote = document.querySelector(`.note-item[data-id="${noteId}"]`);
        if (activeNote) {
            activeNote.classList.add('active');
        }
    }
    
    /**
     * Create a new note
     */
    function createNewNote() {
        const title = 'Untitled Note';
        
        fetch('/api/notes/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title })
        })
        .then(response => response.json())
        .then(data => {
            displayNote(data);
            loadRecentNotes(); // Refresh the recent notes list
        })
        .catch(error => console.error('Error creating new note:', error));
    }
    
    /**
     * Save the current note
     */
    function saveCurrentNote() {
        if (!currentNoteId) return;
        
        const content = editor.value();
        
        // Split content into blocks (paragraphs)
        const blocks = content.split('\n\n').filter(block => block.trim() !== '');
        
        // First, delete all existing blocks
        fetch(`/api/notes/${currentNoteId}`)
            .then(response => response.json())
            .then(note => {
                // Delete existing blocks
                const deletePromises = note.blocks.map(block => 
                    fetch(`/api/notes/blocks/${block.id}`, { method: 'DELETE' })
                );
                
                return Promise.all(deletePromises);
            })
            .then(() => {
                // Create new blocks
                const createPromises = blocks.map((blockContent, index) => 
                    fetch(`/api/notes/${currentNoteId}/blocks`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ 
                            content: blockContent,
                            order: index
                        })
                    })
                );
                
                return Promise.all(createPromises);
            })
            .then(() => {
                // Show success message
                alert('Note saved successfully!');
                
                // Reload the note to get updated backlinks
                loadNote(currentNoteId);
            })
            .catch(error => console.error('Error saving note:', error));
    }
    
    /**
     * Update a note's title
     */
    function updateNoteTitle(noteId, title) {
        fetch(`/api/notes/${noteId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title })
        })
        .catch(error => console.error('Error updating note title:', error));
    }
    
    /**
     * Toggle the calendar display
     */
    function toggleCalendar() {
        const calendarContainer = document.getElementById('calendar-container');
        
        if (calendarContainer.classList.contains('d-none')) {
            calendarContainer.classList.remove('d-none');
            renderCalendar(new Date());
        } else {
            calendarContainer.classList.add('d-none');
        }
    }
    
    /**
     * Render the calendar for a specific month
     */
    function renderCalendar(date) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        
        // Get the calendar template
        const template = document.getElementById('calendar-template');
        const calendarContainer = document.getElementById('calendar-container');
        calendarContainer.innerHTML = '';
        
        const calendarClone = template.content.cloneNode(true);
        calendarContainer.appendChild(calendarClone);
        
        // Set month and year
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
        document.querySelector('.month-year').textContent = `${monthNames[month-1]} ${year}`;
        
        // Set up navigation
        document.querySelector('.prev-month').addEventListener('click', function() {
            const prevMonth = new Date(year, month - 2, 1);
            renderCalendar(prevMonth);
        });
        
        document.querySelector('.next-month').addEventListener('click', function() {
            const nextMonth = new Date(year, month, 1);
            renderCalendar(nextMonth);
        });
        
        // Get days with notes for this month
        fetch(`/api/daily/calendar/${year}/${month}`)
            .then(response => response.json())
            .then(data => {
                const daysWithNotes = data.days_with_notes || [];
                
                // Render calendar days
                const firstDay = new Date(year, month - 1, 1);
                const lastDay = new Date(year, month, 0);
                const daysInMonth = lastDay.getDate();
                const startingDay = firstDay.getDay(); // 0 = Sunday
                
                const calendarGrid = document.querySelector('.calendar-grid');
                
                // Add empty cells for days before the first of the month
                for (let i = 0; i < startingDay; i++) {
                    const emptyDay = document.createElement('div');
                    emptyDay.className = 'calendar-day empty';
                    calendarGrid.appendChild(emptyDay);
                }
                
                // Add days of the month
                const today = new Date();
                const isCurrentMonth = today.getMonth() + 1 === month && today.getFullYear() === year;
                const currentDate = today.getDate();
                
                for (let i = 1; i <= daysInMonth; i++) {
                    const dayElement = document.createElement('div');
                    dayElement.className = 'calendar-day';
                    dayElement.textContent = i;
                    
                    // Mark days with notes
                    if (daysWithNotes.includes(i)) {
                        dayElement.classList.add('has-note');
                    }
                    
                    // Mark today
                    if (isCurrentMonth && i === currentDate) {
                        dayElement.classList.add('today');
                    }
                    
                    // Add click handler
                    dayElement.addEventListener('click', function() {
                        const selectedDate = new Date(year, month - 1, i);
                        loadDailyNote(selectedDate);
                    });
                    
                    calendarGrid.appendChild(dayElement);
                }
            })
            .catch(error => console.error('Error loading calendar data:', error));
    }
    
    /**
     * Load a daily note for a specific date
     */
    function loadDailyNote(date) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        fetch(`/api/daily/${year}/${month}/${day}`)
            .then(response => response.json())
            .then(data => {
                displayNote(data);
            })
            .catch(error => console.error('Error loading daily note:', error));
    }
    
    /**
     * Search for notes
     */
    function searchNotes(query) {
        fetch(`/api/search?q=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(data => {
                const searchResultsContainer = document.getElementById('search-results');
                searchResultsContainer.innerHTML = '';
                
                if (data.length === 0) {
                    searchResultsContainer.innerHTML = '<p class="text-muted">No results found</p>';
                    return;
                }
                
                data.forEach(note => {
                    const noteItem = document.createElement('div');
                    noteItem.className = 'note-item';
                    noteItem.textContent = note.title;
                    noteItem.dataset.id = note.id;
                    
                    noteItem.addEventListener('click', f
(Content truncated due to size limit. Use line ranges to read in chunks)