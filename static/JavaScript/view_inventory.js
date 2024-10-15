const UPLOAD_FOLDER = './fabric_uploads/'




class Fabric {
    constructor(data) {
        this.data = data;

        let fabric_ref = 'add_inventory?fabric=' + data.fabric_name.replace(/ /g, "_") + "&ext=" + data.image_type;

        // Create first table cell for the image
        const td_1 = document.createElement('td');
        let img_link = document.createElement('a');
        img_link.href = fabric_ref;

        let img = document.createElement('img');
        img.src = UPLOAD_FOLDER + data.fabric_name.replace(/ /g, "_") + data.image_type;
        img.classList.add("FabricImage");

        td_1.classList.add('FabricItemContainer');
        img_link.appendChild(img);
        td_1.appendChild(img_link);

        // Create second table cell for the fabric name link
        let link = document.createElement('a');
        link.classList.add('FabricHeading')
        link.href = fabric_ref;
        link.title = data.fabric_name + ' Other';
        link.textContent = data.fabric_name;

        td_1.appendChild(link);

        const expanded_data_div = document.createElement('div')

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
        ]

        fabricDetails.forEach(detail => {
            let detailDiv = document.createElement('div'); // Wrap each detail in a div

            let headerSpan = document.createElement('span');
            headerSpan.classList.add('FabricHeader');
            headerSpan.textContent = detail.heading;
            detailDiv.appendChild(headerSpan);

            let dataSpan = document.createElement('span');
            dataSpan.classList.add('FabricData');
            dataSpan.textContent = detail.data;
            detailDiv.appendChild(dataSpan);

            td_1.appendChild(detailDiv); // Append the detail div to td_2
        });


        this.htmlObject = td_1; // Store the complete table row
    }
}

var fabric_data = []


$.getJSON("/current_fabric_data", function (all_data) {
    console.log(all_data)
    all_data.forEach(data => {
        fabric_data.push(new Fabric(data))
    })
    fabric_table = document.getElementById('FabricTable')

    let i = 0;
    let tr
    fabric_data.forEach(fabric => {
        if (i % 4 === 0) {
            tr = document.createElement('tr');
            fabric_table.appendChild(tr);
        }
        tr.appendChild(fabric.htmlObject);
        i += 1;
    })

})

