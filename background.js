// background.js

function groupByLocationExtId(data) {
  const groups = {};

  for (const person of data) {
    const locationExtId = person.locationExtId;

    // Handle potential name variations:
    // - Lowercase all names for case-insensitive comparison
    // - Consider using a fuzzy string matching library for more advanced matching
    const lowerCaseFirstName = person.firstName.toLowerCase();

    // Create a new array for this location or add to the existing one
    if (!groups[locationExtId]) {
      groups[locationExtId] = [];
    }

    // Check if a person with a similar name already exists
    const existingPerson = groups[locationExtId].find(
      (existing) => existing.firstName.toLowerCase() === lowerCaseFirstName
    );

    if (existingPerson) {
      // If a similar name exists, merge properties (assuming other details are not crucial)
      Object.assign(existingPerson, person);
    } else {
      groups[locationExtId].push(person);
    }
  }

  return groups;
}


chrome.runtime.onInstalled.addListener(function () {
  fetch('http://localhost:8000/api/get-population')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json(); 
    })
    .then(data => {
      let groupedData = {};

      // Loop through each item in the 'population' array
      data.population.forEach(function (person) {
        // Check if the locationExtId already exists as a key in the groupedData object
        if (!groupedData[person.locationExtId]) {
          // If it doesn't exist, create an empty array for that locationExtId
          groupedData[person.locationExtId] = [];
        }
        // Push the current person into the array corresponding to their locationExtId
        groupedData[person.locationExtId].push(person);
      });

      // Example: Save the blob to local storage
      chrome.storage.local.set({ population: data, residency: groupedData }, function () {
        console.log('Population & Residency Resource saved to local storage');
      });

     
     
    })
    .catch(error => {
      console.error('There was a problem with the fetch operation:', error);
    });
});
