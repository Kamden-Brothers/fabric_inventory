
function loadStatisticsError(msg) {
    $('#statistics').text(msg);
}

function buildRow(labelName, value) {
    return $("<div>").append(
        $("<label>").text(labelName).addClass('stat-label'),
        $("<span>").text(value)
    )
}

function buildStatDiv(section, data) {
    return $("<div>").addClass('stat-card').append(
        $('<div>').addClass('stat-header').text(section),
        buildRow('Yardage:', data['yardage']),
        buildRow('Square Feet:', data['sqft'])
    )
}

function populateStatistics(data) {
    $('#statistics').empty();


    $('#statistics').append(buildStatDiv('Total', data['total']));

    for (const [key, value] of Object.entries(data)) {
        if (key === 'total') continue;

        $('#statistics').append(buildStatDiv(key, value))
    }

}

$(() => {
    $.ajax({
        url: '/calculate_current_stats',
        type: 'get',
        success: function (data) {
            if (data.result) {
                populateStatistics(data.data)
            }
            else {
                loadStatisticsError(data?.error_msg || 'Failed to load statistics')
            }
        },

        error: function () {
            loadStatisticsError('Failed to load statistics')
        }
    })
})