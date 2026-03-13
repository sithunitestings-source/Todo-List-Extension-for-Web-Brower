let currentFilter = 'all';
let tasks = [];

// Load tasks when popup opens
document.addEventListener('DOMContentLoaded', loadTasks);

// Add task button click handler
document.getElementById('addTaskBtn').addEventListener('click', addTask);

// Enter key handler for task input
document.getElementById('taskInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addTask();
});

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    displayTasks();
  });
});

function addTask() {
  const taskInput = document.getElementById('taskInput');
  const taskTime = document.getElementById('taskTime');
  
  const taskText = taskInput.value.trim();
  if (!taskText) return;

  const task = {
    id: Date.now(),
    text: taskText,
    time: taskTime.value,
    completed: false,
    createdAt: new Date().toISOString()
  };

  tasks.push(task);
  saveTasks();
  displayTasks();

  // Set reminder alarm
  setReminder(task);

  taskInput.value = '';
}

function setReminder(task) {
  const [hours, minutes] = task.time.split(':');
  const reminderTime = new Date();
  reminderTime.setHours(parseInt(hours), parseInt(minutes), 0);
  
  // If time has passed today, schedule for tomorrow
  if (reminderTime < new Date()) {
    reminderTime.setDate(reminderTime.getDate() + 1);
  }

  chrome.alarms.create(`task-${task.id}`, {
    when: reminderTime.getTime()
  });
}

function loadTasks() {
  chrome.storage.local.get(['tasks'], (result) => {
    tasks = result.tasks || [];
    displayTasks();
  });
}

function saveTasks() {
  chrome.storage.local.set({ tasks });
}

function displayTasks() {
  const taskList = document.getElementById('taskList');
  const filteredTasks = filterTasks(tasks, currentFilter);
  
  if (filteredTasks.length === 0) {
    taskList.innerHTML = '<li style="text-align: center; padding: 20px; color: #6b7280;">No tasks found</li>';
    return;
  }

  taskList.innerHTML = filteredTasks.map(task => createTaskElement(task)).join('');
  attachTaskEventListeners();
}

function filterTasks(tasks, filter) {
  switch(filter) {
    case 'active':
      return tasks.filter(task => !task.completed);
    case 'completed':
      return tasks.filter(task => task.completed);
    default:
      return tasks;
  }
}

function createTaskElement(task) {
  const timeDisplay = task.time ? formatTime(task.time) : 'No time set';
  
  return `
    <li class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
      <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
      <div class="task-content">
        <div class="task-text">${escapeHtml(task.text)}</div>
        <div class="task-time">
          <span>⏰ ${timeDisplay}</span>
          ${!task.completed ? '<span class="reminder-badge">Reminder set</span>' : ''}
        </div>
      </div>
      <button class="delete-btn">Delete</button>
    </li>
  `;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatTime(timeString) {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function attachTaskEventListeners() {
  // Checkbox change handlers
  document.querySelectorAll('.task-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      const taskItem = this.closest('.task-item');
      const taskId = parseInt(taskItem.dataset.taskId);
      const task = tasks.find(t => t.id === taskId);
      
      if (task) {
        task.completed = this.checked;
        saveTasks();
        
        // Show toast for completed task
        if (task.completed) {
          showToast('✅ Task completed: ' + task.text);
        }
        
        displayTasks();
      }
    });
  });

  // Delete button handlers
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const taskItem = this.closest('.task-item');
      const taskId = parseInt(taskItem.dataset.taskId);
      
      tasks = tasks.filter(t => t.id !== taskId);
      saveTasks();
      
      // Clear the alarm
      chrome.alarms.clear(`task-${taskId}`);
      
      showToast('🗑️ Task deleted');
      displayTasks();
    });
  });
}

function showToast(message) {
  // Simple toast implementation
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #333;
    color: white;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 14px;
    z-index: 1000;
    animation: slideUp 0.3s ease;
  `;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Add animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translate(-50%, 20px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }
  
  @keyframes fadeOut {
    to {
      opacity: 0;
      transform: translate(-50%, -20px);
    }
  }
`;
document.head.appendChild(style);