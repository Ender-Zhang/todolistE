const { ipcRenderer } = require('electron');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('tasks.db');

let tasks = [];
let isAlwaysOnTop = false;


db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, title TEXT, time TEXT, details TEXT, completed INTEGER)");
});

function addTask() {
    const taskTitle = document.getElementById('taskTitle').value;
    const taskTime = document.getElementById('taskTime').value;
    
    if (taskTitle.trim() !== '') {
        const newTask = {
            id: Date.now().toString(),
            title: taskTitle,
            time: taskTime,
            details: '',
            completed: 0
        };

        tasks.push(newTask);

        db.run(`INSERT INTO tasks (id, title, time, details, completed) VALUES (?, ?, ?, ?, ?)`,
            [newTask.id, newTask.title, newTask.time, newTask.details, newTask.completed]);

        renderTasks();
        document.getElementById('taskTitle').value = '';
        document.getElementById('taskTime').value = '';
    }
}

function loadTasksFromDatabase() {
    db.all("SELECT * FROM tasks", [], (err, rows) => {
        if (err) {
            console.error(err.message);
            return;
        }
        tasks = rows;
        renderTasks();
    });
}

function renderTasks() {
    const unfinishedTasks = document.getElementById('unfinishedTasks');
    const finishedTasks = document.getElementById('finishedTasks');
    
    unfinishedTasks.innerHTML = '';
    finishedTasks.innerHTML = '';

    tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = 'task-item';
        li.innerHTML = `
            <div class="task-content" onclick="editTask('${task.id}')">
                <span class="task-title">${task.title}</span>
                <span class="task-time">${task.time || 'No Time Set'}</span>
            </div>
            <div class="button-container">
                <button class="task-btn" onclick="toggleTaskCompletion('${task.id}', ${!task.completed})">
                    ${task.completed ? '↩️' : '✅'}
                </button>
                <button class="task-btn" onclick="deleteTask('${task.id}')">🗑️</button>
            </div>
        `;

        if (task.completed) {
            finishedTasks.appendChild(li);
        } else {
            unfinishedTasks.appendChild(li);
        }
    });
}

function editTask(taskId) {
    const task = tasks.find(task => task.id === taskId);
    if (task) {
        ipcRenderer.send('edit-task', task);
    }
}

function deleteTask(taskId) {
    tasks = tasks.filter(task => task.id !== taskId);
    db.run(`DELETE FROM tasks WHERE id = ?`, [taskId]);
    renderTasks();
}

// let isAlwaysOnTop = false;

function toggleAlwaysOnTop() {
    isAlwaysOnTop = !isAlwaysOnTop;
    ipcRenderer.send('toggle-always-on-top', isAlwaysOnTop);
    updateToggleButton();
}

function updateToggleButton() {
    const toggleBtn = document.getElementById('toggle-btn');
    if (isAlwaysOnTop) {
        toggleBtn.classList.add('active');
        toggleBtn.title = 'Always On Top: On';
    } else {
        toggleBtn.classList.remove('active');
        toggleBtn.title = 'Always On Top: Off';
    }
}

function updateStatus() {
    const status = document.getElementById('status');
    status.textContent = isAlwaysOnTop ? 'Current Status: Always on Top' : 'Current Status: Not Always on Top';
    
    // 更新按钮样式（可选）
    const toggleBtn = document.getElementById('toggle-btn');
    if (isAlwaysOnTop) {
        toggleBtn.style.backgroundColor = '#f1c40f';
        toggleBtn.style.color = 'white';
    } else {
        toggleBtn.style.backgroundColor = 'white';
        toggleBtn.style.color = '#3498db';
    }
}

function toggleTaskCompletion(taskId, completed) {
    const task = tasks.find(task => task.id === taskId);
    if (task) {
        task.completed = completed ? 1 : 0;
        db.run(`UPDATE tasks SET completed = ? WHERE id = ?`, [task.completed, taskId]);
        renderTasks();
    }
}

ipcRenderer.on('update-task', (event, updatedTask) => {
    const taskIndex = tasks.findIndex(task => task.id === updatedTask.id);
    if (taskIndex !== -1) {
        tasks[taskIndex] = updatedTask;
        db.run(`UPDATE tasks SET title = ?, time = ?, details = ? WHERE id = ?`,
            [updatedTask.title, updatedTask.time, updatedTask.details, updatedTask.id]);
        renderTasks();
    }
});

function initializeApp() {
    loadTasksFromDatabase();
    updateStatus();
}

initializeApp();