const UPLOAD_FOLDER = './fabric_uploads/';

let asc_desc_sort = 1;
let currentFabric;

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

class Fabric {
    constructor(data) {
        this.data = data;

        const td_1 = $('<td>').addClass('FabricItemContainer');

        const link = $('<div>')
            .addClass('FabricHeading')
            .addClass('ToFabric')
            .attr('title', data.fabric_name)
            .text(data.fabric_name);

        td_1.append(link);

        const img_link = $('<div>').addClass('ToFabric').attr('title', data.fabric_name);
        const img = $('<img>')
            .attr('src', UPLOAD_FOLDER + data.image_path)
            .addClass('FabricImage');

        img_link.append(img);
        td_1.append(img_link);

        // Create dictionary for Relevant Data
        const fabricDetails = [
            { heading: 'Material:', data: data.material },
            { heading: 'Cut:', data: data.cut },
            { heading: 'Width:', data: data.width },
            { heading: 'Yardage:', data: data.yardage },
        ];

        const secondaryDetails = [
            { heading: 'Designer:', data: data.designer },
            { heading: 'Fabric Line:', data: data.fabric_line },
            { heading: 'Rack:', data: data.rack_id },
            { heading: 'Stack:', data: data.stack_id },
            { heading: 'Style:', data: data.style },
            { heading: 'Colors:', data: data.color.sort().join(', ') },
            { heading: 'Tags:', data: data.tag.sort().join(', ') }
        ];

        fabricDetails.forEach(detail => {
            const detailDiv = $('<div>'); // Wrap each detail in a div

            const headerSpan = $('<span>').addClass('FabricHeader').text(detail.heading);
            const dataSpan = $('<span>').addClass('FabricData').text(detail.data);

            detailDiv.append(headerSpan);
            detailDiv.append(dataSpan);

            td_1.append(detailDiv); // Append the detail div to td_1
        });

        this.htmlObject = td_1; // Store the complete table cell
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
        currentFabric = fabric_data
        display_fabric(currentFabric);
    });
});

function display_fabric(f_list) {
    const fabric_table = $('#FabricTable');
    fabric_table.empty(); // Clear the table

    let tr;
    f_list.forEach((fabric, i) => {
        if (i % 4 === 0) {
            tr = $('<tr>'); // Create a new table row
            fabric_table.append(tr);
        }
        tr.append(fabric.htmlObject); // Append the fabric cell to the row
    });


    const links = document.querySelectorAll('.ToFabric');
    links.forEach(link => {
        link.addEventListener('mouseup', function (event) {
            if (event.button === 0) {
                console.log(event)
                console.log(link.title)
                sessionStorage.setItem('SelectedFabric', link.title)
                sessionStorage.setItem('SelectedExt', fabric_data.find(fabric => fabric.data.fabric_name == link.title).data.image_type)
                
                window.location.href = 'add_inventory'
            }
        })            
    })
}
const SortFabric = $('#SortFabric');
SortFabric.change(event => {
    const sortValue = event.target.value;
    currentFabric = sortFabric(currentFabric, sortValue);
    display_fabric(currentFabric);
});

// Change asc desc status
function flip_sort() {
    const SortButton = $("#SortButton");
    if (SortButton.hasClass("Rotate")) {
        asc_desc_sort = 1;
        SortButton.removeClass("Rotate");
    } else {
        asc_desc_sort = -1;
        SortButton.addClass("Rotate");
    }
    currentFabric = currentFabric.reverse()
    display_fabric(currentFabric);
}

function searchFabric() {
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

    let currentFabric = fabric_data;
    for (const key in searchOptions) {
        const values = searchOptions[key];
        if (values.length != 0) {
            currentFabric = filterFabric(currentFabric, key, values);
        }
    }
    
    const MinWidth = $('#MinWidth').val();
    const MaxWidth = $('#MaxWidth').val();
    const MinYardage = $('#MinYardage').val();
    const MaxYardage = $('#MaxYardage').val();

    currentFabric = filterFabricRange(currentFabric, 'width', +(MinWidth), +(MaxWidth));
    currentFabric = filterFabricRange(currentFabric, 'yardage', +(MinYardage), +(MaxYardage));

    display_fabric(currentFabric);
}
