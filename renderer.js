const { ipcRenderer } = require('electron');

let isAlwaysOnTop = false;

function addTask() {
  const taskInput = document.getElementById('taskInput');
  const taskList = document.getElementById('taskList');

  if (taskInput.value.trim() !== '') {
    const li = document.createElement('li');
    li.textContent = taskInput.value;
    li.onclick = () => {
      taskList.removeChild(li);
    };
    taskList.appendChild(li);
    taskInput.value = '';
  }
}

function toggleAlwaysOnTop() {
  isAlwaysOnTop = !isAlwaysOnTop;
  ipcRenderer.send('toggle-always-on-top', isAlwaysOnTop);
}
