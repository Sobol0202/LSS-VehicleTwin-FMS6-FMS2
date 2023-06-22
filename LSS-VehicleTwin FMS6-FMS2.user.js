// ==UserScript==
// @name         LSS-VehicleTwin FMS6-FMS2
// @namespace    https://www.leitstellenspiel.de/
// @version      1.1
// @description  Schaltet ein Fahrzeug in S6, wenn das andere in S2 geht
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/*
// @grant        none
// ==/UserScript==

// Konfiguration
const fahrzeug1ID = '51973941'; // Hier Fahrzeug 1 ID eintragen
const fahrzeug2ID = '46968798'; // Hier Fahrzeug 2 ID eintragen

// Status der Fahrzeuge speichern
let fahrzeug1Status = '0';
let fahrzeug2Status = '0';

// Funktion zum Überprüfen der Checkboxen der Fahrzeuge
function checkVehicleCheckboxes() {
  const checkbox1 = document.getElementById('vehicle_checkbox_' + fahrzeug1ID);
  const checkbox2 = document.getElementById('vehicle_checkbox_' + fahrzeug2ID);

  if (checkbox1 && checkbox2 && checkbox1.checked && checkbox2.checked) {
    // Beide Checkboxen sind ausgewählt
//    console.log('Beide Fahrzeug-Checkboxen sind ausgewählt. Korrigiere...');

    // Die Checkbox des zweiten Fahrzeugs wird abgewählt
    checkbox2.checked = false;
//    console.log(`Fahrzeug ${fahrzeug2ID} Checkbox wurde abgewählt.`);

    // Manuell den "change" Event auslösen, um das System über die Änderung zu informieren
    const changeEvent = new Event('change', { bubbles: true });
    checkbox2.dispatchEvent(changeEvent);
  }
}

// Funktion zum Klicken auf den Button basierend auf FMS-Status
function handleFMSStatus(vehicleID, fmsStatus) {
  if (fahrzeug1Status === '3' && fahrzeug2Status === '3') {
//    console.log('Beide Fahrzeuge befinden sich bereits im Status 3. Keine Aktion erforderlich.');
    return;
  }

  const setFMSURL = `https://www.leitstellenspiel.de/vehicles/${vehicleID}/set_fms/${fmsStatus}`;

  const xhr = new XMLHttpRequest();
  xhr.open('GET', setFMSURL, true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
//      console.log(`Fahrzeug ${vehicleID}: FMS-Status auf ${fmsStatus} umgeschaltet.`);
    } else {
//      console.log(`Fahrzeug ${vehicleID}: Fehler beim Umschalten auf FMS-Status ${fmsStatus}.`);
    }
  };
  xhr.send();
}

// Überwachung der Checkboxen bei Änderungen
document.addEventListener('change', checkVehicleCheckboxes);

// Überwachung der Checkboxen bei Aktualisierungen durch das System
setInterval(checkVehicleCheckboxes, 1000); // Überprüfung alle 1 Sekunde (kann angepasst werden)




// Funktion zum Auslesen des aktuellen Fahrzeugstatus von der Detailseite
function getVehicleStatus(vehicleID) {
  const vehicleURL = `https://www.leitstellenspiel.de/vehicles/${vehicleID}`;
  fetch(vehicleURL)
    .then(response => response.text())
    .then(data => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(data, 'text/html');
      const fmsStatusElement = doc.querySelector('.building_list_fms');
      if (fmsStatusElement) {
        const fmsStatus = fmsStatusElement.innerText;
//        console.log(`Fahrzeug ${vehicleID}: Aktueller FMS-Status: ${fmsStatus}`);
        updateVehicleStatus(vehicleID, fmsStatus);
      }
    });
}

// Funktion zum Aktualisieren des Fahrzeugstatus und Ausführen der Aktionen
function updateVehicleStatus(vehicleID, fmsStatus) {
  if (vehicleID === fahrzeug1ID) {
    if (fmsStatus === '2') {
      fahrzeug1Status = '2';
      fahrzeug2Status = '2';
    } else if (fmsStatus === '3') {
      fahrzeug1Status = '3';
      fahrzeug2Status = '2';
    }
  } else if (vehicleID === fahrzeug2ID) {
    if (fmsStatus === '2') {
      fahrzeug1Status = '2';
      fahrzeug2Status = '2';
    } else if (fmsStatus === '3') {
      fahrzeug1Status = '2';
      fahrzeug2Status = '3';
    }
  }
}

// Funktion zum Überprüfen und Steuern der Fahrzeuge
function checkAndControlVehicles() {
  const radioMessages = document.getElementById('radio_messages');
  if (!radioMessages) return;

  const messages = radioMessages.querySelectorAll('li');
  if (!messages) return;

  messages.forEach(message => {
    const vehicleIDElement = message.querySelector('img.vehicle_search');
    if (!vehicleIDElement) return;

    const vehicleID = vehicleIDElement.getAttribute('vehicle_id');
    const fmsStatus = message.querySelector('span.building_list_fms').innerText;

//    console.log(`Sprechwunsch von Fahrzeug ${vehicleID}: FMS-Status ${fmsStatus}`);

    if (vehicleID === fahrzeug1ID) {
      if (fmsStatus === '3' && fahrzeug1Status !== '3') {
//        console.log(`Sprechwunsch von Fahrzeug ${vehicleID}: Aktion für FMS-Status ${fmsStatus}`);
        handleFMSStatus(fahrzeug2ID, '6');
        fahrzeug1Status = '3';
        fahrzeug2Status = '2';
      } else if (fmsStatus === '2' && fahrzeug1Status !== '2') {
//        console.log(`Sprechwunsch von Fahrzeug ${vehicleID}: Aktion für FMS-Status ${fmsStatus}`);
        handleFMSStatus(fahrzeug2ID, '2');
        fahrzeug1Status = '2';
        fahrzeug2Status = '2';
      }
    } else if (vehicleID === fahrzeug2ID) {
      if (fmsStatus === '3' && fahrzeug2Status !== '3') {
//        console.log(`Sprechwunsch von Fahrzeug ${vehicleID}: Aktion für FMS-Status ${fmsStatus}`);
        handleFMSStatus(fahrzeug1ID, '6');
        fahrzeug1Status = '2';
        fahrzeug2Status = '3';
      } else if (fmsStatus === '2' && fahrzeug2Status !== '2') {
//        console.log(`Sprechwunsch von Fahrzeug ${vehicleID}: Aktion für FMS-Status ${fmsStatus}`);
        handleFMSStatus(fahrzeug1ID, '2');
        fahrzeug1Status = '2';
        fahrzeug2Status = '2';
      }
    }
  });
}

// Überprüfung der Seite auf Änderungen
const observer = new MutationObserver(() => {
  checkAndControlVehicles();
});

observer.observe(document.body, { childList: true, subtree: true });

// Auslesen des aktuellen Fahrzeugstatus beim Seitenladen
getVehicleStatus(fahrzeug1ID);
getVehicleStatus(fahrzeug2ID);

// Initiale Überprüfung der Fahrzeuge
checkAndControlVehicles();
