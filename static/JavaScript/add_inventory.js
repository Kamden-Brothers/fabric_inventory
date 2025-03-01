const NOT_APPLICABLE = 'NOT APPLICABLE';

let dropdown_data = {};
dropdown_data['collection'] = [];
dropdown_data['collection_new'] = [];
dropdown_data['designer'] = [];
dropdown_data['designer_new'] = [];
dropdown_data['fabric_line'] = [];
dropdown_data['fabric_line_new'] = [];
dropdown_data['current_colors'] = []; // List of connected colors
dropdown_data['color'] = [];
dropdown_data['color_new'] = [];
dropdown_data['tag'] = [];
dropdown_data['tag_new'] = [];
dropdown_data['current_tags'] = []; // List of connected tags

function uppercaseWords(text) {
    return text.replace(/(\s|^)\w/g, letter => letter.toUpperCase());
}

// Get URL Parameters
var sessionArgs = {};
function setArgs() {
    sessionArgs['fabric'] = sessionStorage.getItem('SelectedFabric')
    sessionArgs['ext'] = sessionStorage.getItem('SelectedExt')
}
setArgs();

function removeOption(text, list) {
    index = list.findIndex((element) => {
        return element.value == text;
    });
    if (index !== -1) {
        list.splice(index, 1);
    }
}

function addToArray(text, list) {
    if (!text) {
        return false;
    }
    if (NOT_APPLICABLE == text.toUpperCase()) {
        return false;
    }
    const lowerText = text.toLowerCase();
    if (!list.some(item => item.toLowerCase() === lowerText)) {
        list.push(text);
        return true;
    }

    return false;
}

function removeFromArray(text, list) {
    const index = list.findIndex(item => item.toLowerCase() === text.toLowerCase()); // Find the index of the item to remove
    if (index !== -1) {
        list.splice(index, 1); // Remove the item at index
        return true;
    }
    return false;
}

function createOption(text) {
    option = document.createElement('option');
    option.value = text;
    option.text = text;
    return option;
}

function update_dropdown(list, element_append, new_text, add_na, list_name) {
    list = list.sort((a, b) => {
        if (a.toLowerCase() < b.toLowerCase()) {
            return -1;
        }
        if (a.toLowerCase() > b.toLowerCase()) {
            return 1;
        }
        return 0;
    });
    element_append.innerHTML = "";

    if (add_na) {
        element_append.appendChild(createOption(NOT_APPLICABLE));
    }
    list.forEach((name) => {
        element_append.appendChild(createOption(name));
    });
    if (new_text) {
        element_append.value = new_text;
    }
}

function update_ul(list, element_append, list_name) {
    element_append.innerHTML = "";
    list.forEach((name) => {
        li = document.createElement("li");
        li.innerHTML = `<button class="x_button" onclick="delete_list_item('${name}', '${list_name}')">&times;</button><span>${name}</span>`;

        element_append.appendChild(li);
    });
}

function add_list_item(list_name) {
    text = document.getElementById(list_name).value;
    tag_list = document.getElementById(list_name + "_list");
    addToArray(text, dropdown_data[`current_${list_name}s`]);

    update_ul(dropdown_data[`current_${list_name}s`], tag_list, list_name);
}

function delete_list_item(name, list_name) {
    tag_list = document.getElementById(list_name + "_list");

    removeFromArray(name, dropdown_data[`current_${list_name}s`]);

    update_ul(dropdown_data[`current_${list_name}s`], tag_list, list_name);
}

function add_data(list_name) {
    let add_na = (list_name !== 'color' && list_name !== 'tag');

    const text_box = document.getElementById(list_name + "_add_remove");
    let text = text_box.value;
    text = uppercaseWords(text);

    const collection_dropdown = document.getElementById(list_name);
    if (addToArray(text, dropdown_data[list_name])) {
        addToArray(text, dropdown_data[list_name + '_new'])
        update_dropdown(dropdown_data[list_name], collection_dropdown, text, add_na, list_name);

    } else if (text) {
        dropdown_data[list_name].forEach(item => {
            if (item.toLowerCase() == text.toLowerCase()) {
                collection_dropdown.value = item;
            }
        });
    }
}


function removeFromDropdown(list_name, text) {
    let add_na = (list_name !== 'color' && list_name !== 'tag');
    collection_dropdown = document.getElementById(list_name);

    if (removeFromArray(text, dropdown_data[list_name])) {
        update_dropdown(dropdown_data[list_name], collection_dropdown, null, add_na, list_name);

        if (dropdown_data[`current_${list_name}s`]) {
            delete_list_item(text, list_name);
        }
    }
}


let persistent_list_name;

function delete_data(list_name) {
    persistent_list_name = list_name;

    // Current text being removed from dropdown and database
    const text = document.getElementById(list_name + "_add_remove").value;
    if (removeFromArray(text, dropdown_data[list_name + '_new'])) {
        removeFromDropdown(list_name, text)
        return
    }
    
    if (dropdown_data[list_name].find(item => item.toLowerCase() === text.toLowerCase())) {
        postData = { list_name: list_name, text_value: text }

        $.ajax({
            url: '/connected_items',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(postData),
            success: function (data) {
                if (data.result) {
                    // Item was found in data base. Update remove message and show Bootstrap popup
                    const removeMessage = document.getElementById('removeMessage')
                    removeMessage.innerHTML = `Do you want to remove ${text} from ${uppercaseWords(list_name)}<br />This will effect ${data.connections} item(s)`
                    $('#removeItem').modal('show');
                }
                else {
                    // Error occured trying to get item from database
                    alert(`Failed to get item data. Error: "${data.error_msg}"`)
                }
            },
            error: function (xhr, status, error) {
                console.error('Error:', error);
                alert(`Failed to get item data. Error: "${error}"`)
                return
            }
        })        
    }
}

function deleteOption() {

    const text = document.getElementById(persistent_list_name + "_add_remove").value;

    postData = { list_name: persistent_list_name, text_value: text }
    console.log(postData)
    $.ajax({
        url: '/delete_data',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(postData),
        success: function (data) {
            if (data.result) {
                removeFromDropdown(persistent_list_name, text)
                sessionArgs.clear();
                
                update_all_fabric();
            }
            else {
                alert(`Error removing {text} from ${persistent_list_name}. ${data.error_msg}`)
            }
        },
        error: function (xhr, status, error) {
            alert(`Error removing {text} from ${persistent_list_name}. ${error}`)
        }
    });

}

const selectElements = document.querySelectorAll('.input-select');
selectElements.forEach(select => {
    // Uncomment and comment out mouseup to just have event called on change
    //select.addEventListener('change', (event) => {
    //    const inputText = event.target.value;
    //    const relatedInput = document.getElementById(event.target.id + '_add_remove');
    //    if (relatedInput) {
    //        relatedInput.value = inputText;
    //    }
    //});

    // Update text box whenever dropdown is clicked
    select.addEventListener('mouseup', function () {
        const inputText = select.value;
        const relatedInput = document.getElementById(event.target.id + '_add_remove');
        if (relatedInput) {
            relatedInput.value = inputText;
        }
    });
});

const update_fabric = document.getElementById('update_box');
update_fabric.addEventListener('change', (event) => {
    let change_value = event.target.value;
    if (change_value == NOT_APPLICABLE) {
        console.log('clear')
        sessionStorage.clear();
        setArgs()
        console.log(sessionStorage.getItem('ext'))
        updatePage();
        return
    }
    $.getJSON(`/get_specific_fabric?fabric=${encodeURIComponent(change_value)}`, fabricData => {
        if (fabricData.error_msg) {
            alert('Failed to get fabric ' + change_value)
            return
        }

        sessionStorage.setItem('SelectedFabric', fabricData.fabric_name)
        sessionStorage.setItem('SelectedExt', fabricData.image_type)
        // Update page to new arguments
        setArgs();
        updatePage();
    });
});

const multiple_attributes = document.querySelectorAll('.input-text-box');
multiple_attributes.forEach(select => {
    select.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            const inputID = event.target.id.split('_')[0];
            add_data(inputID);
        } else if (event.key == 'Delete') {
            const inputID = event.target.id.split('_')[0];
            delete_data(inputID);
        }
    });
});

const fabric_name = document.getElementById('name_box');
const fabric_name_box = document.getElementById('fabric_name_box');
fabric_name.addEventListener('keyup', function (event) {
    fabric_name_box.innerHTML = uppercaseWords(fabric_name.value);
});

function get_radio(name) {
    let selected = document.querySelector(`input[name="${name}"]:checked`);
    if (selected) {
        let val = selected.value;
        if ('no_style' === val) {
            return null;
        }
        return val;
    }
    if (name !== 'style') {
        throw new Error(`${name} is required`);
    }
    return null;
}

function deleteFabricWarning() {
    if (!sessionArgs.fabric) {
        console.log("No Fabric Loaded")
        return
    }
    const removeMessage = document.getElementById('DeleteFabricMessage')
    removeMessage.innerHTML = `Remove Fabric <u>${sessionArgs.fabric}</u>?`

    $('#deleteModal').modal('show');

}

function deleteFabric() {

    // Prepare FormData for the AJAX request
    const formData = new FormData();
    formData.append('name', sessionArgs.fabric);

    $.ajax({
        type: "POST",
        url: "/delete_fabric",
        contentType: false,
        processData: false,
        data: formData,
        success: (response) => {
            if (response.result) {
                sessionStorage.clear();
                setArgs();
                resetPage();
                update_all_fabric();

                if (response.debug_msg) {
                    alert('Fabric Deleted\nDebug message: ' + response.debug_msg);
                } else {
                    alert('Fabric Deleted');
                }
            } else {
                alert(response.error_msg);
            }
        },
        error: (jqXHR, textStatus, errorThrown) => {
            console.error('Error during deletion:', textStatus, errorThrown);
        }
    });
}

let data_to_submit;

function submitData() {
    function check_no_data(elementID, required = false) {
        const data_value = document.getElementById(elementID).value;
        if (data_value.trim() === '' || data_value === NOT_APPLICABLE) {
            if (required) {
                throw new Error(`${elementID} is required`);
            }
            return null;
        }
        return data_value;
    }


    function checkCorrectData(data) {
        if (/_/.test(data.name)) {
            throw new Error("Fabric name cannot contain underscore");
        }
    }

    let param = {
        data: {}
    };
    try {
        param.data['name'] = uppercaseWords(check_no_data('name_box', true));
        param.data['collection'] = check_no_data('collection');
        param.data['designer'] = check_no_data('designer');
        param.data['fabric_line'] = check_no_data('fabric_line');
        param.data['selvage'] = '';
        param.data['width'] = check_no_data('width', true);
        param.data['yardage'] = check_no_data('yardage', true);
        param.data['rack'] = check_no_data('rack');
        param.data['stack'] = check_no_data('stack');
        param.data['color'] = dropdown_data['current_colors'];
        param.data['tag'] = dropdown_data['current_tags'];

        param.data['ext'] = document.getElementById('ext_box').textContent;
        const ext = param.data.ext.toLowerCase();
        if (ext !== '.jpg' & ext !== '.jpeg' & ext !== '.png') {
            console.log(ext)
            throw new Error('Image must be of type jpg, jpeg, or png')
        }

        param.data['material'] = get_radio('material');
        param.data['cut'] = get_radio('cut');
        param.data['style'] = get_radio('style');

        param.data['real_name'] = document.getElementById('realName').checked

        const imageInput = document.getElementById('imageInput');
        const imageFile = imageInput.files[0]; // Get the selected file
        if (imageFile) {
            param.data['image'] = imageFile; // Add the image file to param
        }

        param.data['old_fabric'] = '';
        param.data['old_ext'] = '';
        if (sessionArgs) {
            if (sessionArgs.fabric) {
                param.data['old_fabric'] = sessionArgs.fabric;
            }
            if (sessionArgs.ext) {
                param.data['old_ext'] = sessionArgs.ext;
            }
        }
        checkCorrectData(param.data);
    } catch (error) {
        alert(error.message);
        return;
    }

    if (param.data.old_fabric) {
        if (param.data.old_fabric.toLowerCase() != param.data.name.toLowerCase()) {
            // Update or New Fabric
            $('#newFabric').show().prop('checked', true);
            $('#newFabricLabel').show().html(`Add Fabric: "${param.data.name}"`);
            $('#updateFabric').show();
            $('#updateFabricLabel').show().html(`Update Fabric: "${param.data.old_fabric}" -> "${param.data.name}"`);
        }
        else
        {
            // Update Fabric
            $('#newFabric').hide();
            $('#newFabricLabel').hide();
            $('#updateFabric').show().prop('checked', true);
            $('#updateFabricLabel').show().html(`Update Fabric: "${param.data.name}"`);
        }
    }
    else
    {
        // New Fabric
        $('#newFabric').show().prop('checked', true);
        $('#newFabricLabel').show().html(`Add Fabric: "${param.data.name}"`);
        $('#updateFabric').hide();
        $('#updateFabricLabel').hide();
    }

    if (localStorage.getItem('removeData')) {
        $('#keepData').prop('checked', false);
    }
    else {
        $('#keepData').prop('checked', true);
    }

    $('#submitModal').modal('show');
    data_to_submit = param
}

function submit() {
    // Check update or new
    if (get_radio('newUpdate') == 'New') {
        data_to_submit.data.old_fabric = '';
        data_to_submit.data.old_ext = '';
    }

    // Prepare FormData for the AJAX request
    const formData = new FormData();
    for (const key in data_to_submit.data) {
        // If the value is an array, append each item with the same key
        if (Array.isArray(data_to_submit.data[key])) {
            data_to_submit.data[key].forEach(item => {
                formData.append(key, item);
            });
        } else {
            formData.append(key, data_to_submit.data[key]);
        }
    }

    $.ajax({
        type: "POST",
        url: "/submit_collection",
        contentType: false,
        processData: false,
        data: formData,
        success: (response) => {
            if (response.result) {
                sessionStorage.clear()
                setArgs();

                if ($('#keepData').is(':checked')) {
                    localStorage.setItem('removeData', false)
                }
                else {
                    resetPage()
                    localStorage.setItem('removeData', true)
                }
                if (response.debug_msg) {
                    alert('Fabric added\nDebug message: ' + response.debug_msg);
                } else {
                    alert('Fabric Added');
                }
                update_all_fabric();
            } else {
                alert(response.error_msg);
            }
        },
        error: (jqXHR, textStatus, errorThrown) => {
            console.error('Error during submission:', textStatus, errorThrown);
        }
    });
}

function update_single_dropdowns() {
    const dropdown_names = ['collection', 'designer', 'fabric_line']
    dropdown_names.forEach(list_name => {
        const collection_dropdown = document.getElementById(list_name);
        update_dropdown(dropdown_data[list_name], collection_dropdown, null, true, list_name);
    });
}

function update_multi_dropdowns() {
    const multitags = ['tag', 'color']
    multitags.forEach(list_name => {
        const collection_dropdown = document.getElementById(list_name);
        update_dropdown(dropdown_data[list_name], collection_dropdown, null, false);

        tag_list = document.getElementById(list_name + "_list");
        update_ul(dropdown_data[`current_${list_name}s`], tag_list, list_name);
    });
}

function setImage(imagePath) {
    const imageInput = document.getElementById('imageInput');

    fetch(imagePath)
        .then(res => res.blob())
        .then(blob => {
            const file = new File([blob], 'First_Fabric.jpeg', { type: blob.type });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            imageInput.files = dataTransfer.files; // Set the file input

            displayImage(file);
        })
        .catch(error => console.error('Error setting image:', error));
}

function resetPage() {
    // Reset text boxes
    document.getElementById("name_box").value = "";
    document.getElementById("rack").value = "";
    document.getElementById("stack").value = "";
    document.getElementById("width").value = "";
    document.getElementById("yardage").value = "";

    // Remove all tags and colors
    dropdown_data['current_colors'] = [];
    dropdown_data['current_tags'] = [];
    update_multi_dropdowns();

    // Reset image data
    document.getElementById("fabric_name_box").innerHTML = "Fabric Name";
    document.getElementById('ext_box').innerHTML = ".ext";
    clearImage();

    // Set Radio buttons to first option
    document.getElementById('cotton').checked = true; // Update Material
    document.getElementById('uncut').checked = true;  // Update Cut
    document.getElementById('no_style').checked = true; // Update Style

    document.getElementById("collection").value = NOT_APPLICABLE;
    document.getElementById("designer").value = NOT_APPLICABLE;
    document.getElementById("fabric_line").value = NOT_APPLICABLE;

    //document.getElementById('realName').checked = false; // Leave real name the same
}

function update_all_fabric() {
    $.getJSON('/all_fabric_names', fabric_names => {
        const update_fabric_box = document.getElementById('update_box');
        let new_text = null;
        if (sessionArgs) {
            if (sessionArgs.fabric) {
                new_text = sessionArgs.fabric.replace(/_/g, ' ');
            }
        }
        else {
            new_text = NOT_APPLICABLE;
        }

        update_dropdown(fabric_names, update_fabric_box, new_text, true, 'update_box');
    });
}

function updatePage() {
    $.getJSON("/current_data", function (result) {

        dropdown_data['tag'] = result['tag'];
        dropdown_data['collection'] = result['collection_name'];
        dropdown_data['color'] = result['color'];
        dropdown_data['designer'] = result['designer'];
        dropdown_data['fabric_line'] = result['fabric_line'];
        update_single_dropdowns();

        resetPage();

        update_all_fabric();

        if (sessionArgs) {
            if (sessionArgs.fabric) {
                console.log(sessionArgs.fabric)
                $.getJSON(`/get_specific_fabric?fabric=${encodeURIComponent(sessionArgs.fabric)}`, fabricData => {
                    if (fabricData.error_msg) {
                        document.getElementById("name_box").value = 'Failed to load: ' + sessionArgs.fabric;
                        sessionStorage.clear()
                        setArgs();
                        return;
                    }
                    // Set fabric name
                    document.getElementById("name_box").value = fabricData.fabric_name;

                    console.log(fabricData)
                    // Set material
                    document.getElementById(fabricData.material.toLowerCase()).checked = true;

                    document.getElementById('realName').checked = fabricData.real_name

                    document.getElementById("collection").value = fabricData.collection;
                    document.getElementById("designer").value = fabricData.designer;
                    document.getElementById("fabric_line").value = fabricData.fabric_line;

                    // Set rack and stack
                    document.getElementById("rack").value = fabricData.rack_id;
                    document.getElementById("stack").value = fabricData.stack_id;

                    // Set width and yardage
                    document.getElementById("width").value = fabricData.width;
                    document.getElementById("yardage").value = fabricData.yardage;

                    document.getElementById("fabric_name_box").innerHTML = fabricData.fabric_name;

                    // Set style
                    if (fabricData.style) {
                        document.getElementById(fabricData.style.toLowerCase().replace(/: | /g, "_")).checked = true;
                    }

                    // Set cut
                    if (fabricData.cut) {
                        document.getElementById(fabricData.cut.toLowerCase().replace(/ /g, "_")).checked = true;
                    }
                    dropdown_data['current_colors'] = fabricData.color;
                    dropdown_data['current_tags'] = fabricData.tag;
                    update_multi_dropdowns();

                    setImage('fabric_uploads\\' + fabricData.fabric_name.replace(/ /g, "_").replace(/[^a-zA-Z0-9\s_-]/g, '') + fabricData.image_type);
                });
            }
        }
    });
}
updatePage();

$.get('/ip_address', function (ipaddress) {
    $('#IP-address').html(ipaddress)
});