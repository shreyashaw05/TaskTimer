//  MEsage to set up a new Reminder
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action == "setReminder") {
        setReminder(message.dateTime, message.id);
        sendResponse("Yes,added.")
    }
})
// Message to delete the reminder of a deleted task
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action == "deleteReminder") {
        deleteReminder(message.delete);
        sendResponse("Yes,deleted.")
    }
})
let alarms = []; //empty array to store all alarms
// Function to delete teh reminder
function deleteReminder(id) {
    let alarmIdStr = `alarm${id}`;

    chrome.alarms.get(alarmIdStr, function (existingAlarm) {
        if (existingAlarm) {

            chrome.alarms.clear(alarmIdStr, function (wasCleared) {
                if (wasCleared) {
                    console.log(`Existing alarm ${alarmIdStr} cleared.`);
                }
            });
        }

        // Removing it from alarms[] array
        const alarmIndex = alarms.findIndex(alarm => alarm.id === alarmIdStr);
        alarms.splice(alarmIndex, 1);
        console.log(alarms);
    });
}
// Set reminder

function setReminder(remDay, alarmid) {
    const alarmTime = new Date(remDay).getTime();
    const delayInMinutes = (alarmTime - Date.now()) / 60000;
    const alarmIdStr = `alarm${alarmid}`;

    //Checking  if an alarm with the given id already exists
    chrome.alarms.get(alarmIdStr, function (existingAlarm) { // an inbuilt method which gets the alarm by name
        if (existingAlarm) {
            // Clear the existing alarm
            chrome.alarms.clear(alarmIdStr, function (wasCleared) {
                if (wasCleared) {
                    console.log(`Existing alarm ${alarmIdStr} cleared.`);
                }
                createAndSetAlarm(alarmIdStr, delayInMinutes);
            });
        } else {
            createAndSetAlarm(alarmIdStr, delayInMinutes);
        }
    });
}

// create the reminder if doesn't exist
function createAndSetAlarm(alarmIdStr, delayInMinutes) {

    if (delayInMinutes < 0) {
        delayInMinutes = 1;
    }

    chrome.alarms.create(alarmIdStr, {
        delayInMinutes: delayInMinutes
    });

    const alarmIndex = alarms.findIndex(alarm => alarm.id === alarmIdStr); //checking if an alarm for that task laready exists
    if (alarmIndex !== -1) {
        alarms[alarmIndex].time = delayInMinutes; //if yes then Update existing
    } else {
        alarms.push({ // else add new
            id: alarmIdStr,
            time: delayInMinutes
        });
    }
    console.log(`Alarm ${alarmIdStr} set to trigger in ${delayInMinutes} minute(s).`);
    console.log("Current alarms:", alarms);
}

// listen the alarm
chrome.alarms.onAlarm.addListener(handleAlarm);

function handleAlarm(alarm) {
    if (alarms.some(val => val.id == alarm.name)) { //returns true if at least one element.
        chrome.notifications.create('timerNotification', {
            type: 'basic',
            iconUrl: 'icon.jpg',
            title: alarm.name.replace('alarm', '').trim(),
            message: 'Task completed and removed from your list.',
            buttons: [
                { title: 'Stop' }
            ],
            requireInteraction: true
        });
        console.log(alarm);

        //Playing the alarm sound(subjected to many conditions:) )
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                console.log(tabs)
                var tabId = tabs[0].id;
                chrome.tabs.sendMessage(tabId, { message: "playAlarm" });
            }
        });
        // Deleting that task from local Storage
        chrome.storage.sync.get('taskList', function (data) {
            let taskList = []; // Initialize taskList as an empty array by default
            if (data.taskList) {
                try {
                    // Attempt to parse data.taskList
                    const parsedList = JSON.parse(data.taskList);
                    // Check if the parsed data is an array
                    if (Array.isArray(parsedList)) {
                        taskList = parsedList;
                    } else {
                        console.error('Stored taskList is not an array.');
                    }
                } catch (e) {
                    console.error('Error parsing taskList:', e);
                }
            }
            const index = taskList.findIndex(task => `alarm${task}` === alarm.name);
            console.log(index);
            if (index !== -1) {
                taskList.splice(index, 1);
                chrome.storage.sync.set({ taskList: JSON.stringify(taskList) }, function () {
                    console.log(`Task ${alarm.name} deleted from taskList.`);
                    console.log(taskList);
                });
            }
        });
        // removing that alarm from the alarms[] array
        alarms = alarms.filter(item => item.id !== alarm.name); alarms = alarms.filter(item => item.id !== alarm.name);
        console.log(alarms);

    }
}

chrome.notifications.onButtonClicked.addListener(function (notificationId, buttonIndex) {
    if (notificationId === 'timerNotification' && buttonIndex === 0) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                var tabId = tabs[0].id; // Get the ID of the first tab in the array
                chrome.tabs.sendMessage(tabId, { message: "stopAlarm" }); // Corrected line
            }
        });
    }
});
