const UPLOAD_FOLDER = './fabric_uploads/'




class Fabric {
    constructor(data) {
        this.data = data;

        let tr = document.createElement('tr');

        let fabric_ref = 'add_inventory?fabric=' + data.fabric_name.replace(/ /g, "_") + "&ext=" + data.image_type;

        // Create first table cell for the image
        let td_1 = document.createElement('td');
        let img_link = document.createElement('a');
        img_link.href = fabric_ref;

        let img = document.createElement('img');
        img.src = UPLOAD_FOLDER + data.fabric_name.replace(/ /g, "_") + data.image_type;
        img.classList.add("FabricImage");

        td_1.classList.add('FabricImageContainer');
        img_link.appendChild(img);
        td_1.appendChild(img_link);
        tr.appendChild(td_1);

        // Create second table cell for the fabric name link
        let td_2 = document.createElement('td');
        let link = document.createElement('a');
        link.classList.add('FabricHeading')
        link.href = fabric_ref;
        link.title = data.fabric_name + ' Other';
        link.textContent = data.fabric_name;

        td_2.appendChild(link);
        tr.appendChild(td_2);

        // Create dictionary for Relevant Data
        const fabricDetails = [
            { heading: 'Cut:', data: data.cut },
            { heading: 'Designer:', data: data.designer },
            { heading: 'Fabric Line:', data: data.fabric_line },
            { heading: 'Material:', data: data.material },
            { heading: 'Rack:', data: data.rack_id },
            { heading: 'Stack:', data: data.stack_id },
            { heading: 'Width:', data: data.width },
            { heading: 'Yardage:', data: data.yardage },
            { heading: 'Style:', data: data.style },
            { heading: 'Colors:', data: data.color.sort().join(', ') },
            { heading: 'Tags:', data: data.tag.sort().join(', ') }
        ];

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

            td_2.appendChild(detailDiv); // Append the detail div to td_2
        });


        this.htmlObject = tr; // Store the complete table row
    }
}

var fabric_data = []


$.getJSON("/current_fabric_data", function (all_data) {
    console.log(all_data)
    all_data.forEach(data => {
        fabric_data.push(new Fabric(data))
    })
    fabric_table = document.getElementById('FabricTable')

    fabric_data.forEach(fabric => {
        fabric_table.appendChild(fabric.htmlObject)
    })

})

