const errorFunc = function(e, textStatus, errorThrown) {
    statusPopup("danger", `Failed request to server: ${errorThrown} (${textStatus})`, 5000);
}

const api = {
    post: function(url, data, callback) {
        $.ajax(
            {
                method: "POST",
                url,
                data: JSON.stringify(data),
                contentType: "application/json",
                success: callback,
                error: errorFunc,
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
                error: errorFunc,
            },
        );
    },
    delete: function(url, callback) {
        $.ajax(
            {
                method: "DELETE",
                url,
                contentType: "application/json",
                success: callback,
                error: errorFunc,
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
