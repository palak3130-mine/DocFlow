document.addEventListener('DOMContentLoaded', function() {

    const reviewerField = document.getElementById('id_reviewer_field');
    const specialization = document.getElementById('id_specialization');

    reviewerField.addEventListener('change', function() {

        const categoryId = this.value;

        fetch(`/categories/load-subcategories/?category=${categoryId}`)
        .then(response => response.json())
        .then(data => {

            specialization.innerHTML = '';

            data.forEach(function(item) {

                const option = document.createElement('option');
                option.value = item.id;
                option.text = item.name;

                specialization.appendChild(option);
            });

        });

    });

});