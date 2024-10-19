
const multiple_attributes = document.querySelectorAll('.dropdown-check-list');
multiple_attributes.forEach(optionList => {
    optionList.getElementsByClassName('anchor')[0].onclick = function (evt) {
        if (optionList.classList.contains('visible'))
            optionList.classList.remove('visible');
        else
            optionList.classList.add('visible');
    }

})
