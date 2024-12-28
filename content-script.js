// Function to calculate Levenshtein Distance between two strings
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;

  const matrix = [];

  // Initialize the distance matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Calculate the distance
  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      if (str1.charAt(i - 1) === str2.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[len1][len2];
}

// Function to calculate similarity between two strings
function stringSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;

  const similarity = (str1.length + str2.length -
    levenshteinDistance(str1, str2)) / (str1.length + str2.length);
  return similarity;
}
function filterPopulation(firstName, middleName, lastName) {
  let container = document.getElementById('filteredDataContainer');

  container.replaceChildren();

  chrome.storage.local.get(["population", "residency"], function (result) {

    let responseData = result.population;
    if (responseData) {

      let filteredData = [];

      let populations = responseData.population;
      let familyMembers = result.residency;

      for (let i = 0; i < populations.length; i++) {

        const firstNameSimilarity = stringSimilarity(populations[i].firstName, firstName.toUpperCase());
        const middleNameSimilarity = stringSimilarity(populations[i].middleName, middleName.toUpperCase());
        const lastNameSimilarity = stringSimilarity(populations[i].lastName, lastName.toUpperCase());

        if (firstNameSimilarity >= 0.8 || middleNameSimilarity >= 0.8 || lastNameSimilarity >= 0.8) {
          filteredData.push(populations[i]);
        }
      }

      if (filteredData.length == 0) {
        alert("No populations found")
      } else {
        let container = document.getElementById('filteredDataContainer');
        filteredData.forEach(function (person) {
          let listItem = document.createElement('li');
          listItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start');

          let infoDiv = document.createElement('div');
          infoDiv.classList.add('ms-2', 'me-auto', 'm-1');

          infoDiv.innerHTML = `
            <div class="fw-bold">${person.firstName} ${person.lastName === 'ABCDE' ? '' : person.lastName} ${person.middleName === 'ABCDE' ? '' : person.middleName} / ${person.gender}</div>
            <p>DOB: ${person.dob}</p>
            <p>Id: ${person.extId}</p>
          `;

          let button = document.createElement('button');
          button.classList.add('btn', 'btn-primary', 'btn-sm', 'm-1');
          button.textContent = 'Select';

          button.addEventListener('click', () => {
            insertExtId(person.extId);
          });

          let dropdownDiv = document.createElement('div');
          dropdownDiv.classList.add('dropdown', 'm-1');

          let dropdownMenu = `
            <a class="btn btn-secondary btn-xs dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">Member</a><ul class="dropdown-menu">
            <li class="list-group-item list-group-item-action active" aria-current="true"><p class="dropdown-item" >Location: ${person.locationExtId}</p></li>
          `;

          familyMembers[person.locationExtId].forEach(function (member) {

            dropdownMenu += `
                  <li>
                    <p class="list-group-item">${member.firstName} ${member.lastName} / ${member.gender} / ${member.extId}</p>
                    <button class="btn btn-primary btn-sm select-btn" data-extid="${member.extId}">Select</button>
                  </li>`;
                          });

          // Event delegation for dynamically created buttons
          document.addEventListener('click', (event) => {
            if (event.target && event.target.classList.contains('select-btn')) {
              const extId = event.target.getAttribute('data-extid');
              insertExtId(extId);
            }
          });


          dropdownMenu += `</ul>`;
          dropdownDiv.innerHTML = dropdownMenu;

          listItem.appendChild(infoDiv);
          listItem.appendChild(button);
          listItem.appendChild(dropdownDiv);

          container.appendChild(listItem);
        });

      }

    } else {
      alert("No data found in local storage, check your internet connection!")
    }
  });
}

function insertExtId(extId) {
  // Get the currently active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) {
      alert('No active tab found!');
      return;
    }

    const activeTab = tabs[0];

    // Inject the content script
    chrome.scripting.executeScript(
        {
          target: { tabId: activeTab.id },
          func: (id) => {
            // Access the input field and set its value
            const inputField = document.getElementById('registrationNumber');
            if (inputField) {
              inputField.value = id;
            } else {
              alert('Input field for extId not found on this page!');
            }
          },
          args: [extId], // Pass the extId as an argument
        },
        (result) => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
          } else {
            console.log('extId inserted successfully.');
          }
        }
    );
  });
}


function getValue() {
  let firstNameInput = document.getElementById('first_name');
  let middleNameInput = document.getElementById('middle_name');
  let lastNameInput = document.getElementById('last_name');

  let firstName = firstNameInput.value;
  let middleName = middleNameInput.value;
  let lastName = lastNameInput.value;

  filterPopulation(firstName, middleName, lastName);
}

var button = document.getElementById("search");
button.addEventListener(
    "click", () => getValue(), false);



function hasClass(element, className) {
  return element.className && new RegExp("(^|\\s)" + className + "(\\s|$)").test(element.className);
}
document.addEventListener("click", function (e) {
  var level = 0;
  var clicked;
  for (var element = e.target; element; element = element.parentNode) {
    if (hasClass(element, 'dropdown')) {
      iterator = element.childNodes;
      for (var i = 0; i < iterator.length; i++) {
        var elem = iterator[i];
        if (hasClass(elem, 'dropdown-menu')) {
          var isVisible = elem.offsetWidth > 0 || elem.offsetHeight > 0;
          if (!(isVisible)) {
            elem.style.display = "block";
            element.className += " open";
            clicked = element;
          }
        }
      }
    }
    level++;
  }
  var iterator = document.getElementsByClassName('dropdown');
  for (var i = 0; i < iterator.length; i++) {
    var element = iterator[i];
    initerator = element.childNodes;
    for (var x = 0; x < initerator.length; x++) {
      var elem = initerator[x];
      if (hasClass(elem, 'dropdown-menu')) {
        var isVisible = elem.offsetWidth > 0 || elem.offsetHeight > 0;
        if (isVisible && clicked != element) {
          elem.style.display = "none";
          element.className = (element.className).replace(" open", "");
        }
      }
    }
  }
});

document.getElementById("search").addEventListener("click", function () {
  const progressBarContainer = document.getElementById("progressBarContainer");
  const progressBar = document.getElementById("progressBar");
  const filteredDataContainer = document.getElementById("filteredDataContainer");

  // Show the progress bar
  progressBarContainer.style.display = "block";
  progressBar.style.width = "0%"; // Reset progress bar

  // Simulate progress over time
  let progress = 0;
  const interval = setInterval(() => {
    progress += 10; // Increment progress
    progressBar.style.width = `${progress}%`; // Update width

    if (progress >= 100) {
      clearInterval(interval); // Stop updating when complete

      // Hide progress bar after completion
      setTimeout(() => {
        progressBarContainer.style.display = "none";
      }, 1000);
    }
  }, 200); // Update every 200ms
});
