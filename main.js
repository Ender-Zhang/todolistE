const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

let mainWindow;
let editWindow;
let db;


function isDev() {
  return !app.isPackaged;
}

function getDbPath() {
  if (isDev()) {
      return path.join(app.getPath('userData'), 'tasks.db');
  } else {
      // 使用当前文件所在的目录
      // return path.join(__dirname, 'tasks.db');
      return path.join(app.getPath('userData'), 'tasks.db');
  }
}




function createWindow() {
  mainWindow = new BrowserWindow({
    width: 300,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// function createEditWindow(taskData) {
//   editWindow = new BrowserWindow({
//     width: 500,
//     height: 600,
//     parent: mainWindow,
//     modal: false,
//     webPreferences: {
//       nodeIntegration: true,
//       contextIsolation: false
//     }
//   });

//   editWindow.loadFile('edit.html');

//   editWindow.webContents.on('did-finish-load', () => {
//     editWindow.webContents.send('task-data', taskData);
//   });

//   editWindow.on('closed', function () {
//     editWindow = null;
//   });
// }

function initDatabase() {
  const dbPath = getDbPath();
  console.log('Database path:', dbPath);  // 确认数据库路径
  
  db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
          console.error('Database opening error: ', err);
      } else {
          console.log('Database connected or created at:', dbPath);
          createTables();  // 确保表格创建
      }
  });
}

function createTables() {
  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    time TEXT,
    details TEXT,
    completed INTEGER
  )`, (err) => {
    if (err) {
      console.error('Error creating table', err);
    } else {
      console.log('Table created or already exists');
    }
  });
}

app.on('ready', () => {
  initDatabase();
  createWindow();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (mainWindow === null) createWindow();
});

ipcMain.on('load-tasks', (event) => {
  db.all("SELECT * FROM tasks", [], (err, rows) => {
    if (err) {
      console.error("Error loading tasks:", err);
      event.reply('tasks-loaded', []);
    } else {
      event.reply('tasks-loaded', rows);
    }
  });
});

ipcMain.on('add-task', (event, task) => {
  db.run(`INSERT INTO tasks (title, time, details, completed) VALUES (?, ?, ?, ?)`,
    [task.title, task.time, task.details, task.completed],
    function(err) {
      if (err) {
        console.error("Error adding task:", err);
        event.reply('task-added', null);
      } else {
        const newTask = { id: this.lastID, ...task };
        event.reply('task-added', newTask);
      }
    }
  );
});

ipcMain.on('edit-task', (event, taskData) => {
  console.log('Received edit-task event for task:', taskData);  // 调试：确认任务数据被接收
  createEditWindow(taskData);
});

function createEditWindow(taskData) {
  editWindow = new BrowserWindow({
      width: 400,
      height: 650,
      parent: mainWindow,
      modal: false,
      webPreferences: {
          nodeIntegration: true,
          contextIsolation: false
      }
  });

  const editFilePath = path.join(__dirname, 'edit.html');
  console.log('Loading edit window from:', editFilePath);  // 调试：检查路径
  editWindow.loadFile(editFilePath);

  editWindow.webContents.on('did-finish-load', () => {
      editWindow.webContents.send('task-data', taskData);
  });

  editWindow.on('closed', function () {
      editWindow = null;
  });
}


ipcMain.on('update-task', (event, updatedTask) => {
  console.log('Received updated task:', updatedTask);  // 调试：确认主进程接收到更新的任务数据
  db.run(`UPDATE tasks SET title = ?, time = ?, details = ?, completed = ? WHERE id = ?`,
      [updatedTask.title, updatedTask.time, updatedTask.details, updatedTask.completed, updatedTask.id],
      (err) => {
          if (err) {
              console.error('Failed to update task:', err);
              event.reply('task-updated', false);
          } else {
              console.log('Task updated successfully');
              mainWindow.webContents.send('update-task', updatedTask);
              event.reply('task-updated', true);
          }
      }
  );
});



ipcMain.on('delete-task', (event, taskId) => {
  db.run(`DELETE FROM tasks WHERE id = ?`, taskId, (err) => {
    if (err) {
      console.error('Failed to delete task:', err);
      event.reply('task-deleted', false);
    } else {
      console.log('Task deleted successfully');
      event.reply('task-deleted', true);
    }
  });
});

ipcMain.on('toggle-always-on-top', (event, flag) => {
  mainWindow.setAlwaysOnTop(flag);
});

ipcMain.on('toggle-edit-window-on-top', (event, flag) => {
  if (editWindow) {
    editWindow.setAlwaysOnTop(flag);
  }
});