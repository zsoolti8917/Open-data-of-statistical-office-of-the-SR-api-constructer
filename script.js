const datasetDropdown = document.getElementById('datasets');
const dimensionDropdownContainer = document.getElementById('dimension-details');
const fetchDataButton = document.getElementById('fetch-data');
const responseContainer = document.getElementById('response-container');

let selectedDimensions = {};
let allDimensionKeys = [];

fetch('https://data.statistics.sk/api/v2/collection?lang=en')
    .then(response => response.json())
    .then(data => {
        data.link.item.forEach(dataset => {
            if (dataset.dimension && dataset.dimension.nuts13) {
                const option = document.createElement('option');
                option.value = dataset.href;
                option.textContent = dataset.label;
                datasetDropdown.appendChild(option);
            }
        });
    })
    .catch(error => console.error('Error fetching datasets:', error));

datasetDropdown.addEventListener('change', () => {
    const selectedDatasetUrl = datasetDropdown.value;
    const datasetCode = selectedDatasetUrl.split('/').slice(-1)[0].split('_')[0];

    fetch(selectedDatasetUrl)
        .then(response => response.json())
        .then(jsonStat => {
            if (jsonStat && jsonStat.dimension) {
                dimensionDropdownContainer.innerHTML = '';
                selectedDimensions = {};
                
                allDimensionKeys = Object.keys(jsonStat.dimension).filter(dim => !dim.endsWith('_data'));
                
                expectedNumberOfDimensions = allDimensionKeys.length;

                allDimensionKeys.forEach(dimName => {
                    fetchDimensionDetails(datasetCode, dimName);
                });
            }
        })
        .catch(error => console.error('Error fetching dimensions:', error));
});

function fetchDimensionDetails(datasetCode, dimension) {
    const url = `https://data.statistics.sk/api/v2/dimension/${datasetCode}/${dimension}?lang=en`;

    fetch(url)
        .then(response => response.json())
        .then(dimensionData => {
            createDimensionDropdown(dimension, dimensionData);
            console.log(`Dimension details for ${dimension}:`, dimensionData);  
        })
        .catch(error => console.error('Error fetching dimension details:', error));
}

function createDimensionDropdown(dimensionName, dimensionData) {
    const label = document.createElement('label');
    label.textContent = dimensionName;
    dimensionDropdownContainer.appendChild(label);
    if (!dimensionData || !dimensionData.category || !dimensionData.category.label) {
        console.error(`Error: dimensionData is invalid for dimension ${dimensionName}`);
        return; 
    }
    const dimensionDropdown = document.createElement('select');
    dimensionDropdown.name = dimensionName;
    
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = 'All';
    dimensionDropdown.appendChild(allOption);

    Object.entries(dimensionData.category.label).forEach(([elementCode, elementLabel]) => {
        const option = document.createElement('option');
        option.value = elementCode;
        option.textContent = elementLabel;
        dimensionDropdown.appendChild(option);
    });

    dimensionDropdown.addEventListener('change', () => {
        selectedDimensions[dimensionName] = dimensionDropdown.value;
        console.log('Selected dimensions:', selectedDimensions);  // Debugging
    });

    dimensionDropdownContainer.appendChild(dimensionDropdown);
}


function constructFinalApiUrl(cubeCode, selectedDimensions, allDimensionKeys) {

    expectedNumberOfDimensions = allDimensionKeys.length; 

    let dimensionParams = allDimensionKeys.map(dimKey => selectedDimensions[dimKey] || 'all');

    console.log('Dimension parameters for API call:', dimensionParams);
    if (typeof expectedNumberOfDimensions === 'undefined') {
        console.error('Error: expectedNumberOfDimensions is not set.');
        return null; 
    }
    if (dimensionParams.length !== expectedNumberOfDimensions) {
        const error = `Error: The number of dimensions is incorrect. Expected: ${expectedNumberOfDimensions}, Actual: ${dimensionParams.length}`;
        console.error(error);
        document.getElementById('error-container').textContent = error;
        return null; 
    }

    return `https://data.statistics.sk/api/v2/dataset/${cubeCode}/${dimensionParams.join('/')}?lang=en&type=json`;
}
fetchDataButton.addEventListener('click', () => {
    const selectedDatasetCode = datasetDropdown.value.split('/').slice(-1)[0].split('_')[0];
    const apiUrl = constructFinalApiUrl(selectedDatasetCode, selectedDimensions, allDimensionKeys);
    fetchDataAndDisplay(apiUrl);
});

function fetchDataAndDisplay(apiUrl) {
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            responseContainer.textContent = JSON.stringify(data, null, 2);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            responseContainer.textContent = `Error fetching data: ${error}`;
        });
}
