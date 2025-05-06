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
    
    // DOM elements
    const userViewBtn = document.getElementById('userViewBtn');
    const projectViewBtn = document.getElementById('projectViewBtn');
    const thisMonthBtn = document.getElementById('thisMonthBtn');
    const lastMonthBtn = document.getElementById('lastMonthBtn');
    const thisYearBtn = document.getElementById('thisYearBtn');
    const projectSelector = document.getElementById('projectSelector');
    const projectSelect = document.getElementById('projectSelect');
    const userView = document.getElementById('userView');
    const projectView = document.getElementById('projectView');
    const noDataView = document.getElementById('noDataView');
    const currentPeriod = document.getElementById('currentPeriod');
    const projectPeriod = document.getElementById('projectPeriod');
    
    // Chart instances
    let projectDistributionChart = null;
    let dailyTimeChart = null;
    let teamContributionChart = null;
    let projectDailyChart = null;
    
    // State management
    const state = {
        userId: currentUser.id,
        viewMode: 'user', // 'user' or 'project'
        timeRange: 'thisMonth', // 'thisMonth', 'lastMonth', 'thisYear'
        selectedProjectId: null,
        entries: [],
        projects: [],
        users: [],
        startDate: null,
        endDate: null
    };
    
    // Initialize
    loadData();
    updateTimeRange();
    populateProjectSelect();
    renderMetrics();
    
    // Event listeners
    userViewBtn.addEventListener('click', () => {
        setViewMode('user');
    });
    
    projectViewBtn.addEventListener('click', () => {
        setViewMode('project');
    });
    
    thisMonthBtn.addEventListener('click', () => {
        setTimeRange('thisMonth');
    });
    
    lastMonthBtn.addEventListener('click', () => {
        setTimeRange('lastMonth');
    });
    
    thisYearBtn.addEventListener('click', () => {
        setTimeRange('thisYear');
    });
    
    projectSelect.addEventListener('change', () => {
        state.selectedProjectId = projectSelect.value;
        renderMetrics();
    });
    
    // Functions
    function loadData() {
        // Load all user data
        const allUserData = JSON.parse(localStorage.getItem('timeTrackerAllData') || '{}');
        
        // Get all users
        const users = JSON.parse(localStorage.getItem('timeTrackerUsers') || '[]');
        state.users = users;
        
        // Load projects
        const projects = JSON.parse(localStorage.getItem('timeTrackerProjects') || '[]');
        state.projects = projects;
        
        // Collect all entries from all users
        state.entries = [];
        Object.keys(allUserData).forEach(userId => {
            const userData = allUserData[userId];
            if (userData.entries && Array.isArray(userData.entries)) {
                // Add user ID to each entry
                const userEntries = userData.entries.map(entry => ({
                    ...entry,
                    userId
                }));
                state.entries = [...state.entries, ...userEntries];
            }
        });
    }
    
    function updateTimeRange() {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        
        switch (state.timeRange) {
            case 'thisMonth':
                state.startDate = new Date(currentYear, currentMonth, 1);
                state.endDate = new Date(currentYear, currentMonth + 1, 0);
                currentPeriod.textContent = formatMonthYear(state.startDate);
                projectPeriod.textContent = formatMonthYear(state.startDate);
                break;
                
            case 'lastMonth':
                state.startDate = new Date(currentYear, currentMonth - 1, 1);
                state.endDate = new Date(currentYear, currentMonth, 0);
                currentPeriod.textContent = formatMonthYear(state.startDate);
                projectPeriod.textContent = formatMonthYear(state.startDate);
                break;
                
            case 'thisYear':
                state.startDate = new Date(currentYear, 0, 1);
                state.endDate = new Date(currentYear, 11, 31);
                currentPeriod.textContent = `${currentYear}`;
                projectPeriod.textContent = `${currentYear}`;
                break;
        }
    }
    
    function formatMonthYear(date) {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
        return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    }
    
    function populateProjectSelect() {
        // Clear existing options
        projectSelect.innerHTML = '<option value="">Select a project</option>';
        
        // Add options for all projects
        state.projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            projectSelect.appendChild(option);
        });
    }
    
    function setViewMode(mode) {
        state.viewMode = mode;
        
        // Update UI
        if (mode === 'user') {
            userViewBtn.classList.add('active');
            projectViewBtn.classList.remove('active');
            userView.style.display = 'block';
            projectView.style.display = 'none';
            projectSelector.style.display = 'none';
        } else {
            userViewBtn.classList.remove('active');
            projectViewBtn.classList.add('active');
            userView.style.display = 'none';
            projectView.style.display = 'block';
            projectSelector.style.display = 'block';
        }
        
        renderMetrics();
    }
    
    function setTimeRange(range) {
        state.timeRange = range;
        
        // Update UI
        thisMonthBtn.classList.remove('active');
        lastMonthBtn.classList.remove('active');
        thisYearBtn.classList.remove('active');
        
        switch (range) {
            case 'thisMonth':
                thisMonthBtn.classList.add('active');
                break;
            case 'lastMonth':
                lastMonthBtn.classList.add('active');
                break;
            case 'thisYear':
                thisYearBtn.classList.add('active');
                break;
        }
        
        updateTimeRange();
        renderMetrics();
    }
    
    function renderMetrics() {
        if (state.viewMode === 'user') {
            renderUserMetrics();
        } else {
            renderProjectMetrics();
        }
    }
    
    function renderUserMetrics() {
        // Filter entries for the current user and time range
        const filteredEntries = state.entries.filter(entry => {
            const entryDate = new Date(entry.date);
            return entry.userId === state.userId && 
                   entryDate >= state.startDate && 
                   entryDate <= state.endDate;
        });
        
        if (filteredEntries.length === 0) {
            userView.style.display = 'none';
            noDataView.style.display = 'block';
            return;
        }
        
        userView.style.display = 'block';
        noDataView.style.display = 'none';
        
        // Calculate metrics
        const totalMinutes = filteredEntries.reduce((total, entry) => total + entry.timeSpent, 0);
        const totalHours = Math.round(totalMinutes / 60 * 10) / 10; // Round to 1 decimal place
        
        // Get unique projects
        const uniqueProjects = [...new Set(filteredEntries.map(entry => entry.project))];
        
        // Calculate daily average (only counting days with entries)
        const entriesByDate = {};
        filteredEntries.forEach(entry => {
            if (!entriesByDate[entry.date]) {
                entriesByDate[entry.date] = 0;
            }
            entriesByDate[entry.date] += entry.timeSpent;
        });
        
        const daysWithEntries = Object.keys(entriesByDate).length;
        const dailyAverageMinutes = daysWithEntries > 0 ? totalMinutes / daysWithEntries : 0;
        const dailyAverageHours = Math.round(dailyAverageMinutes / 60 * 10) / 10;
        
        // Find most active day
        let mostActiveDay = null;
        let mostActiveMinutes = 0;
        
        Object.entries(entriesByDate).forEach(([date, minutes]) => {
            if (minutes > mostActiveMinutes) {
                mostActiveDay = date;
                mostActiveMinutes = minutes;
            }
        });
        
        // Update metrics cards
        document.getElementById('totalHours').textContent = totalHours;
        document.getElementById('projectCount').textContent = uniqueProjects.length;
        document.getElementById('dailyAverage').textContent = dailyAverageHours;
        
        if (mostActiveDay) {
            const formattedDate = new Date(mostActiveDay).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
            document.getElementById('mostActiveDay').textContent = formattedDate;
        } else {
            document.getElementById('mostActiveDay').textContent = '-';
        }
        
        // Render project distribution chart
        renderProjectDistributionChart(filteredEntries);
        
        // Render daily time chart
        renderDailyTimeChart(entriesByDate);
    }
    
    function renderProjectMetrics() {
        if (!state.selectedProjectId) {
            projectView.style.display = 'none';
            noDataView.style.display = 'block';
            return;
        }
        
        // Get selected project
        const project = state.projects.find(p => p.id === state.selectedProjectId);
        if (!project) {
            projectView.style.display = 'none';
            noDataView.style.display = 'block';
            return;
        }
        
        // Filter entries for the selected project and time range
        const filteredEntries = state.entries.filter(entry => {
            const entryDate = new Date(entry.date);
            return entry.project === project.name && 
                   entryDate >= state.startDate && 
                   entryDate <= state.endDate;
        });
        
        if (filteredEntries.length === 0) {
            projectView.style.display = 'none';
            noDataView.style.display = 'block';
            return;
        }
        
        projectView.style.display = 'block';
        noDataView.style.display = 'none';
        
        // Calculate metrics
        const totalMinutes = filteredEntries.reduce((total, entry) => total + entry.timeSpent, 0);
        const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
        
        // Get unique team members
        const uniqueUserIds = [...new Set(filteredEntries.map(entry => entry.userId))];
        const teamMembers = state.users.filter(user => uniqueUserIds.includes(user.id));
        
        // Find last activity
        const sortedEntries = [...filteredEntries].sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        );
        const lastActivityDate = sortedEntries.length > 0 ? new Date(sortedEntries[0].timestamp) : null;
        
        // Update metrics cards
        document.getElementById('projectTotalHours').textContent = totalHours;
        document.getElementById('teamMemberCount').textContent = teamMembers.length;
        document.getElementById('projectStatus').textContent = project.completed ? 'Completed' : 'Active';
        
        if (lastActivityDate) {
            const formattedDate = lastActivityDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            document.getElementById('lastActivity').textContent = formattedDate;
        } else {
            document.getElementById('lastActivity').textContent = '-';
        }
        
        // Render team contribution chart
        renderTeamContributionChart(filteredEntries, teamMembers);
        
        // Render project daily chart
        renderProjectDailyChart(filteredEntries);
    }
    
    function renderProjectDistributionChart(entries) {
        // Calculate time spent per project
        const projectTime = {};
        entries.forEach(entry => {
            if (!projectTime[entry.project]) {
                projectTime[entry.project] = 0;
            }
            projectTime[entry.project] += entry.timeSpent;
        });
        
        // Convert to hours and prepare chart data
        const projects = Object.keys(projectTime);
        const timeData = projects.map(project => Math.round(projectTime[project] / 60 * 10) / 10);
        
        // Generate colors
        const backgroundColors = generateColors(projects.length);
        
        // Get the canvas element
        const ctx = document.getElementById('projectDistributionChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (projectDistributionChart) {
            projectDistributionChart.destroy();
        }
        
        // Create new chart
        projectDistributionChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: projects,
                datasets: [{
                    data: timeData,
                    backgroundColor: backgroundColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            boxWidth: 12,
                            padding: 15
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                return `${label}: ${value} hours`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    function renderDailyTimeChart(entriesByDate) {
        // Sort dates
        const sortedDates = Object.keys(entriesByDate).sort();
        
        // Prepare data
        const labels = sortedDates.map(date => {
            return new Date(date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        });
        
        const data = sortedDates.map(date => Math.round(entriesByDate[date] / 60 * 10) / 10);
        
        // Get the canvas element
        const ctx = document.getElementById('dailyTimeChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (dailyTimeChart) {
            dailyTimeChart.destroy();
        }
        
        // Create new chart
        dailyTimeChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Hours',
                    data: data,
                    backgroundColor: 'rgba(40, 167, 69, 0.7)',
                    borderColor: 'rgba(40, 167, 69, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Hours'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw || 0;
                                return `${value} hours`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    function renderTeamContributionChart(entries, teamMembers) {
        // Calculate time spent per user
        const userTime = {};
        entries.forEach(entry => {
            if (!userTime[entry.userId]) {
                userTime[entry.userId] = 0;
            }
            userTime[entry.userId] += entry.timeSpent;
        });
        
        // Map user IDs to names and prepare chart data
        const userIds = Object.keys(userTime);
        const userNames = userIds.map(userId => {
            const user = teamMembers.find(u => u.id === userId);
            return user ? user.name : 'Unknown User';
        });
        
        const timeData = userIds.map(userId => Math.round(userTime[userId] / 60 * 10) / 10);
        
        // Generate colors
        const backgroundColors = generateColors(userIds.length);
        
        // Get the canvas element
        const ctx = document.getElementById('teamContributionChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (teamContributionChart) {
            teamContributionChart.destroy();
        }
        
        // Create new chart
        teamContributionChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: userNames,
                datasets: [{
                    data: timeData,
                    backgroundColor: backgroundColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            boxWidth: 12,
                            padding: 15
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                return `${label}: ${value} hours`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    function renderProjectDailyChart(entries) {
        // Group entries by date and user
        const entriesByDateAndUser = {};
        
        entries.forEach(entry => {
            if (!entriesByDateAndUser[entry.date]) {
                entriesByDateAndUser[entry.date] = {};
            }
            
            if (!entriesByDateAndUser[entry.date][entry.userId]) {
                entriesByDateAndUser[entry.date][entry.userId] = 0;
            }
            
            entriesByDateAndUser[entry.date][entry.userId] += entry.timeSpent;
        });
        
        // Sort dates
        const sortedDates = Object.keys(entriesByDateAndUser).sort();
        
        // Get unique user IDs
        const uniqueUserIds = [...new Set(entries.map(entry => entry.userId))];
        
        // Prepare labels
        const labels = sortedDates.map(date => {
            return new Date(date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        });
        
        // Prepare datasets
        const datasets = uniqueUserIds.map((userId, index) => {
            const user = state.users.find(u => u.id === userId);
            const userName = user ? user.name : 'Unknown User';
            
            // Generate a color for this user
            const color = generateColors(1, index)[0];
            
            // Prepare data for this user
            const data = sortedDates.map(date => {
                const userMinutes = entriesByDateAndUser[date][userId] || 0;
                return Math.round(userMinutes / 60 * 10) / 10;
            });
            
            return {
                label: userName,
                data: data,
                backgroundColor: color,
                borderColor: color,
                borderWidth: 1
            };
        });
        
        // Get the canvas element
        const ctx = document.getElementById('projectDailyChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (projectDailyChart) {
            projectDailyChart.destroy();
        }
        
        // Create new chart
        projectDailyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        stacked: false,
                        title: {
                            display: true,
                            text: 'Hours'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.raw || 0;
                                return `${label}: ${value} hours`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    function generateColors(count, offset = 0) {
        const colors = [
            'rgba(40, 167, 69, 0.7)',    // Green
            'rgba(0, 123, 255, 0.7)',    // Blue
            'rgba(255, 193, 7, 0.7)',    // Yellow
            'rgba(220, 53, 69, 0.7)',    // Red
            'rgba(111, 66, 193, 0.7)',   // Purple
            'rgba(23, 162, 184, 0.7)',   // Cyan
            'rgba(253, 126, 20, 0.7)',   // Orange
            'rgba(32, 201, 151, 0.7)',   // Teal
            'rgba(102, 16, 242, 0.7)',   // Indigo
            'rgba(214, 51, 132, 0.7)'    // Pink
        ];
        
        // If we need more colors than we have defined, generate them
        if (count > colors.length) {
            for (let i = colors.length; i < count; i++) {
                const r = Math.floor(Math.random() * 200 + 55);
                const g = Math.floor(Math.random() * 200 + 55);
                const b = Math.floor(Math.random() * 200 + 55);
                colors.push(`rgba(${r}, ${g}, ${b}, 0.7)`);
            }
        }
        
        // Apply offset and return the requested number of colors
        const offsetColors = [...colors.slice(offset % colors.length), ...colors.slice(0, offset % colors.length)];
        return offsetColors.slice(0, count);
    }
});
