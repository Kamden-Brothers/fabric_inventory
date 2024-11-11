const UPLOAD_FOLDER = './fabric_uploads/';

let asc_desc_sort = 1;
let pageNum = 0;
let displayNum = 16;
let currentList = [];
let fabric_data = [];

function pageNumbers(list) {
    // Calculate the number of pages based on items in list and page size
    return Math.ceil(list.length/displayNum)
}

function sortFabric(items, sort_attribute = "fabric_name") {
    console.log(`Sorting fabric by ${sort_attribute}`)
    return items.sort((a, b) => {
        let nameA, nameB;
        if (sort_attribute === "fabric_name") {
            // Compare based on fabric name
            nameA = a.data.fabric_name.toUpperCase();
            nameB = b.data.fabric_name.toUpperCase();
        } else {
            if (a.data[sort_attribute] == null) {
                // Move null attributes to the end
                return 1;
            }
            if (b.data[sort_attribute] == null) {
                // Move null attributes to the end
                return -1;
            }

            // Select attribute and set to uppercase
            nameA = a.data[sort_attribute].toUpperCase();
            nameB = b.data[sort_attribute].toUpperCase();
        }

        return (nameA < nameB ? -1 : (nameA > nameB ? 1 : 0)) * asc_desc_sort;
    })
}

function filterFabric(items, key, values) {
    return items.filter(item => {
        // Check if any of the values match the item's property
        return values.some(value => item.data[key] === value);
    });
}

function filterSearch(items, searchText) {
    // Filter based on fabric names containing searchText
    return items.filter(item => {
        return item.data.fabric_name.toUpperCase().includes(searchText.toUpperCase())
    })
}

function filterFabricRange(items, key, min_value, max_value) {
    // Filter based on an upper and lower value (Used for yardage and width)
    if (min_value) {
        console.log(`Filtering ${key}`)
        console.log(min_value)
        items = items.filter(item => {
            return +(item.data[key]) >= min_value
        })
    }
    if (max_value) {
        console.log(`Filtering ${key}`)
        console.log(max_value)
        items = items.filter(item => {
            console.log((item.data[key]))
            console.log(+(item.data[key]))
            return +(item.data[key]) <= max_value
        })
    }

    return items
}

function loadIMG(fabric) {
    // Load image dynmaically
    this.img_added = true

    if (fabric.img_added) {
        // Already loaded
        return
    }
    fabric.img.attr('src', UPLOAD_FOLDER + fabric.data.image_path)
}

class Fabric {
    constructor(data) {
        // Store data in class
        this.data = data;

        // Top level item
        const td = $('<td>').addClass('fabric-item-container');

        // Div used to set width of table and display fabric
        const div = $('<div>').addClass('table-width-div');
        td.append(div);

        // Fabric heading
        const link = $('<div>')
            .addClass('fabric-heading')
            .addClass('to-fabric')
            .attr('title', data.fabric_name)
            .text(data.fabric_name);

        div.append(link);

        // Image element and link. src is added dynamically
        const img_link = $('<div>').addClass('to-fabric').attr('title', data.fabric_name);
        this.img = $('<img>').addClass('fabric-image');

        img_link.append(this.img);
        div.append(img_link);

        // Main data to be displayed
        const fabricDetails = [
            { heading: 'Material:', data: data.material },
            { heading: 'Cut:', data: data.cut },
            { heading: 'Width:', data: data.width },
            { heading: 'Yardage:', data: data.yardage },
        ];

        // Create spans for each element
        fabricDetails.forEach(detail => {
            const detailDiv = $('<div>'); // Wrap each detail in a div

            const headerSpan = $('<span>').addClass('fabric-header').text(detail.heading);
            const dataSpan = $('<span>').addClass('fabric-data').text(detail.data);

            detailDiv.append(headerSpan);
            detailDiv.append(dataSpan);

            div.append(detailDiv); // Append the detail div to td_1
        });

        // Sort related display. Accessible by class
        this.sortDiv = $('<div>').addClass('sort-div').addClass('visible')
        this.sortHeader = $('<span>').addClass('fabric-header').text('Sort Option');
        this.sortData = $('<span>').addClass('fabric-data').text(data.fabric_name);

        this.sortDiv.append(this.sortHeader);
        this.sortDiv.append(this.sortData);

        div.append(this.sortDiv); // Append the detail div to td_1

        // Secondary information. Used when expanding data
        const secondaryDetails = [
            { heading: 'Designer:', data: data.designer },
            { heading: 'Fabric Line:', data: data.fabric_line },
            { heading: 'Rack:', data: data.rack_id },
            { heading: 'Stack:', data: data.stack_id },
            { heading: 'Style:', data: data.style },
            { heading: 'Colors:', data: data.color.sort().join(', ') },
            { heading: 'Tags:', data: data.tag.sort().join(', ') }
        ];

        // Create display for secondary details and give class reference for diplaying and hiding
        this.secondary_detail_div = $('<div>').addClass('second-stats').attr('id', `secondDetails-${data.fabric_id}`);
        div.append(this.secondary_detail_div)
        secondaryDetails.forEach(detail => {
            const detailDiv = $('<div>'); // Wrap each detail in a div

            const headerSpan = $('<span>').addClass('fabric-header').text(detail.heading);
            const dataSpan = $('<span>').addClass('fabric-data').text(detail.data);

            detailDiv.append(headerSpan);
            detailDiv.append(dataSpan);

            this.secondary_detail_div.append(detailDiv); // Append the detail div to td_1
        });

        // Down arrow looking for click event. Store self for updating
        this.down_div = $('<div>').addClass('down_arrow').attr('title', 'See More');
        div.append(this.down_div)

        // Store the complete table cell
        this.htmlObject = td;
    }
}


$(document).ready(function () {
    $.getJSON("/current_fabric_data", function (all_data) {
        // Load all fabric data and create Fabric classes for each item
        all_data.forEach(data => {
            fabric_data.push(new Fabric(data));
        });

        // Sort fabric by name
        fabric_data = sortFabric(fabric_data)

        // Display fabric
        display_fabric(fabric_data);
    });
});

function display_fabric(displayList) {
    // Update list of current fabrics
    currentList = displayList

    // Get current list of fabrics on page
    display_list = displayList.slice(pageNum * displayNum, pageNum * displayNum + displayNum)

    // Clear the table
    const fabric_table = $('#FabricTable');
    fabric_table.empty();

    // Display fabric in rows of 4
    let tr;
    display_list.forEach((fabric, i) => {
        loadIMG(fabric)
        if (i % 4 === 0) {
            tr = $('<tr>'); // Create a new table row
            fabric_table.append(tr);
        }
        tr.append(fabric.htmlObject); // Append the fabric cell to the row

        // Add fabric to drop down for reference when clicked
        fabric.down_div.data('ConnectedData', fabric)
    });

    // Update number of fabric found in search
    $('#numberOfFabric').html(displayList.length)

    // Update page numbers
    let pageNumStr
    if (displayList.length > 0) {
        pageNumStr = `${pageNum + 1} of ${pageNumbers(displayList)}`
    }
    else {
        pageNumStr = 'No Fabric Found'
    }
    $('#PageNumbersTop').html(pageNumStr)
    $('#PageNumbersBottom').html(pageNumStr)

    // Add checks for to-fabric being clicked
    const links = document.querySelectorAll('.to-fabric');
    links.forEach(link => {
        link.addEventListener('mouseup', function (event) {
            if (event.button === 0) {
                // Store data in local storage
                sessionStorage.setItem('SelectedFabric', link.title)
                sessionStorage.setItem('SelectedExt', fabric_data.find(fabric => fabric.data.fabric_name == link.title).data.image_type)
                
                window.location.href = 'add_inventory'
            }
        })
    })

    // Add check for down arrow being clicked
    const down_arrow_div = document.querySelectorAll('.down_arrow');
    down_arrow_div.forEach(option => {
        option.onclick = function (evt) {
            console.log(option)
            const option_jq = $(option)
            fabric = option_jq.data('ConnectedData')
            console.log(fabric)
            secondaryDetails = fabric.secondary_detail_div
            sortDiv = fabric.sortDiv

            if (secondaryDetails.hasClass('visible')) {
                // Hide secondary details and show sort detail
                secondaryDetails.removeClass('visible')
                sortDiv.addClass('visible')
                option_jq.removeClass('flip-arrow')
            }
            else {
                // Show secondary details and hide sort detail
                secondaryDetails.addClass('visible')
                sortDiv.removeClass('visible')
                option_jq.addClass('flip-arrow')
            }
        }
    })
}


const SortFabric = $('#SortFabric');
function sort_fabric() {
    // Sort fabric based on sort value
    const sortValue = SortFabric.val()

    currentList.forEach(fabric => {
        fabric.sortHeader.html(sortValue.replace(/\b\w/g, letter => letter.toUpperCase()))
        fabric.sortData.html(fabric.data[sortValue])
    })

    sortedList = sortFabric(currentList, sortValue);
    pageNum = 0;
    display_fabric(currentList);
}

// Change to sort value
SortFabric.change(event => {
    sort_fabric()
});

// Show next page
function nextPage() {
    if (pageNum + 1 === pageNumbers(currentList)) {
        return
    }
    pageNum += 1;
    display_fabric(currentList)
    if (pageNum + 1 === pageNumbers(currentList)) {
        return // Add logic to disable button. Also needs enbale logic in previous button. Should probably just create function to check button status
    }
}

// Show previous page
function prevPage() {
    if (pageNum === 0) {
        return
    }
    pageNum -= 1;
    display_fabric(currentList)
}

// Change asc desc status
function flip_sort() {
    const SortButton = $("#SortButton");
    if (SortButton.hasClass("rotate")) {
        asc_desc_sort = 1;
        SortButton.removeClass("rotate");
    } else {
        asc_desc_sort = -1;
        SortButton.addClass("rotate");
    }
    // Sort again instead of flipping because of null values
    sort_fabric()
}

function searchFabric() {
    // TODO add checking for searching the same thing
    let searchOptions = {}
    searchOptions['material'] = []
    searchOptions['cut'] = []
    searchOptions['style'] = []
    for (const key in searchOptions) {
        $(`input[name=${key}]:checked`).each(function () {
            // Push the value of each checked checkbox into the array
            searchOptions[key].push($(this).val());
        });
    }

    // Filter fabrics based on material, cut, and style
    let filteredList = fabric_data;
    for (const key in searchOptions) {
        // Only filter if an option was selected
        if (searchOptions[key].length != 0) {
            filteredList = filterFabric(filteredList, key, searchOptions[key]);
        }
    }

    // get max
    //const MinWidth = $('#MinWidth').val();
    //const MaxWidth = $('#MaxWidth').val();
    //const MinYardage = $('#MinYardage').val();
    //const MaxYardage = $('#MaxYardage').val();

    // Filter based on width. +() casts string to float
    filteredList = filterFabricRange(filteredList, 'width', +($('#MinWidth').val()), +($('#MaxWidth').val()));
    filteredList = filterFabricRange(filteredList, 'yardage', +($('#MinYardage').val()), +($('#MaxYardage').val()));

    // Search based on search box
    filteredList = filterSearch(filteredList, $('#SearchBar').val())

    // Reset page number
    pageNum = 0;
    display_fabric(filteredList);
}

// Update when search box recieves enter
SearchBar = document.getElementById('SearchBar')
SearchBar.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
        searchFabric()
    }
})