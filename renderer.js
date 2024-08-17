const { ipcRenderer } = require('electron');

let tasks = [];
let isAlwaysOnTop = false;
let sortAscending = true;

function addTask() {
    const taskTitle = document.getElementById('taskTitle');
    const taskTime = document.getElementById('taskTime');
    
    if (taskTitle && taskTitle.value.trim() !== '') {
        const newTask = {
            title: taskTitle.value,
            time: taskTime ? taskTime.value : '',
            details: '',
            completed: 0
        };

        ipcRenderer.send('add-task', newTask);

        taskTitle.value = '';
        if (taskTime) taskTime.value = '';
    }
}

function loadTasks() {
    ipcRenderer.send('load-tasks');
}

ipcRenderer.on('tasks-loaded', (event, loadedTasks) => {
    tasks = loadedTasks;
    console.log('Tasks loaded:', tasks);  // 调试：输出加载的任务
    renderTasks();
});


function renderTasks() {
    const unfinishedTasks = document.getElementById('unfinishedTasks');
    const finishedTasks = document.getElementById('finishedTasks');
    
    unfinishedTasks.innerHTML = '';
    finishedTasks.innerHTML = '';

    tasks.forEach(task => {
        console.log('Rendering task:', task);  // 确认每个任务数据是否正确
        const li = document.createElement('li');
        li.className = 'task-item';
        li.innerHTML = `
            <div class="task-content" data-task-id="${task.id}" data-action="edit-task">
                <span class="task-title">${task.title}</span>
                <span class="task-time">${task.time || 'No Time Set'}</span>
            </div>
            <div class="button-container">
                <button class="task-btn" data-task-id="${task.id}" data-action="toggle-completion">
                    ${task.completed ? '↩️' : '✅'}
                </button>
                <button class="task-btn" data-task-id="${task.id}" data-action="delete-task">🗑️</button>
            </div>
        `;
    
        console.log('Created task item:', li);  // 确认生成的 HTML 是否正确
    
        if (task.completed) {
            finishedTasks.appendChild(li);
        } else {
            unfinishedTasks.appendChild(li);
        }
    });
    
}


function editTask(taskId) {
    console.log('Edit task triggered for taskId:', taskId);
    const task = tasks.find(task => String(task.id) === String(taskId));
    if (task) {
        console.log('Task found, opening edit window for task:', task);
        ipcRenderer.send('edit-task', task);
    } else {
        console.log('Task not found with id:', taskId);
    }
}


function deleteTask(taskId) {
    ipcRenderer.send('delete-task', taskId);
}

ipcRenderer.on('task-deleted', (event, success) => {
    if (success) {
        loadTasks();  // 重新加载任务列表
    } else {
        console.error('Failed to delete task');
    }
});

function toggleAlwaysOnTop() {
    isAlwaysOnTop = !isAlwaysOnTop;
    ipcRenderer.send('toggle-always-on-top', isAlwaysOnTop);
    updateToggleButton();
}

function updateToggleButton() {
    const toggleBtn = document.getElementById('toggle-btn');
    if (toggleBtn) {
        if (isAlwaysOnTop) {
            toggleBtn.classList.add('active');
            toggleBtn.title = 'Always On Top: On';
        } else {
            toggleBtn.classList.remove('active');
            toggleBtn.title = 'Always On Top: Off';
        }
    }
}

function toggleTaskCompletion(taskId, completed) {
    taskId = String(taskId);  // 确保 taskId 是字符串类型
    const task = tasks.find(task => String(task.id) === taskId);
    if (task) {
        console.log('Task found, updating completion status:', { taskId, completed });
        task.completed = completed ? 1 : 0;
        ipcRenderer.send('update-task', task);
    } else {
        console.log('Task not found with id:', taskId);
    }
}





ipcRenderer.on('update-task', (event, updatedTask) => {
    const taskIndex = tasks.findIndex(task => task.id === updatedTask.id);
    if (taskIndex !== -1) {
        tasks[taskIndex] = updatedTask;
        console.log('Task updated, now re-rendering tasks');  // 确认任务列表重新渲染
        renderTasks();
    }
});


ipcRenderer.on('task-added', (event, newTask) => {
    tasks.push(newTask);
    renderTasks();
});

function toggleSortOrder() {
    sortAscending = !sortAscending;
    renderTasks();
}

function initializeApp() {
    loadTasks();
    updateToggleButton();

    // 事件绑定
    const addTaskBtn = document.getElementById('add-task-btn');
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', addTask);
    }

    // 监听未完成任务列表
    document.getElementById('unfinishedTasks').addEventListener('click', (event) => {
        const taskId = event.target.closest('.task-item').querySelector('.task-content').dataset.taskId;
        const action = event.target.dataset.action;

        console.log('Unfinished Task Clicked:', { taskId, action });  // 输出调试信息

        if (action === 'toggle-completion') {
            toggleTaskCompletion(taskId, true);
        } else if (action === 'delete-task') {
            deleteTask(taskId);
        } else if (taskId) {  // 点击内容部分触发编辑
            editTask(taskId);
        }
    });

    // 监听已完成任务列表
    document.getElementById('finishedTasks').addEventListener('click', (event) => {
        const taskId = event.target.closest('.task-item').querySelector('.task-content').dataset.taskId;
        const action = event.target.dataset.action;

        console.log('Finished Task Clicked:', { taskId, action });  // 输出调试信息

        if (action === 'toggle-completion') {
            toggleTaskCompletion(taskId, false);
        } else if (action === 'delete-task') {
            deleteTask(taskId);
        }
    });

    const toggleBtn = document.getElementById('toggle-btn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleAlwaysOnTop);
    }
}


document.addEventListener('DOMContentLoaded', initializeApp);
