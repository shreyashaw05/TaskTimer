//  MEsage to set up a new Reminder
chrome.runtime.onMessage.addListener( function(message,sender,sendResponse){
    if(message.action=="setReminder"){
        setReminder(message.dateTime, message.id);
        sendResponse("Yes,added.")
    }
})
// Message to delete the reminder of a deleted task
chrome.runtime.onMessage.addListener( function(message,sender,sendResponse){
    if(message.action=="deleteReminder"){
        deleteReminder(message.delete);
        sendResponse("Yes,deleted.")
    }
})
let alarms = []; //empty array to store all alarms
// Function to delete teh reminder
function deleteReminder(id){
    let alarmIdStr = `alarm${id}`;

    chrome.alarms.get(alarmIdStr, function(existingAlarm) {
        if (existingAlarm) {
            
            chrome.alarms.clear(alarmIdStr, function(wasCleared) {
                if (wasCleared) {
                    console.log(`Existing alarm ${alarmIdStr} cleared.`);
                }
            });
        }

        // Removing it from alarms[] array
        const alarmIndex = alarms.findIndex(alarm => alarm.id === alarmIdStr);
        alarms.splice(alarmIndex,1);
        console.log(alarms);
    });
}
// Set reminder

function setReminder(remDay, alarmid) {
    const alarmTime = new Date(remDay).getTime();
    const delayInMinutes = (alarmTime - Date.now()) / 60000;
    const alarmIdStr = `alarm${alarmid}`;

    //Checking  if an alarm with the given id already exists
    chrome.alarms.get(alarmIdStr, function(existingAlarm) { // an inbuilt method which gets the alarm by name
        if (existingAlarm) {
            // Clear the existing alarm
            chrome.alarms.clear(alarmIdStr, function(wasCleared) {
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
        delayInMinutes =1;
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
    if (alarms.some(val => val.id == alarm.name)) { //I didn't knew about the some method.
        chrome.notifications.create('timerNotification', {
            type: 'basic',
            iconUrl: 'icon.jpg',
            title: alarm.name,
            message: 'Your timer is up!',
            buttons: [
                { title: 'Stop' }
            ], 
            requireInteraction: true
        });
        console.log(alarm);

        chrome.runtime.sendMessage({ action: 'playAlarm' });

        chrome.runtime.sendMessage({
            action:"taskCompleted",
            taskStatus:"done",
            task: alarm.name
        })

    }
}

chrome.notifications.onButtonClicked.addListener(function (notificationId, buttonIndex) {
    if (notificationId === 'timerNotification') {
      if (buttonIndex === 0) {
        chrome.runtime.sendMessage({ action: 'stopAlarm' });
      }
    }
  });