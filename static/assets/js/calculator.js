const longUnit = {
    oz: "ounces",
    g: "grams",
}

$(function() {
    $(".unit").on("change", function() {
        $(this).closest("form").find(".unit").val($(this).val());
        $(this).closest("form").find("div.unit:not(.unit-percent)").text(longUnit[$(this).val()]);
    });
});
