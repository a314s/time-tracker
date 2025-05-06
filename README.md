# Time Tracker Application

A browser-based time tracking application that helps you track time spent on different projects. The application now supports multiple user accounts, allowing different users to track their hours separately.

## Features

- **User Accounts**: Register and login to track your hours separately from other users
- **Calendar View**: Select dates to view and add time entries
- **Project Input with Auto-Complete**: Dropdown menu remembers previously entered projects
- **Flexible Time Entry**: Enter either start/end times or total time spent (automatically calculates timestamps)
- **Project Totals**: View selected date's time and running totals for all projects, sorted by most recently worked on
- **Grouped Project Entries**: Entries are grouped by project with timestamps displayed horizontally
- **Edit and Delete Entries**: Modify or remove existing time entries with changes reflected in project totals
- **Live Timer Functionality**: Start, pause, and finish timers for each project directly in the interface
- **Export Functionality**: Export the entire month's data with project totals
- **Persistent Storage**: All data is saved in your browser's local storage

## How to Use

1. **Create an account or login**:
   - Open `login.html` in your web browser
   - Register with your name, email, and password if you're a new user
   - Login with your email and password if you already have an account
2. **Open the application**: After logging in, you'll be redirected to the main application
3. **Select a date**: Click on a day in the calendar to select it
4. **Enter time information**:
   - Type a project name in the input field (previously used projects will appear in a dropdown)
   - Enter either:
     - Start time and end time, OR
     - Total time spent in minutes (the app will automatically use the current time as the end time and calculate the start time)
5. **Add the entry**: Click the "Enter" button to add the time entry
6. **View your entries**: All entries for the selected date will appear below
7. **Track project totals**: The left panel shows total time spent on each project
8. **Use the timer functionality**: Each project has timer controls
   - Click "Start" to begin tracking time for a project (automatically finishes any other running timer)
   - Click "Finish" to complete the timer and add the time to your entries
9. **Edit or delete entries**: Each time entry has edit and delete options
   - Click "Edit" to modify an entry's project, time, or duration
   - Click "Delete" to remove an entry
   - Changes are automatically reflected in project totals
10. **Export monthly data**: Click the "Export Month" button to download a text file with the current month's data and project totals

## Data Storage

All your time tracking data is stored locally in your browser. This means:
- Your data stays on your computer
- No internet connection is required
- Clearing your browser data will erase your time tracking history
- Each user account's data is stored separately
- User authentication is handled locally (no server-side validation)

### User Account Security

Since this is a client-side only application:
- Passwords are stored in plain text in localStorage (not recommended for sensitive data)
- All user data is accessible to anyone with access to your device
- For a production environment, server-side authentication would be recommended

## Navigation

- Use the arrow buttons to navigate between months in the calendar
- Recently used projects appear at the top of the dropdown list
