/*
 * @Author: Ender-Zhang 102596313+Ender-Zhang@users.noreply.github.com
 * @Date: 2024-08-14 20:06:23
 * @LastEditors: Ender-Zhang 102596313+Ender-Zhang@users.noreply.github.com
 * @LastEditTime: 2024-08-14 20:06:29
 * @FilePath: /todolistE/edit.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const { ipcRenderer } = require('electron');

let currentTask = null;

ipcRenderer.on('task-data', (event, taskData) => {
    currentTask = taskData;
    document.getElementById('editTaskTitle').value = taskData.title;
    document.getElementById('editTaskTime').value = taskData.time;
    document.getElementById('taskDetails').value = taskData.details;
});

function saveTask() {
    if (currentTask) {
        currentTask.title = document.getElementById('editTaskTitle').value;
        currentTask.time = document.getElementById('editTaskTime').value;
        currentTask.details = document.getElementById('taskDetails').value;

        ipcRenderer.send('task-updated', currentTask);
    }
}