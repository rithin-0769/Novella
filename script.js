document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const journal = document.getElementById('journal');
    const journalCover = document.getElementById('journalCover');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const flipBtn = document.getElementById('flipBtn');
    const unflipBtn = document.getElementById('unflipBtn');
    const saveBtn = document.getElementById('saveBtn');
    const newPageBtn = document.getElementById('newPageBtn');
    const toggleLinesBtn = document.getElementById('toggleLinesBtn');
    const tagsBtn = document.getElementById('tagsBtn');
    const closeTagsBtn = document.getElementById('closeTagsBtn');
    const tagsPanel = document.getElementById('tagsPanel');
    const tagsInput = document.getElementById('tagsInput');
    const addTagsBtn = document.getElementById('addTagsBtn');
    const tagsList = document.getElementById('tagsList');
    const appliedTags = document.getElementById('appliedTags');
    const searchToggleBtn = document.getElementById('searchToggleBtn');
    const searchContainer = document.getElementById('searchContainer');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const closeSearchBtn = document.getElementById('closeSearchBtn');
    const searchResults = document.getElementById('searchResults');
    
    // App State
    let currentPageIndex = 0;
    let pages = [];
    let pageStyle = 'blank';
    let isAnimating = false;
    let allTags = new Set();
    let activeTags = new Set();
    
    // Initialize first page
    createNewPage();
    loadJournal();
    
    // Event Listeners
    journalCover.addEventListener('click', openJournal);
    prevBtn.addEventListener('click', goToPreviousPage);
    nextBtn.addEventListener('click', goToNextPage);
    flipBtn.addEventListener('click', flipCurrentPage);
    unflipBtn.addEventListener('click', flipCurrentPage);
    saveBtn.addEventListener('click', saveJournalWithFeedback);
    newPageBtn.addEventListener('click', createNewPage);
    toggleLinesBtn.addEventListener('click', togglePageStyle);
    tagsBtn.addEventListener('click', toggleTagsPanel);
    closeTagsBtn.addEventListener('click', toggleTagsPanel);
    addTagsBtn.addEventListener('click', addTagsToCurrentPage);
    searchToggleBtn.addEventListener('click', toggleSearchPanel);
    closeSearchBtn.addEventListener('click', toggleSearchPanel);
    searchBtn.addEventListener('click', performSearch);
    document.addEventListener('keydown', handleKeyboardShortcuts);
    tagsInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addTagsToCurrentPage();
    });
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') performSearch();
    });
    
    // Functions
    function openJournal() {
        journalCover.style.transform = 'rotateY(-180deg)';
        setTimeout(() => {
            journalCover.style.display = 'none';
        }, 1200);
    }
    
    function createNewPage() {
        if (isAnimating) return;
        
        const pageId = Date.now();
        const pageNumber = pages.length + 1;
        const now = new Date();
        const dateString = now.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        const pageContainer = document.createElement('div');
        pageContainer.className = 'page-container';
        pageContainer.dataset.id = pageId;
        
        const pageFront = document.createElement('div');
        pageFront.className = `page page-front ${pageStyle}`;
        pageFront.innerHTML = `
            <div class="page-header">
                <div class="page-date">${dateString}</div>
                <div class="page-number">Page ${pageNumber}</div>
            </div>
            <textarea class="page-content" placeholder="Begin your journal entry here..."></textarea>
            <div class="page-tags"></div>
        `;
        
        const pageBack = document.createElement('div');
        pageBack.className = `page page-back ${pageStyle}`;
        pageBack.innerHTML = `
            <div class="page-header">
                <div class="page-date">${dateString}</div>
                <div class="page-number">Page ${pageNumber} (Back)</div>
            </div>
            <textarea class="page-content" placeholder="Continue writing here..."></textarea>
            <div class="page-tags"></div>
        `;
        
        // Add input event listeners
        [pageFront, pageBack].forEach(page => {
            const textarea = page.querySelector('.page-content');
            textarea.addEventListener('input', () => {
                saveJournal();
                updateTagsForPage(pageId);
            });
        });
        
        pageContainer.appendChild(pageFront);
        pageContainer.appendChild(pageBack);
        journal.appendChild(pageContainer);
        
        pages.push({
            id: pageId,
            element: pageContainer,
            front: pageFront,
            back: pageBack,
            flipped: false,
            tags: new Set()
        });
        
        currentPageIndex = pages.length - 1;
        updatePageVisibility();
        saveJournal();
        
        setTimeout(() => {
            pageFront.querySelector('.page-content').focus();
        }, 100);
    }
    
    function flipCurrentPage() {
        if (isAnimating || pages.length === 0) return;
        
        const currentPage = pages[currentPageIndex];
        currentPage.flipped = !currentPage.flipped;
        
        isAnimating = true;
        currentPage.element.classList.add('flipping');
        currentPage.element.style.transform = currentPage.flipped ? 'rotateY(-180deg)' : 'rotateY(0deg)';
        
        flipBtn.style.display = currentPage.flipped ? 'none' : 'flex';
        unflipBtn.style.display = currentPage.flipped ? 'flex' : 'none';
        
        setTimeout(() => {
            isAnimating = false;
            const activeTextarea = currentPage.flipped 
                ? currentPage.back.querySelector('.page-content')
                : currentPage.front.querySelector('.page-content');
            activeTextarea.focus();
        }, 800);
        
        saveJournal();
    }
    
    function goToPreviousPage() {
        if (isAnimating) return;
        
        if (currentPageIndex > 0) {
            currentPageIndex--;
            updatePageVisibility();
        }
    }
    
    function goToNextPage() {
        if (isAnimating) return;
        
        if (currentPageIndex < pages.length - 1) {
            currentPageIndex++;
            updatePageVisibility();
        } else {
            createNewPage();
        }
    }
    
    function updatePageVisibility() {
        pages.forEach((page, index) => {
            if (index === currentPageIndex) {
                page.element.style.display = 'block';
                
                flipBtn.style.display = page.flipped ? 'none' : 'flex';
                unflipBtn.style.display = page.flipped ? 'flex' : 'none';
            } else {
                page.element.style.display = 'none';
            }
        });
    }
    
    function togglePageStyle() {
        const styles = ['blank', 'lines', 'grid'];
        const currentIndex = styles.indexOf(pageStyle);
        pageStyle = styles[(currentIndex + 1) % styles.length];
        
        pages.forEach(page => {
            page.front.classList.remove('blank', 'lines', 'grid');
            page.back.classList.remove('blank', 'lines', 'grid');
            page.front.classList.add(pageStyle);
            page.back.classList.add(pageStyle);
        });
        
        saveJournal();
    }
    
    function saveJournal() {
        const journalData = pages.map(page => ({
            id: page.id,
            frontContent: page.front.querySelector('.page-content').value,
            backContent: page.back.querySelector('.page-content').value,
            flipped: page.flipped,
            style: pageStyle,
            date: page.front.querySelector('.page-date').textContent,
            number: page.front.querySelector('.page-number').textContent,
            tags: Array.from(page.tags)
        }));
        localStorage.setItem('foliumJournal', JSON.stringify(journalData));
        
        // Update all tags
        updateAllTags();
    }
    
    function saveJournalWithFeedback() {
        saveJournal();
        showToast('Journal saved!');
        saveBtn.classList.add('active');
        setTimeout(() => saveBtn.classList.remove('active'), 300);
    }
    
    function loadJournal() {
        const savedData = localStorage.getItem('foliumJournal');
        if (savedData) {
            const journalData = JSON.parse(savedData);
            
            journal.innerHTML = '';
            pages = [];
            
            journalData.forEach((pageData, index) => {
                const pageContainer = document.createElement('div');
                pageContainer.className = 'page-container';
                pageContainer.dataset.id = pageData.id;
                
                if (pageData.flipped) {
                    pageContainer.style.transform = 'rotateY(-180deg)';
                }
                
                const pageFront = document.createElement('div');
                pageFront.className = `page page-front ${pageData.style}`;
                pageFront.innerHTML = `
                    <div class="page-header">
                        <div class="page-date">${pageData.date}</div>
                        <div class="page-number">${pageData.number}</div>
                    </div>
                    <textarea class="page-content">${pageData.frontContent}</textarea>
                    <div class="page-tags"></div>
                `;
                
                const pageBack = document.createElement('div');
                pageBack.className = `page page-back ${pageData.style}`;
                pageBack.innerHTML = `
                    <div class="page-header">
                        <div class="page-date">${pageData.date}</div>
                        <div class="page-number">${pageData.number} (Back)</div>
                    </div>
                    <textarea class="page-content">${pageData.backContent}</textarea>
                    <div class="page-tags"></div>
                `;
                
                // Add input event listeners
                [pageFront, pageBack].forEach(page => {
                    const textarea = page.querySelector('.page-content');
                    textarea.addEventListener('input', saveJournal);
                });
                
                pageContainer.appendChild(pageFront);
                pageContainer.appendChild(pageBack);
                journal.appendChild(pageContainer);
                
                const pageTags = new Set(pageData.tags || []);
                pages.push({
                    id: pageData.id,
                    element: pageContainer,
                    front: pageFront,
                    back: pageBack,
                    flipped: pageData.flipped,
                    tags: pageTags
                });
                
                // Update tags display
                updateTagsForPage(pageData.id);
            });
            
            currentPageIndex = journalData.length > 0 ? journalData.length - 1 : 0;
            pageStyle = journalData.length > 0 ? journalData[0].style : 'blank';
            updatePageVisibility();
            
            // Update all tags
            updateAllTags();
        }
    }
    
    function toggleTagsPanel() {
        tagsPanel.style.display = tagsPanel.style.display === 'flex' ? 'none' : 'flex';
        if (tagsPanel.style.display === 'flex') {
            renderTagsList();
            renderAppliedTags();
        }
    }
    
    function addTagsToCurrentPage() {
        if (pages.length === 0 || isAnimating) return;
        
        const currentPage = pages[currentPageIndex];
        const tagsText = tagsInput.value.trim();
        
        if (tagsText) {
            const newTags = tagsText.split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0);
            
            newTags.forEach(tag => {
                currentPage.tags.add(tag);
                allTags.add(tag);
            });
            
            updateTagsForPage(currentPage.id);
            tagsInput.value = '';
            saveJournal();
            renderTagsList();
            renderAppliedTags();
        }
    }
    
    function updateTagsForPage(pageId) {
        const page = pages.find(p => p.id == pageId);
        if (!page) return;
        
        const frontTagsContainer = page.front.querySelector('.page-tags');
        const backTagsContainer = page.back.querySelector('.page-tags');
        
        frontTagsContainer.innerHTML = '';
        backTagsContainer.innerHTML = '';
        
        page.tags.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = 'tag';
            tagElement.innerHTML = `
                ${tag}
                <span class="tag-remove" data-tag="${tag}">&times;</span>
            `;
            
            const frontTag = tagElement.cloneNode(true);
            const backTag = tagElement.cloneNode(true);
            
            frontTagsContainer.appendChild(frontTag);
            backTagsContainer.appendChild(backTag);
            
            // Add remove event listeners
            frontTag.querySelector('.tag-remove').addEventListener('click', (e) => {
                e.stopPropagation();
                removeTag(pageId, tag);
            });
            
            backTag.querySelector('.tag-remove').addEventListener('click', (e) => {
                e.stopPropagation();
                removeTag(pageId, tag);
            });
        });
    }
    
    function removeTag(pageId, tag) {
        const page = pages.find(p => p.id == pageId);
        if (page) {
            page.tags.delete(tag);
            updateTagsForPage(pageId);
            saveJournal();
            updateAllTags();
            renderTagsList();
            renderAppliedTags();
        }
    }
    
    function updateAllTags() {
        allTags = new Set();
        pages.forEach(page => {
            page.tags.forEach(tag => allTags.add(tag));
        });
    }
    
    function renderTagsList() {
        tagsList.innerHTML = '';
        Array.from(allTags).sort().forEach(tag => {
            const tagItem = document.createElement('span');
            tagItem.className = 'tag-item';
            if (activeTags.has(tag)) {
                tagItem.classList.add('selected');
            }
            tagItem.textContent = tag;
            tagItem.addEventListener('click', () => {
                if (activeTags.has(tag)) {
                    activeTags.delete(tag);
                    tagItem.classList.remove('selected');
                } else {
                    activeTags.add(tag);
                    tagItem.classList.add('selected');
                }
                filterPagesByTags();
                renderAppliedTags();
            });
            tagsList.appendChild(tagItem);
        });
    }
    
    function renderAppliedTags() {
        appliedTags.innerHTML = '';
        if (activeTags.size === 0) {
            appliedTags.innerHTML = '<p>No tags selected</p>';
            return;
        }
        
        const heading = document.createElement('p');
        heading.textContent = 'Filtering by:';
        appliedTags.appendChild(heading);
        
        Array.from(activeTags).forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = 'tag';
            tagElement.innerHTML = `
                ${tag}
                <span class="tag-remove" data-tag="${tag}">&times;</span>
            `;
            tagElement.querySelector('.tag-remove').addEventListener('click', (e) => {
                e.stopPropagation();
                activeTags.delete(tag);
                filterPagesByTags();
                renderTagsList();
                renderAppliedTags();
            });
            appliedTags.appendChild(tagElement);
        });
    }
    
    function filterPagesByTags() {
        if (activeTags.size === 0) {
            // Show all pages if no tags are selected
            pages.forEach(page => {
                page.element.style.display = 'none';
            });
            if (pages.length > 0) {
                currentPageIndex = Math.min(currentPageIndex, pages.length - 1);
                pages[currentPageIndex].element.style.display = 'block';
                flipBtn.style.display = pages[currentPageIndex].flipped ? 'none' : 'flex';
                unflipBtn.style.display = pages[currentPageIndex].flipped ? 'flex' : 'none';
            }
            return;
        }
        
        // Filter pages that have all active tags
        const filteredPages = pages.filter(page => {
            return Array.from(activeTags).every(tag => page.tags.has(tag));
        });
        
        // Update visibility
        pages.forEach(page => {
            page.element.style.display = 'none';
        });
        
        if (filteredPages.length > 0) {
            // Find the current page in filtered pages
            const currentInFiltered = filteredPages.findIndex(
                p => p.id === pages[currentPageIndex]?.id
            );
            
            currentPageIndex = currentInFiltered >= 0 
                ? currentInFiltered 
                : 0;
            
            filteredPages[currentPageIndex].element.style.display = 'block';
            flipBtn.style.display = filteredPages[currentPageIndex].flipped ? 'none' : 'flex';
            unflipBtn.style.display = filteredPages[currentPageIndex].flipped ? 'flex' : 'none';
        }
    }
    
    function toggleSearchPanel() {
        searchContainer.style.display = searchContainer.style.display === 'flex' ? 'none' : 'flex';
        if (searchContainer.style.display === 'flex') {
            searchInput.focus();
        } else {
            searchResults.innerHTML = '';
        }
    }
    
    function performSearch() {
        const query = searchInput.value.trim().toLowerCase();
        if (!query) return;
        
        searchResults.innerHTML = '';
        const results = [];
        
        pages.forEach((page, index) => {
            const frontContent = page.front.querySelector('.page-content').value.toLowerCase();
            const backContent = page.back.querySelector('.page-content').value.toLowerCase();
            const date = page.front.querySelector('.page-date').textContent.toLowerCase();
            
            if (frontContent.includes(query) || backContent.includes(query) || date.includes(query)) {
                results.push({
                    pageIndex: index,
                    pageId: page.id,
                    date: page.front.querySelector('.page-date').textContent,
                    content: frontContent.includes(query) 
                        ? frontContent.substring(
                            Math.max(0, frontContent.indexOf(query) - 50),
                            Math.min(frontContent.length, frontContent.indexOf(query) + 50)
                        ) 
                        : backContent.substring(
                            Math.max(0, backContent.indexOf(query) - 50),
                            Math.min(backContent.length, backContent.indexOf(query) + 50)
                        )
                });
            }
        });
        
        if (results.length === 0) {
            searchResults.innerHTML = '<p>No results found</p>';
            return;
        }
        
        results.forEach(result => {
            const resultItem = document.createElement('div');
            resultItem.className = 'search-result-item';
            resultItem.innerHTML = `
                <h4>${result.date}</h4>
                <p>...${result.content.replace(
                    new RegExp(query, 'gi'), 
                    match => `<strong>${match}</strong>`
                )}...</p>
            `;
            resultItem.addEventListener('click', () => {
                currentPageIndex = result.pageIndex;
                updatePageVisibility();
                toggleSearchPanel();
                const currentPage = pages[currentPageIndex];
                const textarea = currentPage.flipped 
                    ? currentPage.back.querySelector('.page-content')
                    : currentPage.front.querySelector('.page-content');
                textarea.focus();
            });
            searchResults.appendChild(resultItem);
        });
    }
    
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 500);
        }, 2000);
    }
    
});
