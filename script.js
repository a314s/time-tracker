document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('timeTrackerCurrentUser'));
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }
    
    // Display current user name
    document.getElementById('currentUserName').textContent = currentUser.name;
    
    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.removeItem('timeTrackerCurrentUser');
        window.location.href = 'login.html';
    });
    // State management
    const state = {
        selectedDate: new Date(),
        currentMonth: new Date(),
        projects: [],
        entries: [],
        projectTotals: {},
        activeTimers: {},
        userId: currentUser.id
    };

    // DOM elements
    const calendarEl = document.getElementById('calendar');
    const currentMonthEl = document.getElementById('currentMonth');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const exportMonthBtn = document.getElementById('exportMonth');
    const projectInput = document.getElementById('projectInput');
    const projectOptions = document.getElementById('projectOptions');
    const startTimeInput = document.getElementById('startTime');
    const endTimeInput = document.getElementById('endTime');
    const timeSpentInput = document.getElementById('timeSpent');
    const addEntryBtn = document.getElementById('addEntry');
    const entriesListEl = document.getElementById('entriesList');
    const timeEntriesEl = document.getElementById('timeEntries');
    const projectTotalsEl = document.getElementById('projectTotals');

    // Load saved data from localStorage
    loadData();

    // Initialize calendar and project options
    renderCalendar();
    updateProjectOptions();
    
    // Render entries for the current date
    renderEntries();
    
    // Update project totals to show the current date's data
    updateProjectTotals();

    // Event listeners
    prevMonthBtn.addEventListener('click', () => {
        state.currentMonth.setMonth(state.currentMonth.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        state.currentMonth.setMonth(state.currentMonth.getMonth() + 1);
        renderCalendar();
    });

    exportMonthBtn.addEventListener('click', exportMonthData);

    addEntryBtn.addEventListener('click', addTimeEntry);

    // Input validation and calculation
    startTimeInput.addEventListener('change', calculateDuration);
    endTimeInput.addEventListener('change', calculateDuration);
    timeSpentInput.addEventListener('input', () => {
        if (timeSpentInput.value) {
            startTimeInput.value = '';
            endTimeInput.value = '';
        }
    });

    // Functions
    function renderCalendar() {
        const year = state.currentMonth.getFullYear();
        const month = state.currentMonth.getMonth();
        
        // Update the month display
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
        currentMonthEl.textContent = `${monthNames[month]} ${year}`;
        
        // Clear the calendar
        calendarEl.innerHTML = '';
        
        // Get the first day of the month
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // Get the day of the week for the first day (0 = Sunday, 6 = Saturday)
        const firstDayIndex = firstDay.getDay();
        
        // Get the number of days in the month
        const daysInMonth = lastDay.getDate();
        
        // Get the day of the week for the last day
        const lastDayIndex = lastDay.getDay();
        
        // Calculate days from previous month to display
        const prevMonthDays = firstDayIndex;
        
        // Calculate days from next month to display
        const nextMonthDays = 6 - lastDayIndex;
        
        // Get the last day of the previous month
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        
        // Create calendar days
        
        // Previous month days
        for (let i = prevMonthDays; i > 0; i--) {
            const dayEl = document.createElement('div');
            dayEl.classList.add('calendar-day', 'other-month');
            dayEl.textContent = prevMonthLastDay - i + 1;
            
            // Add data attributes for the date
            const prevMonth = month === 0 ? 11 : month - 1;
            const prevYear = month === 0 ? year - 1 : year;
            dayEl.dataset.date = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(prevMonthLastDay - i + 1).padStart(2, '0')}`;
            
            dayEl.addEventListener('click', selectDate);
            calendarEl.appendChild(dayEl);
        }
        
        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            const dayEl = document.createElement('div');
            dayEl.classList.add('calendar-day');
            dayEl.textContent = i;
            
            // Add data attributes for the date
            dayEl.dataset.date = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            
            // Check if this day is today
            const today = new Date();
            if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayEl.classList.add('today');
            }
            
            // Check if this day is selected
            if (i === state.selectedDate.getDate() && month === state.selectedDate.getMonth() && year === state.selectedDate.getFullYear()) {
                dayEl.classList.add('selected');
            }
            
            dayEl.addEventListener('click', selectDate);
            calendarEl.appendChild(dayEl);
        }
        
        // Next month days
        for (let i = 1; i <= nextMonthDays; i++) {
            const dayEl = document.createElement('div');
            dayEl.classList.add('calendar-day', 'other-month');
            dayEl.textContent = i;
            
            // Add data attributes for the date
            const nextMonth = month === 11 ? 0 : month + 1;
            const nextYear = month === 11 ? year + 1 : year;
            dayEl.dataset.date = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            
            dayEl.addEventListener('click', selectDate);
            calendarEl.appendChild(dayEl);
        }
    }

    function selectDate(e) {
        // Remove selected class from all days
        document.querySelectorAll('.calendar-day').forEach(day => {
            day.classList.remove('selected');
        });
        
        // Add selected class to clicked day
        e.target.classList.add('selected');
        
        // Update selected date
        const [year, month, day] = e.target.dataset.date.split('-').map(Number);
        state.selectedDate = new Date(year, month - 1, day);
        
        // If the selected date is in a different month, update the calendar
        if (state.selectedDate.getMonth() !== state.currentMonth.getMonth() || 
            state.selectedDate.getFullYear() !== state.currentMonth.getFullYear()) {
            state.currentMonth = new Date(year, month - 1, 1);
            renderCalendar();
        }
        
        // Update project totals for the selected date
        updateProjectTotals();
        
        // Filter entries for the selected date
        renderEntries();
    }

    function calculateDuration() {
        if (startTimeInput.value && endTimeInput.value) {
            const start = new Date(`2000-01-01T${startTimeInput.value}`);
            const end = new Date(`2000-01-01T${endTimeInput.value}`);
            
            // Handle overnight shifts
            let diff = end - start;
            if (diff < 0) {
                diff += 24 * 60 * 60 * 1000; // Add 24 hours
            }
            
            const minutes = Math.floor(diff / 60000);
            timeSpentInput.value = minutes;
        }
    }

    function addTimeEntry() {
        const project = projectInput.value.trim();
        let startTime = startTimeInput.value;
        let endTime = endTimeInput.value;
        let timeSpent = parseInt(timeSpentInput.value);
        
        // Validation
        if (!project) {
            alert('Please enter a project name');
            return;
        }
        
        if ((!startTime || !endTime) && !timeSpent) {
            alert('Please enter either start and end times or time spent');
            return;
        }
        
        // If only time spent is provided, calculate start and end times
        if (timeSpent && (!startTime || !endTime)) {
            // Use current time as end time
            const now = new Date();
            endTime = now.toTimeString().substring(0, 5); // Format as HH:MM
            
            // Calculate start time by subtracting timeSpent minutes from now
            const startDate = new Date(now.getTime() - timeSpent * 60000);
            startTime = startDate.toTimeString().substring(0, 5); // Format as HH:MM
            
            // Update the input fields to show the calculated times
            startTimeInput.value = startTime;
            endTimeInput.value = endTime;
        } else if (startTime && endTime) {
            // If start and end times are provided, ensure timeSpent is calculated
            if (!timeSpent) {
                const start = new Date(`2000-01-01T${startTime}`);
                const end = new Date(`2000-01-01T${endTime}`);
                
                // Handle overnight shifts
                let diff = end - start;
                if (diff < 0) {
                    diff += 24 * 60 * 60 * 1000; // Add 24 hours
                }
                
                timeSpent = Math.floor(diff / 60000);
                timeSpentInput.value = timeSpent;
            }
        }
        
        // Create entry object
        const entry = {
            id: Date.now(),
            project,
            date: state.selectedDate.toISOString().split('T')[0],
            startTime,
            endTime,
            timeSpent: timeSpent || 0, // Default to 0 if not provided
            timestamp: new Date().toISOString()
        };
        
        // Add to state
        state.entries.push(entry);
        
        // Add project to list if it's new
        if (!state.projects.includes(project)) {
            state.projects.unshift(project);
            updateProjectOptions();
        } else {
            // Move project to the top of the list
            state.projects = state.projects.filter(p => p !== project);
            state.projects.unshift(project);
            updateProjectOptions();
        }
        
        // Update project totals
        updateProjectTotals();
        
        // Save data
        saveData();
        
        // Display summary and create new form
        displaySummary(entry);
        
        // Clear form
        clearForm();
        
        // Render entries for the selected date
        renderEntries();
    }

    function displaySummary(entry) {
        const summaryEl = document.createElement('div');
        summaryEl.classList.add('time-entry-summary');
        
        let timeDisplay = '';
        if (entry.startTime && entry.endTime) {
            timeDisplay = `${entry.startTime} - ${entry.endTime}`;
        }
        
        summaryEl.innerHTML = `
            <div class="summary-project">${entry.project}</div>
            <div class="summary-details">
                <span>${timeDisplay}</span>
                <span>${entry.timeSpent} minutes</span>
            </div>
        `;
        
        // Insert before the form
        timeEntriesEl.insertBefore(summaryEl, document.getElementById('entryForm'));
        
        // Remove after 5 seconds
        setTimeout(() => {
            summaryEl.remove();
        }, 5000);
    }

    function clearForm() {
        projectInput.value = '';
        startTimeInput.value = '';
        endTimeInput.value = '';
        timeSpentInput.value = '';
    }

    function updateProjectOptions() {
        // Clear existing options
        projectOptions.innerHTML = '';
        
        // Add options from state
        state.projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project;
            projectOptions.appendChild(option);
        });
    }

    function updateProjectTotals() {
        // Reset totals
        state.projectTotals = {};
        
        // Get selected date string
        const selectedDateString = state.selectedDate.toISOString().split('T')[0];
        
        // Track last worked time for each project
        const lastWorkedTime = {};
        
        // Calculate totals
        state.entries.forEach(entry => {
            if (!state.projectTotals[entry.project]) {
                state.projectTotals[entry.project] = {
                    total: 0,
                    selectedDay: 0,
                    lastWorked: null
                };
            }
            
            // Add to total time
            state.projectTotals[entry.project].total += entry.timeSpent;
            
            // Add to selected day's time if entry is from selected date
            if (entry.date === selectedDateString) {
                state.projectTotals[entry.project].selectedDay += entry.timeSpent;
            }
            
            // Update last worked time if this entry is more recent
            const entryTime = new Date(entry.timestamp).getTime();
            if (!lastWorkedTime[entry.project] || entryTime > lastWorkedTime[entry.project]) {
                lastWorkedTime[entry.project] = entryTime;
                state.projectTotals[entry.project].lastWorked = entry.timestamp;
            }
        });
        
        // Render totals
        renderProjectTotals();
    }

    function renderProjectTotals() {
        projectTotalsEl.innerHTML = '';
        
        // Get formatted date for the selected day
        const selectedDate = state.selectedDate;
        const formattedDate = selectedDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
        
        // Add header row
        const headerEl = document.createElement('div');
        headerEl.classList.add('project-total-header');
        headerEl.innerHTML = `
            <span>Project</span>
            <span>${formattedDate}</span>
            <span>Total</span>
        `;
        projectTotalsEl.appendChild(headerEl);
        
        // Sort projects by last worked time (most recent first)
        const sortedProjects = Object.entries(state.projectTotals)
            .sort((a, b) => {
                // If either project has no last worked time, sort by total time
                if (!a[1].lastWorked || !b[1].lastWorked) {
                    return b[1].total - a[1].total;
                }
                // Otherwise sort by last worked time (most recent first)
                return new Date(b[1].lastWorked) - new Date(a[1].lastWorked);
            });
        
        sortedProjects.forEach(([project, data]) => {
            // Format total time
            const totalHours = Math.floor(data.total / 60);
            const totalMinutes = data.total % 60;
            const totalFormatted = `${totalHours}h ${totalMinutes}m`;
            
            // Format selected day's time
            const selectedDayHours = Math.floor(data.selectedDay / 60);
            const selectedDayMinutes = data.selectedDay % 60;
            const selectedDayFormatted = data.selectedDay > 0 ? `${selectedDayHours}h ${selectedDayMinutes}m` : '-';
            
            const totalEl = document.createElement('div');
            totalEl.classList.add('project-total-item');
            totalEl.innerHTML = `
                <span class="project-name" title="${project}">${project}</span>
                <span class="selected-day-time">${selectedDayFormatted}</span>
                <span class="total-time">${totalFormatted}</span>
            `;
            
            projectTotalsEl.appendChild(totalEl);
        });
        
        // If no projects, show message
        if (sortedProjects.length === 0) {
            projectTotalsEl.innerHTML = '<p>No projects yet</p>';
        }
    }

    function renderEntries() {
        entriesListEl.innerHTML = '';
        
        // Filter entries for selected date
        const dateString = state.selectedDate.toISOString().split('T')[0];
        const filteredEntries = state.entries.filter(entry => entry.date === dateString);
        
        // If no entries, show message
        if (filteredEntries.length === 0) {
            entriesListEl.innerHTML = '<p>No entries for this date</p>';
            return;
        }
        
        // Group entries by project
        const entriesByProject = {};
        filteredEntries.forEach(entry => {
            if (!entriesByProject[entry.project]) {
                entriesByProject[entry.project] = [];
            }
            entriesByProject[entry.project].push(entry);
        });
        
        // Sort projects alphabetically
        const sortedProjects = Object.keys(entriesByProject).sort();
        
        // Create project groups
        sortedProjects.forEach(projectName => {
            const projectEntries = entriesByProject[projectName];
            
            // Sort entries by timestamp (newest first)
            projectEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            // Create project group container
            const projectGroupEl = document.createElement('div');
            projectGroupEl.classList.add('project-group');
            projectGroupEl.dataset.project = projectName;
            
            // Create project header
            const projectHeaderEl = document.createElement('div');
            projectHeaderEl.classList.add('project-group-header');
            
            // Project name
            const projectNameEl = document.createElement('div');
            projectNameEl.classList.add('project-name');
            projectNameEl.textContent = projectName;
            projectHeaderEl.appendChild(projectNameEl);
            
            // Timer controls
            const timerControlsEl = document.createElement('div');
            timerControlsEl.classList.add('timer-controls');
            
            // Timer display
            const timerDisplayEl = document.createElement('div');
            timerDisplayEl.classList.add('timer-display');
            timerDisplayEl.id = `timer-${projectName.replace(/\s+/g, '-')}`;
            timerDisplayEl.textContent = '00:00:00';
            
            // Check if timer is active
            if (state.activeTimers[projectName]) {
                timerDisplayEl.classList.add('timer-active');
                updateTimerDisplay(projectName);
            }
            
            timerControlsEl.appendChild(timerDisplayEl);
            
            // Start button
            const startBtn = document.createElement('button');
            startBtn.classList.add('timer-btn', 'start-btn');
            startBtn.textContent = 'Start';
            startBtn.addEventListener('click', () => startTimer(projectName));
            timerControlsEl.appendChild(startBtn);
            
            // Finish button
            const finishBtn = document.createElement('button');
            finishBtn.classList.add('timer-btn', 'finish-btn');
            finishBtn.textContent = 'Finish';
            finishBtn.addEventListener('click', () => finishTimer(projectName));
            timerControlsEl.appendChild(finishBtn);
            
            projectHeaderEl.appendChild(timerControlsEl);
            projectGroupEl.appendChild(projectHeaderEl);
            
            // Create entries container
            const projectEntriesEl = document.createElement('div');
            projectEntriesEl.classList.add('project-entries');
            
            // Add each entry
            projectEntries.forEach(entry => {
                const entryEl = document.createElement('div');
                entryEl.classList.add('entry-item');
                entryEl.dataset.entryId = entry.id;
                
                let timeDisplay = '';
                if (entry.startTime && entry.endTime) {
                    timeDisplay = `${entry.startTime} - ${entry.endTime}`;
                }
                
                entryEl.innerHTML = `
                    <div class="entry-time">${timeDisplay}</div>
                    <div class="entry-duration">${entry.timeSpent} minutes</div>
                    <div class="entry-actions">
                        <button class="edit-entry-btn">Edit</button>
                        <button class="delete-entry-btn">Delete</button>
                    </div>
                `;
                
                // Add event listeners for edit and delete buttons
                projectEntriesEl.appendChild(entryEl);
                
                // Add event listeners after appending to DOM
                const editBtn = entryEl.querySelector('.edit-entry-btn');
                const deleteBtn = entryEl.querySelector('.delete-entry-btn');
                
                editBtn.addEventListener('click', () => editEntry(entry.id));
                deleteBtn.addEventListener('click', () => deleteEntry(entry.id));
            });
            
            projectGroupEl.appendChild(projectEntriesEl);
            entriesListEl.appendChild(projectGroupEl);
        });
    }

    function saveData() {
        // Get all user data
        const allUserData = JSON.parse(localStorage.getItem('timeTrackerAllData') || '{}');
        
        // Update current user's data
        allUserData[state.userId] = {
            projects: state.projects,
            entries: state.entries
        };
        
        // Save all data back to localStorage
        localStorage.setItem('timeTrackerAllData', JSON.stringify(allUserData));
        saveTimerState();
    }

    function loadData() {
        // Get all user data
        const allUserData = JSON.parse(localStorage.getItem('timeTrackerAllData') || '{}');
        
        // Get current user's data
        const userData = allUserData[state.userId] || { projects: [], entries: [] };
        
        state.projects = userData.projects || [];
        state.entries = userData.entries || [];
        updateProjectTotals();
        
        // Load active timers for current user
        const allTimers = JSON.parse(localStorage.getItem('timeTrackerAllTimers') || '{}');
        const savedTimers = allTimers[state.userId] || {};
        
        if (Object.keys(savedTimers).length > 0) {
            state.activeTimers = savedTimers;
            
            // Restart timers that were active
            Object.keys(state.activeTimers).forEach(project => {
                if (state.activeTimers[project].isRunning) {
                    // Calculate elapsed time since last save
                    const lastTimestamp = new Date(state.activeTimers[project].lastUpdated);
                    const now = new Date();
                    const elapsedSeconds = Math.floor((now - lastTimestamp) / 1000);
                    
                    // Add elapsed time to the timer
                    state.activeTimers[project].elapsedSeconds += elapsedSeconds;
                    state.activeTimers[project].lastUpdated = now.toISOString();
                }
            });
        }
    }

    // Timer functions
    function startTimer(projectName) {
        // Check if any other timer is running and finish it first
        Object.keys(state.activeTimers).forEach(project => {
            if (project !== projectName && state.activeTimers[project].isRunning) {
                finishTimer(project);
            }
        });
        
        // If timer already exists, resume it
        if (state.activeTimers[projectName]) {
            if (!state.activeTimers[projectName].isRunning) {
                state.activeTimers[projectName].isRunning = true;
                state.activeTimers[projectName].lastUpdated = new Date().toISOString();
            }
        } else {
            // Create new timer
            state.activeTimers[projectName] = {
                startTime: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                elapsedSeconds: 0,
                isRunning: true
            };
        }
        
        // Add active class to timer display
        const timerDisplay = document.getElementById(`timer-${projectName.replace(/\s+/g, '-')}`);
        if (timerDisplay) {
            timerDisplay.classList.add('timer-active');
        }
        
        // Start updating the display
        updateTimerDisplay(projectName);
        
        // Save timer state
        saveTimerState();
    }
    
    function pauseTimer(projectName) {
        if (state.activeTimers[projectName] && state.activeTimers[projectName].isRunning) {
            // Calculate elapsed time
            const lastUpdate = new Date(state.activeTimers[projectName].lastUpdated);
            const now = new Date();
            const elapsedSeconds = Math.floor((now - lastUpdate) / 1000);
            
            // Update timer
            state.activeTimers[projectName].elapsedSeconds += elapsedSeconds;
            state.activeTimers[projectName].lastUpdated = now.toISOString();
            state.activeTimers[projectName].isRunning = false;
            
            // Remove active class from timer display
            const timerDisplay = document.getElementById(`timer-${projectName.replace(/\s+/g, '-')}`);
            if (timerDisplay) {
                timerDisplay.classList.remove('timer-active');
            }
            
            // Update display one last time
            updateTimerDisplay(projectName);
            
            // Save timer state
            saveTimerState();
        }
    }
    
    function finishTimer(projectName) {
        if (state.activeTimers[projectName]) {
            // If timer is running, pause it first to calculate final time
            if (state.activeTimers[projectName].isRunning) {
                pauseTimer(projectName);
            }
            
            // Calculate total minutes
            const totalMinutes = Math.ceil(state.activeTimers[projectName].elapsedSeconds / 60);
            
            if (totalMinutes > 0) {
                // Create a new entry
                const now = new Date();
                const endTime = now.toTimeString().substring(0, 5); // Format as HH:MM
                
                // Calculate start time by subtracting elapsed time
                const startDate = new Date(now.getTime() - (totalMinutes * 60000));
                const startTime = startDate.toTimeString().substring(0, 5); // Format as HH:MM
                
                const entry = {
                    id: Date.now(),
                    project: projectName,
                    date: state.selectedDate.toISOString().split('T')[0],
                    startTime,
                    endTime,
                    timeSpent: totalMinutes,
                    timestamp: new Date().toISOString()
                };
                
                // Add to entries
                state.entries.push(entry);
                
                // Update project totals
                updateProjectTotals();
                
                // Save data
                saveData();
                
                // Re-render entries
                renderEntries();
            }
            
            // Remove the timer
            delete state.activeTimers[projectName];
            saveTimerState();
        }
    }
    
    function updateTimerDisplay(projectName) {
        const timerDisplay = document.getElementById(`timer-${projectName.replace(/\s+/g, '-')}`);
        if (!timerDisplay || !state.activeTimers[projectName]) return;
        
        let seconds = state.activeTimers[projectName].elapsedSeconds;
        
        // If timer is running, add the time since last update
        if (state.activeTimers[projectName].isRunning) {
            const lastUpdate = new Date(state.activeTimers[projectName].lastUpdated);
            const now = new Date();
            const additionalSeconds = Math.floor((now - lastUpdate) / 1000);
            seconds += additionalSeconds;
        }
        
        // Format and display the time
        timerDisplay.textContent = formatTime(seconds);
        
        // If timer is running, schedule the next update
        if (state.activeTimers[projectName].isRunning) {
            setTimeout(() => updateTimerDisplay(projectName), 1000);
        }
    }
    
    function formatTime(totalSeconds) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        return [
            hours.toString().padStart(2, '0'),
            minutes.toString().padStart(2, '0'),
            seconds.toString().padStart(2, '0')
        ].join(':');
    }
    
    function saveTimerState() {
        // Get all timers
        const allTimers = JSON.parse(localStorage.getItem('timeTrackerAllTimers') || '{}');
        
        // Update current user's timers
        allTimers[state.userId] = state.activeTimers;
        
        // Save all timers back to localStorage
        localStorage.setItem('timeTrackerAllTimers', JSON.stringify(allTimers));
    }
    
    // Edit and Delete Entry Functions
    function editEntry(entryId) {
        // Find the entry to edit
        const entry = state.entries.find(entry => entry.id === entryId);
        if (!entry) return;
        
        // Create and show edit form
        createEditForm(entry);
    }
    
    function deleteEntry(entryId) {
        // Confirm deletion
        if (!confirm('Are you sure you want to delete this entry?')) return;
        
        // Find the entry index
        const entryIndex = state.entries.findIndex(entry => entry.id === entryId);
        if (entryIndex === -1) return;
        
        // Remove the entry
        state.entries.splice(entryIndex, 1);
        
        // Update project totals
        updateProjectTotals();
        
        // Save data
        saveData();
        
        // Re-render entries
        renderEntries();
    }
    
    function createEditForm(entry) {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.classList.add('overlay');
        document.body.appendChild(overlay);
        
        // Create form container
        const formContainer = document.createElement('div');
        formContainer.classList.add('edit-form');
        
        // Form header
        const formHeader = document.createElement('div');
        formHeader.classList.add('edit-form-header');
        formHeader.innerHTML = `
            <div class="edit-form-title">Edit Time Entry</div>
            <button class="close-edit-form">&times;</button>
        `;
        
        // Form inputs
        const formInputs = document.createElement('div');
        formInputs.classList.add('edit-form-inputs');
        
        // Project input
        const projectField = document.createElement('div');
        projectField.classList.add('time-field');
        projectField.innerHTML = `
            <label for="edit-project">Project:</label>
            <input type="text" id="edit-project" value="${entry.project}" list="projectOptions">
        `;
        
        // Time inputs
        const timeInputs = document.createElement('div');
        timeInputs.classList.add('time-inputs');
        
        // Start time
        const startTimeField = document.createElement('div');
        startTimeField.classList.add('time-field');
        startTimeField.innerHTML = `
            <label for="edit-start-time">Start Time:</label>
            <input type="time" id="edit-start-time" value="${entry.startTime || ''}">
        `;
        
        // End time
        const endTimeField = document.createElement('div');
        endTimeField.classList.add('time-field');
        endTimeField.innerHTML = `
            <label for="edit-end-time">End Time:</label>
            <input type="time" id="edit-end-time" value="${entry.endTime || ''}">
        `;
        
        // Time spent
        const timeSpentField = document.createElement('div');
        timeSpentField.classList.add('time-field');
        timeSpentField.innerHTML = `
            <label for="edit-time-spent">Time Spent (minutes):</label>
            <input type="number" id="edit-time-spent" value="${entry.timeSpent}" min="0">
        `;
        
        // Add time inputs to form
        timeInputs.appendChild(startTimeField);
        timeInputs.appendChild(endTimeField);
        timeInputs.appendChild(timeSpentField);
        
        // Form actions
        const formActions = document.createElement('div');
        formActions.classList.add('edit-form-actions');
        formActions.innerHTML = `
            <button class="cancel-edit-btn">Cancel</button>
            <button class="save-edit-btn">Save Changes</button>
        `;
        
        // Build form
        formInputs.appendChild(projectField);
        formInputs.appendChild(timeInputs);
        
        formContainer.appendChild(formHeader);
        formContainer.appendChild(formInputs);
        formContainer.appendChild(formActions);
        
        document.body.appendChild(formContainer);
        
        // Get form elements
        const closeBtn = formContainer.querySelector('.close-edit-form');
        const cancelBtn = formContainer.querySelector('.cancel-edit-btn');
        const saveBtn = formContainer.querySelector('.save-edit-btn');
        const projectInput = formContainer.querySelector('#edit-project');
        const startTimeInput = formContainer.querySelector('#edit-start-time');
        const endTimeInput = formContainer.querySelector('#edit-end-time');
        const timeSpentInput = formContainer.querySelector('#edit-time-spent');
        
        // Add event listeners for time calculation
        startTimeInput.addEventListener('change', () => {
            if (startTimeInput.value && endTimeInput.value) {
                const start = new Date(`2000-01-01T${startTimeInput.value}`);
                const end = new Date(`2000-01-01T${endTimeInput.value}`);
                
                // Handle overnight shifts
                let diff = end - start;
                if (diff < 0) {
                    diff += 24 * 60 * 60 * 1000; // Add 24 hours
                }
                
                const minutes = Math.floor(diff / 60000);
                timeSpentInput.value = minutes;
            }
        });
        
        endTimeInput.addEventListener('change', () => {
            if (startTimeInput.value && endTimeInput.value) {
                const start = new Date(`2000-01-01T${startTimeInput.value}`);
                const end = new Date(`2000-01-01T${endTimeInput.value}`);
                
                // Handle overnight shifts
                let diff = end - start;
                if (diff < 0) {
                    diff += 24 * 60 * 60 * 1000; // Add 24 hours
                }
                
                const minutes = Math.floor(diff / 60000);
                timeSpentInput.value = minutes;
            }
        });
        
        timeSpentInput.addEventListener('input', () => {
            if (timeSpentInput.value) {
                // Clear start and end times if user manually edits time spent
                if (document.activeElement === timeSpentInput) {
                    startTimeInput.value = '';
                    endTimeInput.value = '';
                }
            }
        });
        
        // Close form function
        const closeForm = () => {
            document.body.removeChild(overlay);
            document.body.removeChild(formContainer);
        };
        
        // Add event listeners
        closeBtn.addEventListener('click', closeForm);
        cancelBtn.addEventListener('click', closeForm);
        
        saveBtn.addEventListener('click', () => {
            // Validate form
            const project = projectInput.value.trim();
            const startTime = startTimeInput.value;
            const endTime = endTimeInput.value;
            const timeSpent = parseInt(timeSpentInput.value);
            
            if (!project) {
                alert('Please enter a project name');
                return;
            }
            
            if ((!startTime || !endTime) && !timeSpent) {
                alert('Please enter either start and end times or time spent');
                return;
            }
            
            // If only time spent is provided, calculate start and end times
            let updatedStartTime = startTime;
            let updatedEndTime = endTime;
            let updatedTimeSpent = timeSpent;
            
            if (timeSpent && (!startTime || !endTime)) {
                // Use current time as end time
                const now = new Date();
                updatedEndTime = now.toTimeString().substring(0, 5); // Format as HH:MM
                
                // Calculate start time by subtracting timeSpent minutes from now
                const startDate = new Date(now.getTime() - timeSpent * 60000);
                updatedStartTime = startDate.toTimeString().substring(0, 5); // Format as HH:MM
            } else if (startTime && endTime && !timeSpent) {
                // Calculate time spent from start and end times
                const start = new Date(`2000-01-01T${startTime}`);
                const end = new Date(`2000-01-01T${endTime}`);
                
                // Handle overnight shifts
                let diff = end - start;
                if (diff < 0) {
                    diff += 24 * 60 * 60 * 1000; // Add 24 hours
                }
                
                updatedTimeSpent = Math.floor(diff / 60000);
            }
            
            // Update entry
            const entryIndex = state.entries.findIndex(e => e.id === entry.id);
            if (entryIndex !== -1) {
                // Update project in projects list if it's new
                if (!state.projects.includes(project)) {
                    state.projects.unshift(project);
                    updateProjectOptions();
                } else if (project !== entry.project) {
                    // Move project to top if it's different from original
                    state.projects = state.projects.filter(p => p !== project);
                    state.projects.unshift(project);
                    updateProjectOptions();
                }
                
                // Update the entry
                state.entries[entryIndex] = {
                    ...entry,
                    project,
                    startTime: updatedStartTime,
                    endTime: updatedEndTime,
                    timeSpent: updatedTimeSpent
                };
                
                // Update project totals
                updateProjectTotals();
                
                // Save data
                saveData();
                
                // Re-render entries
                renderEntries();
            }
            
            // Close the form
            closeForm();
        });
    }
    
    function exportMonthData() {
        // Get current month and year
        const year = state.currentMonth.getFullYear();
        const month = state.currentMonth.getMonth();
        const monthName = new Date(year, month, 1).toLocaleString('default', { month: 'long' });
        
        // Filter entries for the current month
        const monthEntries = state.entries.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate.getMonth() === month && entryDate.getFullYear() === year;
        });
        
        // Group entries by date
        const entriesByDate = {};
        monthEntries.forEach(entry => {
            if (!entriesByDate[entry.date]) {
                entriesByDate[entry.date] = [];
            }
            entriesByDate[entry.date].push(entry);
        });
        
        // Calculate project totals for the month
        const monthProjectTotals = {};
        monthEntries.forEach(entry => {
            if (!monthProjectTotals[entry.project]) {
                monthProjectTotals[entry.project] = 0;
            }
            monthProjectTotals[entry.project] += entry.timeSpent;
        });
        
        // Format project totals
        const formattedProjectTotals = Object.entries(monthProjectTotals)
            .sort((a, b) => b[1] - a[1])
            .map(([project, minutes]) => {
                const hours = Math.floor(minutes / 60);
                const remainingMinutes = minutes % 60;
                return `${project}: ${hours}h ${remainingMinutes}m`;
            })
            .join('\n');
        
        // Format entries by date
        let formattedEntries = '';
        const sortedDates = Object.keys(entriesByDate).sort();
        
        sortedDates.forEach(date => {
            const formattedDate = new Date(date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            formattedEntries += `\n\n${formattedDate}\n`;
            formattedEntries += '------------------------------\n';
            
            entriesByDate[date].forEach(entry => {
                let timeInfo = '';
                if (entry.startTime && entry.endTime) {
                    timeInfo = `${entry.startTime} - ${entry.endTime}`;
                }
                
                formattedEntries += `${entry.project} (${entry.timeSpent} minutes)`;
                if (timeInfo) {
                    formattedEntries += ` [${timeInfo}]`;
                }
                formattedEntries += '\n';
            });
        });
        
        // Create the full export content
        const exportContent = `# Time Tracking Report: ${monthName} ${year}\n\n` +
            `## Project Totals\n\n${formattedProjectTotals || 'No entries for this month.'}\n\n` +
            `## Daily Entries${formattedEntries || '\n\nNo entries for this month.'}`;
        
        // Create a Blob and download link
        const blob = new Blob([exportContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        // Create a temporary link and trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = `TimeTracker_${monthName}_${year}.txt`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }
});
