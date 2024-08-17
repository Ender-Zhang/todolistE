const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let editWindow;

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

function createEditWindow(taskData) {
  editWindow = new BrowserWindow({
    width: 500,
    height: 600,
    parent: mainWindow,
    modal: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  editWindow.loadFile('edit.html');

  editWindow.webContents.on('did-finish-load', () => {
    editWindow.webContents.send('task-data', taskData);
  });

  editWindow.on('closed', function () {
    editWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (mainWindow === null) createWindow();
});

ipcMain.on('edit-task', (event, taskData) => {
  createEditWindow(taskData);
});

ipcMain.on('task-updated', (event, updatedTask) => {
  mainWindow.webContents.send('update-task', updatedTask);
  editWindow.close();
});

ipcMain.on('toggle-always-on-top', (event, flag) => {
  mainWindow.setAlwaysOnTop(flag);
});

ipcMain.on('toggle-edit-window-on-top', (event, flag) => {
    if (editWindow) {
        editWindow.setAlwaysOnTop(flag);
    }
});
