const UPLOAD_FOLDER = './fabric_uploads/';

let asc_desc_sort = 1;
let pageNum = 0;
let displayNum = 16;
let currentList = []

function pageNumbers(list) {
    return Math.ceil(list.length/displayNum)
}

function sortFabric(items, sort_attribute = "fabric_name") {
    console.log(`Sorting fabric by ${sort_attribute}`)
    return items.sort((a, b) => {
        let nameA, nameB;
        if (sort_attribute === "fabric_name") {
            nameA = a.data.fabric_name.toUpperCase().replace('-', '');
            nameB = b.data.fabric_name.toUpperCase().replace('-', '');
        } else {
            if (!a.data[sort_attribute]) {
                return 1;
            }
            if (!b.data[sort_attribute]) {
                return -1;
            }
                
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
    console.log(searchText)
    return items.filter(item => {
        return item.data.fabric_name.toUpperCase().includes(searchText.toUpperCase())
    })
}

function filterFabricRange(items, key, min_value, max_value) {
    console.log(`Filtering ${key}`)
    if (min_value) {
        console.log(min_value)
        items = items.filter(item => {
            return +(item.data[key]) >= min_value
        })
    }
    if (max_value) {
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
    this.img_added = true

    if (fabric.img_added) {
        // Already loaded
        return
    }
    fabric.img.attr('src', UPLOAD_FOLDER + fabric.data.image_path)
}

class Fabric {
    constructor(data) {
        this.data = data;
        const td = $('<td>').addClass('fabric-item-container');

        const div = $('<div>').addClass('table-width-div');
        td.append(div);

        const link = $('<div>')
            .addClass('fabric-heading')
            .addClass('to-fabric')
            .attr('title', data.fabric_name)
            .text(data.fabric_name);

        div.append(link);

        
        const img_link = $('<div>').addClass('to-fabric').attr('title', data.fabric_name);
        this.img = $('<img>')
            .addClass('fabric-image');

        img_link.append(this.img);
        div.append(img_link);

        // Create dictionary for Relevant Data
        const fabricDetails = [
            { heading: 'Material:', data: data.material },
            { heading: 'Cut:', data: data.cut },
            { heading: 'Width:', data: data.width },
            { heading: 'Yardage:', data: data.yardage },
        ];

        fabricDetails.forEach(detail => {
            const detailDiv = $('<div>'); // Wrap each detail in a div

            const headerSpan = $('<span>').addClass('fabric-header').text(detail.heading);
            const dataSpan = $('<span>').addClass('fabric-data').text(detail.data);

            detailDiv.append(headerSpan);
            detailDiv.append(dataSpan);

            div.append(detailDiv); // Append the detail div to td_1
        });

        const sortDiv = $('<div>')
        const sortHeader = $('<span>').addClass('fabric-header').text('Sort Option');
        const sortData = $('<span>').addClass('fabric-data').text(data.fabric_name);

        sortDiv.append(sortHeader);
        sortDiv.append(sortData);

        div.append(sortDiv); // Append the detail div to td_1

        const secondaryDetails = [
            { heading: 'Designer:', data: data.designer },
            { heading: 'Fabric Line:', data: data.fabric_line },
            { heading: 'Rack:', data: data.rack_id },
            { heading: 'Stack:', data: data.stack_id },
            { heading: 'Style:', data: data.style },
            { heading: 'Colors:', data: data.color.sort().join(', ') },
            { heading: 'Tags:', data: data.tag.sort().join(', ') }
        ];

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

        
        this.down_div = $('<div>').addClass('down_arrow').attr('title', 'See More').data('ConnectedData', self.secondary_detail_div);
        div.append(this.down_div)

        this.htmlObject = td; // Store the complete table cell
    }
}


let fabric_data = [];

$(document).ready(function () {
    $.getJSON("/current_fabric_data", function (all_data) {
        console.log(all_data);
        all_data.forEach(data => {
            fabric_data.push(new Fabric(data));
        });
        fabric_data = sortFabric(fabric_data)
        display_fabric(fabric_data);
    });
});

function display_fabric(displayList) {
    // Update number of fabric found in search
    $('#numberOfFabric').html(displayList.length)

    currentList = displayList
    display_list = displayList.filter(l => true).splice(pageNum * displayNum, displayNum)
    const fabric_table = $('#FabricTable');
    fabric_table.empty(); // Clear the table
    
    let tr;
    display_list.forEach((fabric, i) => {
        loadIMG(fabric)
        if (i % 4 === 0) {
            tr = $('<tr>'); // Create a new table row
            fabric_table.append(tr);
        }
        console.log(fabric)
        tr.append(fabric.htmlObject); // Append the fabric cell to the row
        fabric.down_div.data('ConnectedData', fabric.secondary_detail_div)
    });
    let pageNumStr
    if (displayList.length > 0) {
        pageNumStr = `${pageNum + 1} of ${pageNumbers(displayList)}`
    }
    else {
        pageNumStr = 'No Fabric Found'
    }
    $('#PageNumbersTop').html(pageNumStr)
    $('#PageNumbersBottom').html(pageNumStr)

    const links = document.querySelectorAll('.to-fabric');
    links.forEach(link => {
        link.addEventListener('mouseup', function (event) {
            if (event.button === 0) {
                console.log(link)
                sessionStorage.setItem('SelectedFabric', link.title)
                sessionStorage.setItem('SelectedExt', fabric_data.find(fabric => fabric.data.fabric_name == link.title).data.image_type)
                
                window.location.href = 'add_inventory'
            }
        })
    })

    const down_arrow_div = document.querySelectorAll('.down_arrow');
    down_arrow_div.forEach(option => {
        option.onclick = function (evt) {
            console.log(option)
            const option_jq = $(option)
            secondaryDetails = option_jq.data('ConnectedData')

            if (secondaryDetails.hasClass('visible')) {
                secondaryDetails.removeClass('visible')
                option_jq.removeClass('flip-arrow')
            }
            else {
                secondaryDetails.addClass('visible')
                option_jq.addClass('flip-arrow')
            }
        }
    })
}
const SortFabric = $('#SortFabric');
SortFabric.change(event => {
    const sortValue = event.target.value;
    sortedList = sortFabric(currentList, sortValue);
    if (sortedList == currentList) {
        return
    }
    pageNum = 0;
    display_fabric(currentList);
});

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
    currentList = currentList.reverse()
    display_fabric(currentList);
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

    let filteredList = fabric_data;
    for (const key in searchOptions) {
        const values = searchOptions[key];
        if (values.length != 0) {
            filteredList = filterFabric(filteredList, key, values);
        }
    }
    
    const MinWidth = $('#MinWidth').val();
    const MaxWidth = $('#MaxWidth').val();
    const MinYardage = $('#MinYardage').val();
    const MaxYardage = $('#MaxYardage').val();

    filteredList = filterFabricRange(filteredList, 'width', +(MinWidth), +(MaxWidth));
    filteredList = filterFabricRange(filteredList, 'yardage', +(MinYardage), +(MaxYardage));

    const searchVal = $('#SearchBar').val()
    filteredList = filterSearch(filteredList, searchVal)

    pageNum = 0;
    display_fabric(filteredList);
}

// Event Listener

SearchBar = document.getElementById('SearchBar')
SearchBar.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
        searchFabric()
    }
})