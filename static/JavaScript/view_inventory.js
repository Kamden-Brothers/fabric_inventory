const UPLOAD_FOLDER = './fabric_uploads/';

class Fabric {
    constructor(data) {
        this.data = data;

        let fabric_ref = 'add_inventory?fabric=' + data.fabric_name.replace(/ /g, "_") + "&ext=" + data.image_type;

        // Create first table cell for the image
        const td_1 = $('<td>').addClass('FabricItemContainer');

        const img_link = $('<a>').attr('href', fabric_ref);
        const img = $('<img>')
            .attr('src', UPLOAD_FOLDER + data.fabric_name.replace(/ /g, "_") + data.image_type)
            .addClass('FabricImage');

        img_link.append(img);
        td_1.append(img_link);

        // Create second table cell for the fabric name link
        const link = $('<a>')
            .addClass('FabricHeading')
            .attr('href', fabric_ref)
            .attr('title', data.fabric_name + ' Other')
            .text(data.fabric_name);

        td_1.append(link);

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

        display_fabric();
    });
});

function display_fabric() {
    const fabric_table = $('#FabricTable');
    fabric_table.empty(); // Clear the table

    let tr;
    fabric_data.forEach((fabric, i) => {
        if (i % 4 === 0) {
            tr = $('<tr>'); // Create a new table row
            fabric_table.append(tr);
        }
        tr.append(fabric.htmlObject); // Append the fabric cell to the row
    });
}

function searchFabric() {
    console.log('clicked');
}
