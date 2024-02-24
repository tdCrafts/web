const parseForm = function(form) {
    const array = form.serializeArray();
    const data = {
        fragranceNames: [],
    };
    array.forEach(e => {
        if (e.name.startsWith("frag-name[")) {
            data.fragranceNames.push(e.value);
        } else if (e.name === "clone") {
            data.clone = true;
        } else {
            data[e.name] = e.value;
        }
    });
    if (!data.clone) {
        data.clone = false;
    }
    return data;
}

$(function() {
    $(".overwrite-fragrances input").on("keyup", function() {
        const ele = $(this);
        const id = ele.attr("id");
        $("." + id).text(ele.val());
    });

    $("form").on("submit", function() {
        const form = $(this);
        const batchData = parseForm(form);
        api.post("/api/batch/candle", batchData, data => {
            if (data.ok) {
                window.location.href = "/batch/candle/" + data.data._id;
            } else {
                statusPopup("danger", data.error, 4500);
            }
        });
        return false;
    });

    $("#date")[0].valueAsDate = new Date();
});
