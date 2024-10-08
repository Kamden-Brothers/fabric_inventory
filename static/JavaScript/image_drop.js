const dropArea = document.getElementById('drop-area');
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('image-preview');

// Prevent default drag behaviors
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
});

// Highlight drop area when item is dragged over
['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false);
});
['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false);
});

// Handle dropped files
dropArea.addEventListener('drop', handleDrop, false);
dropArea.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = e => {
        const file = e.target.files[0];
        if (file) {
            displayImage(file);
        }
    };
    input.click();
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight() {
    dropArea.classList.add('highlight');
}

function unhighlight() {
    dropArea.classList.remove('highlight');
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;

    if (files.length) {
        displayImage(files[0]);
    }
}

function displayImage(file) {
    imageInput.files = new DataTransfer().files; // Clear previous files
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    imageInput.files = dataTransfer.files; // Set the file to the input

    console.log(file.name)
    document.getElementById('ext_box').innerHTML = '.' + file.type.split('/').pop()

    const reader = new FileReader();
    reader.onload = () => {
        imagePreview.src = reader.result;
        imagePreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

function clearImage() {
    // Clear the file input
    imageInput.value = '';

    // Clear the image preview
    imagePreview.src = ''; // Remove the source
    imagePreview.alt = 'No image selected'; // Optional: set an alt text
}