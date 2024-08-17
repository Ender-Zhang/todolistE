/*
 * @Author: Ender-Zhang 102596313+Ender-Zhang@users.noreply.github.com
 * @Date: 2024-08-14 20:06:23
 * @LastEditors: Ender-Zhang 102596313+Ender-Zhang@users.noreply.github.com
 * @LastEditTime: 2024-08-17 10:12:09
 * @FilePath: /todolistE/edit.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const { ipcRenderer } = require('electron');

let currentTask = null;

let isPinned = false;  // 初始化图钉状态

document.getElementById('pinBtn').addEventListener('click', () => {
    isPinned = !isPinned;
    ipcRenderer.send('toggle-edit-window-on-top', isPinned);
    updatePinIcon();
});

function updatePinIcon() {
    const pinIcon = document.getElementById('pinIcon');
    if (isPinned) {
        pinIcon.classList.add('pinned');
        pinIcon.style.color = '#f39c12';  // 设置图钉颜色为橙色
    } else {
        pinIcon.classList.remove('pinned');
        pinIcon.style.color = '#555';  // 设置图钉颜色为灰色
    }
}



ipcRenderer.on('task-data', (event, taskData) => {
    console.log('Received task data in edit window:', taskData);  // 调试：确认接收到的任务数据
    currentTask = taskData;  // 初始化 currentTask
    document.getElementById('editTaskTitle').value = taskData.title;
    document.getElementById('editTaskTime').value = taskData.time;
    document.getElementById('taskDetails').value = taskData.details;
});


function saveTask() {
    if (currentTask) {
        console.log('Saving task:', currentTask);  // 调试：输出正在保存的任务数据
        currentTask.title = document.getElementById('editTaskTitle').value;
        currentTask.time = document.getElementById('editTaskTime').value;
        currentTask.details = document.getElementById('taskDetails').value;

        ipcRenderer.send('task-updated', currentTask);
        window.close();  // 保存后关闭窗口
    } else {
        console.error('No task loaded, cannot save');  // 调试：任务未加载时的错误信息
    }
}
