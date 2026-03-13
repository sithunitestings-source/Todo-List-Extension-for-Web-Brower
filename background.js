// Handle alarms for task reminders
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name.startsWith('task-')) {
    const taskId = parseInt(alarm.name.replace('task-', ''));
    
    // Get task details from storage
    chrome.storage.local.get(['tasks'], (result) => {
      const tasks = result.tasks || [];
      const task = tasks.find(t => t.id === taskId);
      
      if (task && !task.completed) {
        // Show notification
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: 'Task Reminder',
          message: `⏰ Time to: ${task.text}`,
          priority: 2
        });
      }
    });
  }
});

// Listen for notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
  // Open the extension popup when notification is clicked
  chrome.action.openPopup();
});

// Handle installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Initialize with sample tasks
    const sampleTasks = [
      {
        id: Date.now(),
        text: 'Welcome to Todo List!',
        time: '09:00',
        completed: false,
        createdAt: new Date().toISOString()
      },
      {
        id: Date.now() + 1,
        text: 'Click checkbox to complete tasks',
        time: '14:00',
        completed: false,
        createdAt: new Date().toISOString()
      }
    ];
    
    chrome.storage.local.set({ tasks: sampleTasks });
    
    // Set reminders for sample tasks
    sampleTasks.forEach(task => setReminder(task));
  }
});

function setReminder(task) {
  const [hours, minutes] = task.time.split(':');
  const reminderTime = new Date();
  reminderTime.setHours(parseInt(hours), parseInt(minutes), 0);
  
  if (reminderTime < new Date()) {
    reminderTime.setDate(reminderTime.getDate() + 1);
  }

  chrome.alarms.create(`task-${task.id}`, {
    when: reminderTime.getTime()
  });
}