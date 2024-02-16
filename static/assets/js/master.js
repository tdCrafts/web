const api = {
    post: function(url, data, callback) {
        $.ajax(
            {
                method: "POST",
                url,
                data: JSON.stringify(data),
                contentType: "application/json",
                success: callback,
            },
        );
    },
    put: function(url, data, callback) {
        $.ajax(
            {
                method: "PUT",
                url,
                data: JSON.stringify(data),
                contentType: "application/json",
                success: callback,
            },
        );
    },
}

function statusPopup(type, html, hideAfter = null) {
    $(".status-popup").remove();
    const ele = $(`<div class="status-popup alert alert-${type} hide"></div>`);
    ele.html(html);
    $("body").append(ele);
    setTimeout(function() {
        ele.removeClass("hide");
    }, 10);

    function hide() {
        ele.addClass("hide");
        setTimeout(function() {
            ele.remove();
        }, 250);
    }

    ele.on("click", hide);

    if (hideAfter) {
        setTimeout(hide, hideAfter);
    }
}
