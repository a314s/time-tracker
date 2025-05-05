document.addEventListener('DOMContentLoaded', function() {
    // State management
    const state = {
        selectedDate: new Date(),
        currentMonth: new Date(),
        projects: [],
        entries: [],
        projectTotals: {}
    };

    // DOM elements
    const calendarEl = document.getElementById('calendar');
    const currentMonthEl = document.getElementById('currentMonth');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
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
    renderProjectTotals();

    // Event listeners
    prevMonthBtn.addEventListener('click', () => {
        state.currentMonth.setMonth(state.currentMonth.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        state.currentMonth.setMonth(state.currentMonth.getMonth() + 1);
        renderCalendar();
    });

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
        const startTime = startTimeInput.value;
        const endTime = endTimeInput.value;
        const timeSpent = parseInt(timeSpentInput.value);
        
        // Validation
        if (!project) {
            alert('Please enter a project name');
            return;
        }
        
        if ((!startTime || !endTime) && !timeSpent) {
            alert('Please enter either start and end times or time spent');
            return;
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
        
        // Calculate totals
        state.entries.forEach(entry => {
            if (!state.projectTotals[entry.project]) {
                state.projectTotals[entry.project] = 0;
            }
            state.projectTotals[entry.project] += entry.timeSpent;
        });
        
        // Render totals
        renderProjectTotals();
    }

    function renderProjectTotals() {
        projectTotalsEl.innerHTML = '';
        
        // Sort projects by total time (descending)
        const sortedProjects = Object.entries(state.projectTotals)
            .sort((a, b) => b[1] - a[1]);
        
        sortedProjects.forEach(([project, minutes]) => {
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            
            const totalEl = document.createElement('div');
            totalEl.classList.add('project-total-item');
            totalEl.innerHTML = `
                <span>${project}</span>
                <span>${hours}h ${remainingMinutes}m</span>
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
        
        // Sort by timestamp (newest first)
        filteredEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        filteredEntries.forEach(entry => {
            const entryEl = document.createElement('div');
            entryEl.classList.add('entry-item');
            
            let timeDisplay = '';
            if (entry.startTime && entry.endTime) {
                timeDisplay = `${entry.startTime} - ${entry.endTime}`;
            }
            
            entryEl.innerHTML = `
                <div class="entry-project">${entry.project}</div>
                <div class="entry-time">${timeDisplay}</div>
                <div class="entry-duration">${entry.timeSpent} minutes</div>
            `;
            
            entriesListEl.appendChild(entryEl);
        });
        
        // If no entries, show message
        if (filteredEntries.length === 0) {
            entriesListEl.innerHTML = '<p>No entries for this date</p>';
        }
    }

    function saveData() {
        localStorage.setItem('timeTrackerProjects', JSON.stringify(state.projects));
        localStorage.setItem('timeTrackerEntries', JSON.stringify(state.entries));
    }

    function loadData() {
        const savedProjects = localStorage.getItem('timeTrackerProjects');
        const savedEntries = localStorage.getItem('timeTrackerEntries');
        
        if (savedProjects) {
            state.projects = JSON.parse(savedProjects);
        }
        
        if (savedEntries) {
            state.entries = JSON.parse(savedEntries);
            updateProjectTotals();
        }
    }
});
