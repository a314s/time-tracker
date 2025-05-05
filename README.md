# Time Tracker Application

A browser-based time tracking application that helps you track time spent on different projects.

## Features

- **Calendar View**: Select dates to view and add time entries
- **Project Input with Auto-Complete**: Dropdown menu remembers previously entered projects
- **Flexible Time Entry**: Enter either start/end times or total time spent (automatically calculates timestamps)
- **Project Totals**: View running totals for all projects
- **Grouped Project Entries**: Entries are grouped by project with timestamps displayed horizontally
- **Export Functionality**: Export the entire month's data with project totals
- **Persistent Storage**: All data is saved in your browser's local storage

## How to Use

1. **Open the application**: Open `index.html` in your web browser
2. **Select a date**: Click on a day in the calendar to select it
3. **Enter time information**:
   - Type a project name in the input field (previously used projects will appear in a dropdown)
   - Enter either:
     - Start time and end time, OR
     - Total time spent in minutes (the app will automatically use the current time as the end time and calculate the start time)
4. **Add the entry**: Click the "Enter" button to add the time entry
5. **View your entries**: All entries for the selected date will appear below
6. **Track project totals**: The left panel shows total time spent on each project
7. **Export monthly data**: Click the "Export Month" button to download a text file with the current month's data and project totals

## Data Storage

All your time tracking data is stored locally in your browser. This means:
- Your data stays on your computer
- No internet connection is required
- Clearing your browser data will erase your time tracking history

## Navigation

- Use the arrow buttons to navigate between months in the calendar
- Recently used projects appear at the top of the dropdown list
