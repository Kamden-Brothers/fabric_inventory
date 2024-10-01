const NOT_APPLICABLE = 'NOT APPLICABLE';

let dropdown_data = {};
dropdown_data['collection'] = [];
dropdown_data['designer'] = [];
dropdown_data['fabric_line'] = [];
dropdown_data['current_colors'] = [];
dropdown_data['color'] = [];
dropdown_data['tag'] = [];
dropdown_data['current_tags'] = [];

function uppercaseWords(text) {
    return text.replace(/\b\w/g, letter => letter.toUpperCase());
}

// Get URL Parameters
var urlParams = {};
function updateURL() {
    (window.onpopstate = function () {
        var match,
            pl = /_/g,  // Regex for replacing addition symbol with a space
            search = /([^&=]+)=?([^&]*)/g,
            decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
            query = window.location.search.substring(1);

        urlParams = {};
        while (match = search.exec(query)) {
            urlParams[decode(match[1])] = decode(match[2]);
        }
    })();
}
updateURL();

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
    const index = list.findIndex(item => item.toLowerCase() === text.toLowerCase()); // Find the index of the item
    if (index !== -1) {
        list.splice(index, 1); // Remove the item at that index
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

function update_dropdown(list, element_append, new_text, add_na = true) {
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
        li.innerHTML = `<button class="x_button" onclick="delete_list_item('${name}', '${list_name}')">x</button><span>${name}</span>`;

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
    console.log(name);
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
        update_dropdown(dropdown_data[list_name], collection_dropdown, text, add_na);
        // text_box.value = "";
    } else if (text) {
        dropdown_data[list_name].forEach(item => {
            if (item.toLowerCase() == text.toLowerCase()) {
                collection_dropdown.value = item;
            }
        });
    }
}

function delete_data(list_name) {
    let add_na = (list_name !== 'color' && list_name !== 'tag');

    text_box = document.getElementById(list_name + "_add_remove");
    text = text_box.value;
    collection_dropdown = document.getElementById(list_name);


    if (dropdown_data[list_name].find(item => item.toLowerCase() === text.toLowerCase())) {
        //$.getJSON('check_dropdown_delete') {
        //}

        $('#removeItem').modal('show');

        if (removeFromArray(text, dropdown_data[list_name])) {
            update_dropdown(dropdown_data[list_name], collection_dropdown, null, add_na);
            // text_box.value = "";

            if (dropdown_data[`current_${list_name}s`]) {
                delete_list_item(text, list_name);
            }
        }
    }
}

const selectElements = document.querySelectorAll('.input-select');
selectElements.forEach(select => {
    select.addEventListener('change', (event) => {
        const inputText = event.target.value;
        const relatedInput = document.getElementById(event.target.id + '_add_remove');
        if (relatedInput) {
            relatedInput.value = inputText;
        }
    });
});

const update_fabric = document.getElementById('update_box');
update_fabric.addEventListener('change', (event) => {
    let change_value = event.target.value;
    console.log(change_value);
    $.getJSON(`/get_specific_fabric?fabric=${change_value}`, fabricData => {
        console.log(fabricData);

        let newUrl = 'add_inventory?fabric=' + fabricData.fabric_name.replace(/ /g, "_") + "&ext=" + fabricData.image_type;
        window.history.pushState({ path: newUrl }, '', newUrl);

        // Update page to new arguments
        updateURL();
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
        param.data['selvage'] = check_no_data('selvage');
        param.data['width'] = check_no_data('width', true);
        param.data['yardage'] = check_no_data('yardage', true);
        param.data['rack'] = check_no_data('rack');
        param.data['stack'] = check_no_data('stack');
        param.data['color'] = dropdown_data['current_colors'];
        param.data['tag'] = dropdown_data['current_tags'];

        param.data['ext'] = document.getElementById('ext_box').textContent;

        param.data['material'] = get_radio('material');
        param.data['cut'] = get_radio('cut');
        param.data['style'] = get_radio('style');

        const imageInput = document.getElementById('imageInput');
        console.log(imageInput);
        const imageFile = imageInput.files[0]; // Get the selected file
        if (imageFile) {
            console.log(imageFile);
            param.data['image'] = imageFile; // Add the image file to param
        }

        param.data['old_fabric'] = '';
        param.data['old_ext'] = '';
        if (urlParams) {
            if (urlParams.fabric) {
                param.data['old_fabric'] = urlParams.fabric;
            }
            if (urlParams.ext) {
                param.data['old_ext'] = urlParams.ext;
            }
        }
        checkCorrectData(param.data);
    } catch (error) {
        alert(error.message);
        throw error;
        return;
    }

    // Prepare FormData for the AJAX request
    const formData = new FormData();
    for (const key in param.data) {
        // If the value is an array, append each item with the same key
        if (Array.isArray(param.data[key])) {
            param.data[key].forEach(item => {
                formData.append(key, item);
            });
        } else {
            formData.append(key, param.data[key]);
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
                console.log('Successfully run');
                if (response.debug_msg) {
                    alert('Fabric added\nDebug message: ' + response.debug_msg);
                } else {
                    alert('Fabric Added');
                }
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
    ['collection', 'designer', 'fabric_line'].forEach(list_name => {
        const collection_dropdown = document.getElementById(list_name);
        update_dropdown(dropdown_data[list_name], collection_dropdown);
    });
}

function update_multi_dropdowns() {
    ['tag', 'color'].forEach(list_name => {
        const collection_dropdown = document.getElementById(list_name);
        update_dropdown(dropdown_data[list_name], collection_dropdown, null, false);

        tag_list = document.getElementById(list_name + "_list");
        update_ul(dropdown_data[`current_${list_name}s`], tag_list, list_name);
    });
}

function setImage(imagePath) {
    console.log(imagePath);
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

function updatePage() {
    $.getJSON("/current_data", function (result) {
        console.log(result);

        dropdown_data['tag'] = result['tag'];
        dropdown_data['collection'] = result['collection_name'];
        dropdown_data['color'] = result['color'];
        dropdown_data['designer'] = result['designer'];
        dropdown_data['fabric_line'] = result['fabric_line'];
        update_single_dropdowns();

        $.getJSON('/all_fabric_names', fabric_names => {
            const update_fabric_box = document.getElementById('update_box');
            console.log(fabric_names);
            let new_text = null;
            if (urlParams) {
                if (urlParams.fabric) {
                    new_text = urlParams.fabric.replace(/_/g, ' ');
                }
            }
            update_dropdown(fabric_names, update_fabric_box, new_text, true);
        });

        if (urlParams) {
            if (urlParams.fabric) {
                console.log(urlParams.fabric);
                $.getJSON(`/get_specific_fabric?fabric=${urlParams.fabric}`, fabricData => {
                    console.log(fabricData);

                    // Set fabric name
                    document.getElementById("name_box").value = fabricData.fabric_name;

                    // Set material
                    document.getElementById(fabricData.material.toLowerCase()).checked = true;

                    document.getElementById("collection").value = fabricData.collection;
                    document.getElementById("designer").value = fabricData.designer;
                    document.getElementById("fabric_line").value = fabricData.fabric_line;

                    // Set year on selvage
                    document.getElementById("selvage").value = fabricData.year_on_selvage;

                    // Set rack and stack
                    document.getElementById("rack").value = fabricData.rack_id;
                    document.getElementById("stack").value = fabricData.stack_id;

                    // Set width and yardage
                    document.getElementById("width").value = fabricData.width;
                    document.getElementById("yardage").value = fabricData.yardage;

                    document.getElementById("fabric_name_box").innerHTML = fabricData.fabric_name;

                    // Set style
                    if (fabricData.style) {
                        console.log(fabricData.style);
                        document.getElementById(fabricData.style.toLowerCase().replace(/: | /g, "_")).checked = true;
                    }

                    // Set cut
                    if (fabricData.cut) {
                        document.getElementById(fabricData.cut.toLowerCase().replace(/ /g, "_")).checked = true;
                    }

                    dropdown_data['current_colors'] = fabricData.color;
                    dropdown_data['current_tags'] = fabricData.tag;
                    update_multi_dropdowns();

                    setImage('fabric_uploads\\' + fabricData.fabric_name.replace(/ /g, "_") + fabricData.image_type);
                });
            }
        }
    });
}
updatePage();