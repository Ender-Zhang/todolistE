/*
 * @Author: Ender-Zhang 102596313+Ender-Zhang@users.noreply.github.com
 * @Date: 2024-08-14 20:06:23
 * @LastEditors: Ender-Zhang 102596313+Ender-Zhang@users.noreply.github.com
 * @LastEditTime: 2024-08-24 05:02:13
 * @FilePath: /todolistE/edit.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const { ipcRenderer } = require('electron');

let currentTask = null;

let isPinned = false;  // 初始化图钉状态

// 初始化 Quill 富文本编辑器
var quill = new Quill('#editor-container', {
    theme: 'snow'
});

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



// 接收任务数据并加载到编辑器
ipcRenderer.on('task-data', (event, taskData) => {
    console.log('Received task data in edit window:', taskData);
    currentTask = taskData;
    document.getElementById('editTaskTitle').value = taskData.title;
    document.getElementById('editTaskTime').value = taskData.time;
    quill.root.innerHTML = taskData.details;  // 将任务详情加载到编辑器
});

function saveTask() {
    if (currentTask) {
        currentTask.title = document.getElementById('editTaskTitle').value;
        currentTask.time = document.getElementById('editTaskTime').value;
        currentTask.details = quill.root.innerHTML;  // 从编辑器获取富文本内容

        console.log('Saving task details:', currentTask.details);  // 调试：确认保存的内容
        ipcRenderer.send('update-task', currentTask);
        window.close();  // 保存后关闭窗口
    } else {
        console.error('No task loaded, cannot save');
    }
}

