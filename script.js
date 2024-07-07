var newTaskElement = document.getElementById("new-task");
var addTaskElement = document.getElementById("add-task");

var setReminderElement = document.getElementById("set-reminder");
var reminderTimeElement = document.getElementById("reminder-time");

var taskListDiv = document.getElementById("task-list");
var displayContent = document.getElementById("displayContainer");
var taskList = [], prevTaskList=[];
var count = 0;
var selectedDateTime = [];
var headNew= document.getElementById("headNew");

addTaskElement.addEventListener("click", function () {

    if (newTaskElement.value !== "") 
        taskList.push(newTaskElement.value);
    else 
        alert("Cannot be empty.")
        // Assuming taskList is not empty and taskListDiv is already defined
        if (taskList.length > 0) {
            headNew.className="visible";
            console.log(taskList);
            var task = taskList[taskList.length - 1]; // Get the last task
            var li = document.createElement("li");

            li.textContent = task;
        
            var dateTimeInput = document.createElement("input");
            dateTimeInput.type = "datetime-local";
            dateTimeInput.min= currentDateTime();
            dateTimeInput.style.width="100px";
            // Handling the change of date
            dateTimeInput.addEventListener("change", function () {
                selectedDateTime.push(this.value);
                console.log(selectedDateTime);
                console.log(task);
                chrome.runtime.sendMessage({
                    action: "setReminder",
                    dateTime: this.value,
                    id: task
                }, (response) => {
                    console.log(response);
                });
            });
            li.appendChild(dateTimeInput);
            taskListDiv.appendChild(li); // Append only the last task  

        
            chrome.storage.sync.get('taskList', function(result) {
                console.log(typeof result.taskList);
                var old_data = result.taskList ? JSON.parse(result.taskList) : [];
                console.log(taskList);
                console.log(Array.isArray( old_data));
                old_data.push(task);
                
                chrome.storage.sync.set({'taskList': JSON.stringify(old_data)}, function() {
                    console.log('Task list updated.');
                });
            });
        }
});
var tasks;

document.addEventListener("DOMContentLoaded", function() {
    chrome.storage.sync.get('taskList', function(result) {
        var storedTaskList = result.taskList;
         console.log(storedTaskList)
        if (storedTaskList) {
            document.getElementById("headPrev").className="visible";
            tasks = JSON.parse(storedTaskList); 
            console.log(tasks)
        } else {
            tasks = []; 
        }
        tasks.forEach(function(task) {
            var li = document.createElement("li");
            li.textContent = task;
            li.id= `alarm${task}`;

            var deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.addEventListener("click", function() {
                var index = tasks.indexOf(task);
                if (index > -1) {
                    tasks.splice(index, 1);
                    chrome.storage.sync.set({'taskList': JSON.stringify(tasks)}, function() {
                        console.log('Task list updated.');
                    });
                    li.remove();
                }
                chrome.runtime.sendMessage({
                    action: "deleteReminder",
                    delete:task
                })
                console.log(task)
            });
            
            li.appendChild(deleteButton);
            displayContent.appendChild(li);
        });
    });
});


// To disable the previous dates
function currentDateTime() {
    var now = new Date();
    var year = now.getFullYear();
    var month = ('0' + (now.getMonth() + 1)).slice(-2); // Add leading 0 if needed
    var day = ('0' + now.getDate()).slice(-2); // Add leading 0 if needed
    var hours = ('0' + now.getHours()).slice(-2); // Add leading 0 if needed
    var minutes = ('0' + now.getMinutes()).slice(-2); // Add leading 0 if needed
    return year + '-' + month + '-' + day + 'T' + hours + ':' + minutes;
}