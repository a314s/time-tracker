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
    const projectsList = document.getElementById('projectsList');
    const projectForm = document.getElementById('projectForm');
    const projectDetails = document.getElementById('projectDetails');
    const newProjectForm = document.getElementById('newProjectForm');
    const createProjectBtn = document.getElementById('createProjectBtn');
    const cancelProjectBtn = document.getElementById('cancelProjectBtn');
    const projectManagerSelect = document.getElementById('projectManager');
    const assignedUsersContainer = document.getElementById('assignedUsers');
    
    // State management
    const state = {
        projects: [],
        users: [],
        selectedProjectId: null,
        editMode: false,
        deleteMode: false
    };
    
    // Load data
    loadData();
    
    // Initialize UI
    renderProjectsList();
    populateUserOptions();
    
    // Event listeners
    createProjectBtn.addEventListener('click', showProjectForm);
    cancelProjectBtn.addEventListener('click', hideProjectForm);
    newProjectForm.addEventListener('submit', saveProject);
    
    // Functions
    function loadData() {
        // Load projects
        const allProjects = JSON.parse(localStorage.getItem('timeTrackerProjects') || '[]');
        state.projects = allProjects;
        
        // Load users
        const users = JSON.parse(localStorage.getItem('timeTrackerUsers') || '[]');
        state.users = users;
    }
    
    function saveData() {
        localStorage.setItem('timeTrackerProjects', JSON.stringify(state.projects));
    }
    
    function renderProjectsList() {
        projectsList.innerHTML = '';
        
        if (state.projects.length === 0) {
            const noProjectsEl = document.createElement('div');
            noProjectsEl.className = 'no-projects';
            noProjectsEl.textContent = 'No projects created yet';
            projectsList.appendChild(noProjectsEl);
            return;
        }
        
        state.projects.forEach(project => {
            const projectEl = document.createElement('div');
            projectEl.className = 'project-item';
            if (state.selectedProjectId === project.id) {
                projectEl.classList.add('active');
            }
            if (project.completed) {
                projectEl.classList.add('completed');
            }
            
            const nameEl = document.createElement('div');
            nameEl.className = 'project-item-name';
            nameEl.textContent = project.name;
            
            const managerEl = document.createElement('div');
            managerEl.className = 'project-item-manager';
            const manager = state.users.find(user => user.id === project.managerId);
            managerEl.textContent = `Manager: ${manager ? manager.name : 'Unknown'}`;
            
            const statusEl = document.createElement('div');
            statusEl.className = 'project-item-status';
            statusEl.textContent = project.completed ? 'Completed' : 'Active';
            
            projectEl.appendChild(nameEl);
            projectEl.appendChild(managerEl);
            projectEl.appendChild(statusEl);
            
            projectEl.addEventListener('click', () => {
                selectProject(project.id);
            });
            
            projectsList.appendChild(projectEl);
        });
    }
    
    function populateUserOptions() {
        // Clear previous options
        projectManagerSelect.innerHTML = '<option value="">Select a manager</option>';
        assignedUsersContainer.innerHTML = '';
        
        // Add user options
        state.users.forEach(user => {
            // Add to manager dropdown
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.name;
            projectManagerSelect.appendChild(option);
            
            // Add to assigned users checkboxes
            const userCheckbox = document.createElement('div');
            userCheckbox.className = 'user-checkbox';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `user-${user.id}`;
            checkbox.value = user.id;
            checkbox.name = 'assignedUsers';
            
            const label = document.createElement('label');
            label.htmlFor = `user-${user.id}`;
            label.textContent = `${user.name} (${user.email})`;
            
            userCheckbox.appendChild(checkbox);
            userCheckbox.appendChild(label);
            assignedUsersContainer.appendChild(userCheckbox);
        });
    }
    
    function showProjectForm() {
        // Reset form
        newProjectForm.reset();
        state.editMode = false;
        
        // Clear checkboxes
        const checkboxes = document.querySelectorAll('input[name="assignedUsers"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Show form, hide details
        projectForm.style.display = 'block';
        projectDetails.style.display = 'none';
    }
    
    function hideProjectForm() {
        projectForm.style.display = 'none';
        
        if (state.selectedProjectId) {
            projectDetails.style.display = 'block';
        } else {
            projectDetails.style.display = 'block';
            projectDetails.innerHTML = `
                <div class="select-project-message">
                    <p>Select a project from the list or create a new one</p>
                </div>
            `;
        }
    }
    
    function saveProject(e) {
        e.preventDefault();
        
        // Get form values
        const name = document.getElementById('projectName').value;
        const managerId = document.getElementById('projectManager').value;
        const liaison = document.getElementById('projectLiaison').value;
        
        // Get assigned users
        const assignedUsers = [];
        const checkboxes = document.querySelectorAll('input[name="assignedUsers"]:checked');
        checkboxes.forEach(checkbox => {
            assignedUsers.push(checkbox.value);
        });
        
        if (assignedUsers.length === 0) {
            alert('Please assign at least one user to the project');
            return;
        }
        
        if (state.editMode && state.selectedProjectId) {
            // Update existing project
            const projectIndex = state.projects.findIndex(p => p.id === state.selectedProjectId);
            if (projectIndex !== -1) {
                state.projects[projectIndex] = {
                    ...state.projects[projectIndex],
                    name,
                    managerId,
                    liaison,
                    assignedUsers,
                    updatedAt: new Date().toISOString()
                };
            }
        } else {
            // Create new project
            const newProject = {
                id: generateId(),
                name,
                managerId,
                liaison,
                assignedUsers,
                completed: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            state.projects.push(newProject);
            state.selectedProjectId = newProject.id;
        }
        
        // Save data
        saveData();
        
        // Update UI
        renderProjectsList();
        selectProject(state.selectedProjectId);
        hideProjectForm();
    }
    
    function selectProject(projectId) {
        state.selectedProjectId = projectId;
        state.deleteMode = false;
        
        // Update active project in list
        renderProjectsList();
        
        // Get project details
        const project = state.projects.find(p => p.id === projectId);
        if (!project) return;
        
        // Get manager info
        const manager = state.users.find(user => user.id === project.managerId);
        
        // Get assigned users info
        const assignedUsers = state.users.filter(user => project.assignedUsers.includes(user.id));
        
        // Check if current user is the project manager
        const isManager = project.managerId === currentUser.id;
        
        // Render project details
        projectDetails.style.display = 'block';
        projectDetails.innerHTML = `
            <div class="project-details-header">
                <h2 class="project-details-title">${project.name}</h2>
                <div class="project-status ${project.completed ? 'completed' : 'active'}">
                    ${project.completed ? 'Completed' : 'Active'}
                </div>
            </div>
            
            <div class="project-info">
                <div class="project-info-item">
                    <div class="project-info-label">Project Manager:</div>
                    <div class="project-info-value">${manager ? manager.name : 'Unknown'}</div>
                </div>
                
                <div class="project-info-item">
                    <div class="project-info-label">Project Liaison:</div>
                    <div class="project-info-value">${project.liaison}</div>
                </div>
                
                <div class="project-info-item">
                    <div class="project-info-label">Created:</div>
                    <div class="project-info-value">${new Date(project.createdAt).toLocaleDateString()}</div>
                </div>
                
                <div class="project-info-item">
                    <div class="project-info-label">Last Updated:</div>
                    <div class="project-info-value">${new Date(project.updatedAt).toLocaleDateString()}</div>
                </div>
            </div>
            
            <div class="project-users">
                <h3>Assigned Users</h3>
                <div class="user-list">
                    ${assignedUsers.map(user => `
                        <div class="user-tag">${user.name}</div>
                    `).join('')}
                </div>
            </div>
            
            ${isManager ? `
            <div class="project-actions">
                <button class="project-edit-btn" id="editProjectBtn">Edit Project</button>
                ${!project.completed ? `<button class="project-complete-btn" id="completeProjectBtn">Mark as Complete</button>` : ''}
                <button class="project-delete-btn" id="deleteProjectBtn">Delete Project</button>
            </div>
            ` : ''}
            
            <div id="deleteConfirmation" class="delete-confirmation" style="display: none;">
                <h3>Confirm Project Deletion</h3>
                <p>This action cannot be undone. To confirm, please type the project name below:</p>
                <div class="confirm-input">
                    <input type="text" id="confirmProjectName" placeholder="Type project name here">
                </div>
                <div class="confirm-actions">
                    <button id="confirmDeleteBtn" class="confirm-delete-btn" disabled>Confirm Delete</button>
                    <button id="cancelDeleteBtn" class="cancel-delete-btn">Cancel</button>
                </div>
            </div>
        `;
        
        // Add event listeners if user is the manager
        if (isManager) {
            // Edit button
            document.getElementById('editProjectBtn').addEventListener('click', () => {
                editProject(project);
            });
            
            // Complete button
            if (!project.completed) {
                document.getElementById('completeProjectBtn').addEventListener('click', () => {
                    completeProject(project.id);
                });
            }
            
            // Delete button
            document.getElementById('deleteProjectBtn').addEventListener('click', () => {
                showDeleteConfirmation();
            });
            
            // Set up delete confirmation if shown
            if (state.deleteMode) {
                const deleteConfirmation = document.getElementById('deleteConfirmation');
                const confirmInput = document.getElementById('confirmProjectName');
                const confirmBtn = document.getElementById('confirmDeleteBtn');
                const cancelBtn = document.getElementById('cancelDeleteBtn');
                
                deleteConfirmation.style.display = 'block';
                
                // Enable confirm button only if input matches project name
                confirmInput.addEventListener('input', () => {
                    confirmBtn.disabled = confirmInput.value !== project.name;
                });
                
                // Set up confirm and cancel buttons
                confirmBtn.addEventListener('click', () => {
                    deleteProject(project.id);
                });
                
                cancelBtn.addEventListener('click', () => {
                    hideDeleteConfirmation();
                });
            }
        }
    }
    
    function editProject(project) {
        state.editMode = true;
        
        // Fill form with project data
        document.getElementById('projectName').value = project.name;
        document.getElementById('projectManager').value = project.managerId;
        document.getElementById('projectLiaison').value = project.liaison;
        
        // Check assigned users
        const checkboxes = document.querySelectorAll('input[name="assignedUsers"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = project.assignedUsers.includes(checkbox.value);
        });
        
        // Show form
        projectForm.style.display = 'block';
        projectDetails.style.display = 'none';
    }
    
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
    
    function completeProject(projectId) {
        // Find the project
        const projectIndex = state.projects.findIndex(p => p.id === projectId);
        if (projectIndex === -1) return;
        
        // Mark as complete
        state.projects[projectIndex].completed = true;
        state.projects[projectIndex].updatedAt = new Date().toISOString();
        
        // Save data
        saveData();
        
        // Update UI
        renderProjectsList();
        selectProject(projectId);
    }
    
    function showDeleteConfirmation() {
        state.deleteMode = true;
        selectProject(state.selectedProjectId);
    }
    
    function hideDeleteConfirmation() {
        state.deleteMode = false;
        selectProject(state.selectedProjectId);
    }
    
    function deleteProject(projectId) {
        // Remove project from state
        state.projects = state.projects.filter(p => p.id !== projectId);
        
        // Save data
        saveData();
        
        // Clear selection
        state.selectedProjectId = null;
        state.deleteMode = false;
        
        // Update UI
        renderProjectsList();
        projectDetails.innerHTML = `
            <div class="select-project-message">
                <p>Project deleted successfully. Select a project from the list or create a new one.</p>
            </div>
        `;
    }
});
