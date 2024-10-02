let db; // Declare db in a higher scope

const request = indexedDB.open("patientDB", 2); // Update version from 1 to 2

request.onupgradeneeded = (event) => {
  db = event.target.result; // Assign the database to the db variable
  // Create the object store if it doesn't exist
  if (!db.objectStoreNames.contains("patients")) {
    db.createObjectStore("patients", { keyPath: "name" });
  }
};

request.onsuccess = (event) => {
  db = event.target.result; // Assign the opened database to the db variable
  console.log("Database opened successfully.");
  loadPatientsFromDB(); // Call this function when the database is successfully opened
};

request.onerror = (event) => {
  console.error("Error opening database:", event.target.error);
};

const patients = [
  {
    name: "John Doe",
    gender: "Male",
    age: 45,
    nationality: "American",
    checkups: [
      { date: "2022-01-15", notes: "3bass", medicines: [{ name: "Aspirin" }] },
      {
        date: "2022-02-15",
        notes: "Follow-up",
        medicines: [{ name: "Ibuprofen" }],
      },
    ],
  },
  {
    name: "Jane Smith",
    gender: "Female",
    age: 30,
    nationality: "British",
    checkups: [
      {
        date: "2022-02-20",
        notes: "Routine check",
        medicines: [{ name: "Ibuprofen" }],
      },
    ],
  },
  {
    name: "Carlos Mendez",
    gender: "Male",
    age: 50,
    nationality: "Mexican",
    checkups: [
      {
        date: "2022-03-10",
        notes: "Initial visit",
        medicines: [{ name: "Metformin" }],
      },
    ],
  },
  {
    name: "Aisha Khan",
    gender: "Female",
    age: 25,
    nationality: "Pakistani",
    checkups: [
      {
        date: "2022-04-05",
        notes: "Follow-up",
        medicines: [{ name: "Paracetamol" }],
      },
    ],
  },
];
function displayPatients(patientArray) {
  const patientList = document.getElementById("patientList");
  patientList.innerHTML = "";
  patientArray.forEach((patient, index) => {
    const li = document.createElement("li");
    li.textContent = `${patient.name}`;
    li.style.color = patient.gender === "Male" ? "black" : "purple";
    li.addEventListener("click", (e) => {
      if (e.target !== li) return;
      togglePatientDetails(index);
    });
    const details = document.createElement("div");
    details.className = "patient-details";
    details.id = `patient-details-${index}`;
    details.innerHTML = `
        <p>Gender: ${patient.gender}</p>
        <p>Age: ${patient.age} years old</p>
        <p>Nationality: ${patient.nationality}</p>
        <h3>Check-up History:</h3>
        <button onclick="togglePatientDetails(${index})" style="border-radius: 10px;">Close</button>
        <select class="history-entry" onchange="showCheckupNotes(this.value, ${index}); updateMedicines(${index})">
          <option value="">Select a date</option>
          ${patient.checkups
            .map(
              (checkup) => `
          <option value="${checkup.date}">${checkup.date}</option>
          `
            )
            .join("")}
        </select>
        <p id="checkupNotes-${index}"></p>
        <h3>Medicines:</h3>
        <ul id="medicinesList-${index}"></ul>
        `;

    li.appendChild(details);
    patientList.appendChild(li);
  });
}

function showCheckupNotes(date, index) {
  const checkup = patients[index].checkups.find(
    (checkup) => checkup.date === date
  );
  document.getElementById("checkupNotes-" + index).textContent = checkup
    ? checkup.notes
    : "No notes available."; // Added default message if no notes
}

function togglePatientDetails(index) {
  const details = document.getElementById(`patient-details-${index}`);
  details.style.display = details.style.display === "none" ? "block" : "none";
}

function searchPatients() {
  const searchTerm = document.getElementById("searchBar").value.toLowerCase();
  const filteredPatients = patients.filter((patient) =>
    patient.name.toLowerCase().includes(searchTerm)
  );
  displayPatients(filteredPatients);
}

function toggleAddPatientForm() {
  const form = document.getElementById("addPatientForm");
  form.style.display = form.style.display === "none" ? "block" : "none";
}

function addPatient() {
  const name = document.getElementById("patientName").value.trim();
  const gender = document.getElementById("patientGender").value;
  const age = document.getElementById("patientAge").value;
  const nationality = document.getElementById("patientNationality").value;
  const lastCheckup = document.getElementById("patientLastCheckup").value;
  const notes = document.getElementById("patientNotes").value;

  // Get selected medicines
  const medicineSelect = document.getElementById("medicineSelect");
  const selectedMedicines = Array.from(medicineSelect.selectedOptions).map(
    (option) => ({ name: option.value })
  );

  if (name && lastCheckup) {
    const existingPatient = patients.find(
      (patient) => patient.name.toLowerCase() === name.toLowerCase()
    );

    if (existingPatient) {
      existingPatient.checkups.unshift({
        date: lastCheckup,
        notes: notes,
        medicines: selectedMedicines,
      });
      alert("Patient updated with new check-up date, notes, and medicines.");
    } else {
      if (gender && age && nationality) {
        patients.push({
          name,
          gender,
          age: parseInt(age),
          nationality,
          checkups: [
            { date: lastCheckup, notes: notes, medicines: selectedMedicines },
          ],
        });
        alert("New patient added successfully.");
      } else {
        alert("Please fill in all fields for a new patient.");
        return;
      }
    }

    // Save patients to IndexedDB after adding/updating
    if (db) {
      // Check if db is defined
      savePatientsToDB();
    } else {
      console.error("Database is not initialized. Cannot save patients.");
    }

    // Display updated patient list
    displayPatients(patients);
    toggleAddPatientForm();

    // Reset all input fields after adding or updating a patient
    resetPatientForm();
  } else {
    alert("Please enter at least the patient's name and check-up date.");
  }
}

function resetPatientForm() {
  document.getElementById("patientName").value = "";
  document.getElementById("patientGender").value = "";
  document.getElementById("patientAge").value = "";
  document.getElementById("patientNationality").value = "";
  document.getElementById("patientLastCheckup").value = "";
  document.getElementById("patientNotes").value = "";
  document.getElementById("medicineSearch").value = "";
}

function deletePatient(index) {
  if (confirm("Are you sure you want to delete a patient?")) {
    const dialog = document.getElementById("deletePatientDialog");
    const patientList = document.getElementById("patientToDelete");
    patientList.innerHTML = "";
    patients.forEach((patient, index) => {
      const option = new Option(patient.name, index);
      patientList.add(option);
    });
    dialog.showModal();
  }
}

function confirmDelete() {
  const patientList = document.getElementById("patientToDelete");
  const selectedIndex = patientList.value;
  const patientName = patients[selectedIndex].name;

  // Remove the patient from the array
  patients.splice(selectedIndex, 1);

  // Save updated patients to IndexedDB after deletion
  if (db) {
    savePatientsToDB(); // Save changes to the database
  } else {
    console.error("Database is not initialized. Cannot save patients.");
  }

  displayPatients(patients);
  alert(`Patient "${patientName}" has been deleted.`);
  document.getElementById("deletePatientDialog").close();
}

// Initial display of all patients
displayPatients(patients);

function updateMedicines(index) {
  const medicinesList = document.getElementById(`medicinesList-${index}`);

  // Use a more specific selector to get the selected date for the specific patient
  const selectedDate = document.querySelector(
    `#patient-details-${index} .history-entry`
  ).value; // Get selected date
  console.log(`Selected Date for Patient ${index}:`, selectedDate); // Debugging line

  // Find the checkup for the selected date
  const checkup = patients[index].checkups.find(
    (checkup) => checkup.date === selectedDate
  );

  if (checkup) {
    // Display medicines for the selected checkup date
    medicinesList.innerHTML = checkup.medicines.length
      ? checkup.medicines
          .map((medicine) => `<li>${medicine.name}</li>`)
          .join("") // Display medicines
      : "<li>No medicines recorded for this date.</li>"; // Default message if no medicines
  } else {
    medicinesList.innerHTML = "<li>No checkup selected.</li>"; // Default message if no checkup is selected
  }
}

function addMedicine() {
  const medicineSelect = document.getElementById("medicineSelect");
  const newMedicines = document
    .getElementById("medicineSearch")
    .value.split(",")
    .map((med) => med.trim()); // Split input by commas

  // Store currently selected options
  const selectedOptions = Array.from(medicineSelect.selectedOptions).map(
    (option) => option.value
  );

  // Get the index of the currently selected patient
  const patientIndex = Array.from(
    document.getElementById("patientList").children
  ).findIndex((li) => li.textContent === medicineSelect.dataset.patientName);

  newMedicines.forEach((newMedicine) => {
    if (newMedicine) {
      // Check if the medicine already exists
      const existingOptions = Array.from(medicineSelect.options);
      const exists = existingOptions.some(
        (option) => option.value.toLowerCase() === newMedicine.toLowerCase()
      );

      if (!exists) {
        const option = document.createElement("option");
        option.value = newMedicine;
        option.textContent = newMedicine;
        medicineSelect.appendChild(option); // Add the new option to the select

        // Push the new medicine to the patient's medicines array
        if (patientIndex !== -1) {
          patients[patientIndex].checkups[0].medicines.push({
            name: newMedicine,
          }); // Add medicine to the patient's medicines
          console.log(
            `Added medicine: ${newMedicine} to patient index: ${patientIndex}`
          );
        }
      } else {
        alert(`${newMedicine} already exists in the list.`);
      }
    }
  });

  // Save updated patients to IndexedDB after adding medicines
  if (db) {
    savePatientsToDB(); // Save changes to the database
  } else {
    console.error("Database is not initialized. Cannot save patients.");
  }

  // Check if the save was successful
  const transaction = db.transaction("patients", "readonly");
  const patientsStore = transaction.objectStore("patients");
  const request = patientsStore.getAll();

  request.onsuccess = (event) => {
    console.log("Patients in DB after adding medicine:", event.target.result);
  };

  request.onerror = (event) => {
    console.error("Error retrieving patients from DB:", event.target.error);
  };

  // Restore the previously selected options
  selectedOptions.forEach((value) => {
    const option = Array.from(medicineSelect.options).find(
      (opt) => opt.value === value
    );
    if (option) {
      option.selected = true; // Re-select the previously selected options
    }
  });

  // Clear the input field after adding
  document.getElementById("medicineSearch").value = ""; // Clear the search bar
}

function searchMedicines() {
  const searchTerm = document
    .getElementById("medicineSearch")
    .value.toLowerCase();
  const medicineSelect = document.getElementById("medicineSelect");
  const options = medicineSelect.getElementsByTagName("option");

  for (let i = 0; i < options.length; i++) {
    const option = options[i];
    const text = option.textContent.toLowerCase();

    // Show all options if the search term is empty, otherwise filter
    option.style.display =
      searchTerm === "" || text.includes(searchTerm) ? "block" : "none";
  }
}

// Save patients to IndexedDB after adding/updating
function savePatientsToDB() {
  const transaction = db.transaction("patients", "readwrite");
  const patientsStore = transaction.objectStore("patients");

  // Clear the existing records before saving the updated list
  const clearRequest = patientsStore.clear();
  clearRequest.onsuccess = () => {
    patients.forEach((patient) => {
      patientsStore.put(patient); // Use put to update or add
    });
  };

  transaction.oncomplete = () => {
    console.log("Patients saved to database successfully.");
  };

  transaction.onerror = (event) => {
    console.error("Error saving patients:", event.target.error);
  };
}

function loadPatientsFromDB() {
  if (!db) {
    console.error("Database is not initialized.");
    return;
  }

  const transaction = db.transaction("patients", "readonly");
  const patientsStore = transaction.objectStore("patients");

  const request = patientsStore.getAll();
  request.onsuccess = (event) => {
    const loadedPatients = event.target.result;
    console.log("Loaded patients from DB:", loadedPatients); // Log loaded patients
    patients.length = 0; // Clear the existing patients array
    patients.push(...loadedPatients); // Update the global patients array
    displayPatients(patients); // Display the loaded patients
  };
  request.onerror = (event) => {
    console.error("Error loading patients:", event.target.error);
  };
}

// Call this function when the page loads
loadPatientsFromDB();
