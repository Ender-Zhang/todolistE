const { ipcRenderer } = require('electron');

let isAlwaysOnTop = false;
let tasks = [];
let currentTask = null;

function addTask() {
  const taskTitle = document.getElementById('taskTitle').value;
  const taskTime = document.getElementById('taskTime').value;
  
  if (taskTitle.trim() !== '') {
    const newTask = {
      id: Date.now().toString(),
      title: taskTitle,
      time: taskTime,
      details: '',
      completed: false
    };
    tasks.push(newTask);
    renderTasks();
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskTime').value = '';
  }
}

function renderTasks() {
  const unfinishedTasks = document.getElementById('unfinishedTasks');
  const finishedTasks = document.getElementById('finishedTasks');
  
  unfinishedTasks.innerHTML = '';
  finishedTasks.innerHTML = '';

  tasks.forEach(task => {
    const li = document.createElement('li');
    li.textContent = `${task.title} - ${task.time || 'No Time Set'}`;
    li.onclick = () => editTask(task);

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.onclick = (e) => {
      e.stopPropagation();
      deleteTask(task.id);
    };

    li.appendChild(deleteButton);

    if (task.completed) {
      finishedTasks.appendChild(li);
    } else {
      unfinishedTasks.appendChild(li);
    }
  });
}

function editTask(task) {
  currentTask = task;
  document.getElementById('editTaskTitle').value = task.title;
  document.getElementById('editTaskTime').value = task.time;
  document.getElementById('taskDetails').value = task.details;
  document.getElementById('dialog').style.display = 'block';
}

function saveTask() {
  const taskTitle = document.getElementById('editTaskTitle').value;
  const taskTime = document.getElementById('editTaskTime').value;
  const taskDetails = document.getElementById('taskDetails').value;

  if (currentTask) {
    currentTask.title = taskTitle;
    currentTask.time = taskTime;
    currentTask.details = taskDetails;
    renderTasks();
    closeDialog();
  }
}

function deleteTask(taskId) {
  tasks = tasks.filter(task => task.id !== taskId);
  renderTasks();
}

function closeDialog() {
  document.getElementById('dialog').style.display = 'none';
}

function toggleAlwaysOnTop() {
  isAlwaysOnTop = !isAlwaysOnTop;
  ipcRenderer.send('toggle-always-on-top', isAlwaysOnTop);
  updateStatus();
}

function updateStatus() {
  const status = document.getElementById('status');
  status.textContent = isAlwaysOnTop ? 'Current Status: Always on Top' : 'Current Status: Not Always on Top';
}

// 初始化时更新状态
updateStatus();
renderTasks();
