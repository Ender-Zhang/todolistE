const sqlite3 = require('sqlite3').verbose();
const { ipcRenderer } = require('electron');

// 创建并连接到 SQLite 数据库
const db = new sqlite3.Database('tasks.db');

// 初始化任务列表
let tasks = [];
let currentTask = null;
let isAlwaysOnTop = false;

// 创建任务表（如果不存在）
db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, title TEXT, time TEXT, details TEXT, completed INTEGER)");
});

// 添加任务到数据库
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

        // 插入新任务到 SQLite 数据库
        db.run(`INSERT INTO tasks (id, title, time, details, completed) VALUES (?, ?, ?, ?, ?)`,
            [newTask.id, newTask.title, newTask.time, newTask.details, newTask.completed]);

        renderTasks();
        document.getElementById('taskTitle').value = '';
        document.getElementById('taskTime').value = '';
    }
}

// 从数据库加载任务
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

// 渲染任务列表
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

// 编辑任务
function editTask(task) {
    currentTask = task;
    document.getElementById('editTaskTitle').value = task.title;
    document.getElementById('editTaskTime').value = task.time;
    document.getElementById('taskDetails').value = task.details;
    document.getElementById('dialog').style.display = 'block';
}

// 保存任务的更改
function saveTask() {
    const taskTitle = document.getElementById('editTaskTitle').value;
    const taskTime = document.getElementById('editTaskTime').value;
    const taskDetails = document.getElementById('taskDetails').value;

    if (currentTask) {
        currentTask.title = taskTitle;
        currentTask.time = taskTime;
        currentTask.details = taskDetails;

        // 更新数据库中的任务信息
        db.run(`UPDATE tasks SET title = ?, time = ?, details = ? WHERE id = ?`,
            [currentTask.title, currentTask.time, currentTask.details, currentTask.id]);

        renderTasks();
        closeDialog();
    }
}

// 删除任务
function deleteTask(taskId) {
    tasks = tasks.filter(task => task.id !== taskId);

    // 从数据库中删除任务
    db.run(`DELETE FROM tasks WHERE id = ?`, [taskId]);

    renderTasks();
}

// 关闭对话框
function closeDialog() {
    document.getElementById('dialog').style.display = 'none';
}

// 切换窗口置顶状态
function toggleAlwaysOnTop() {
    isAlwaysOnTop = !isAlwaysOnTop;
    ipcRenderer.send('toggle-always-on-top', isAlwaysOnTop);
    updateStatus();
}

// 更新置顶状态显示
function updateStatus() {
    const status = document.getElementById('status');
    status.textContent = isAlwaysOnTop ? 'Current Status: Always on Top' : 'Current Status: Not Always on Top';
}

// 初始化应用
function initializeApp() {
    loadTasksFromDatabase();  // 从数据库加载任务
    updateStatus();
}

initializeApp();
