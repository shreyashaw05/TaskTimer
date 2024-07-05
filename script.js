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

            // Storing locally, getting the old value and appending to it.
            if (localStorage.getItem('tasklist') == null)
                localStorage.setItem('tasklist', JSON.stringify(taskList));

            var old_data = JSON.parse(localStorage.getItem('tasklist'));
            old_data.push(task);
            localStorage.setItem('tasklist', JSON.stringify(old_data))
        }
});
var tasks;

document.addEventListener("DOMContentLoaded", function() {
    var storedTaskList = localStorage.getItem('tasklist');

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
                localStorage.setItem('tasklist', JSON.stringify(tasks));
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
      prevTaskList=  Array.from(displayContent.childNodes);  
      console.log(prevTaskList[prevTaskList.length-1].id)
    });

    chrome.runtime.onMessage.addListener( function(message,sender,sendResponse){
        console.log(`${message.task} completed` )
        if(message.action=="taskCompleted"){
            console.log(prevTaskList.id)
        var index = prevTaskList.findIndex(item => item.id === message.task);
        console.log(index, message.task);
        if (index !== -1) {
            
            var taskElement = prevTaskList[index];
            console.log(taskElement)
            taskElement.style.color = "rgb(21, 104, 21)";
            taskElement.lastChild.innerText = "Done";
            taskElement.lastChild.style.backgroundColor = "rgb(21, 104, 21)";

            if (index > -1) {
                tasks.splice(index, 1);
                localStorage.setItem('tasklist', JSON.stringify(tasks));
            }
            sendResponse("Yes, Marked.");
        }
        }
    })
});
var audio = new Audio("alarm.mp3");
audio.load();
// Play alarm tone.
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
 
    if (request.action === 'playAlarm') {
      console.log("play Audio");
      audio.currentTime = 0;
      audio.play();
    }
    if (request.action === 'stopAlarm') {
      console.log("stop alarm");
      audio.pause();
      audio.currentTime = 0;
    }
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