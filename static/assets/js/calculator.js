const longUnit = {
    oz: "ounces",
    g: "grams",
}

function roundTo(form) {
    return form.find("select[name=unit]").val() === "g" ? 1 : 2;
}

function totalProduct(form) {
    const containerCount = Number(form.find("input[name=container-count]").val());
    const containerSize = Number(form.find("input[name=container-size]").val());
    const buffer = Number(form.find("input[name=buffer]").val());

    return (containerCount * containerSize) + buffer;
}

function totalWax(form) {
    const product = totalProduct(form);
    const fragrancePercent = Number(form.find("input[name=fragrance-percent]").val());
    return product * (100 - fragrancePercent) / 100;
}

function totalFragrance(form) {
    const product = totalProduct(form);
    const fragrancePercent = Number(form.find("input[name=fragrance-percent]").val());
    return product * fragrancePercent / 100;
}

// object can be "wax" or "frag"
function parseObject(form, object) {
    const serializedArray = form.serializeArray();
    const names = serializedArray.filter(x => x.name.startsWith(object + "-name"));

    let objects = [];
    names.forEach(name => {
        const objName = name.value;
        const percent = serializedArray.find(x => x.name === name.name.replace("name","percent"));
        if (!percent) return;
        const objPercent = Number(percent.value);
        objects.push({
            name: objName,
            percent: objPercent,
        });
    });
    return objects;
}

function parseWax(form) {
    const wax = totalWax(form);
    const objects = parseObject(form, "wax");
    objects.forEach(object => {
        object.amount = wax * object.percent / 100;
    });
    return objects;
}

function parseFragrance(form) {
    const fragrance = totalFragrance(form);
    const objects = parseObject(form, "frag");
    objects.forEach(object => {
        object.amount = fragrance * object.percent / 100;
    });
    return objects;
}

const OBJECT_HTML = `<div><h2>::NAME</h2><div class="num">::AMOUNT</div><div class="unit">::UNIT</div></div>`;

function updateCalculator(form) {
    const product = totalProduct(form);
    const wax = totalWax(form);
    const fragrance = totalFragrance(form);

    const round = roundTo(form);

    form.find(".totalProduct").text(product.toFixed(round));
    form.find(".totalWax").text(wax.toFixed(round));
    form.find(".totalFragrance").text(fragrance.toFixed(round));

    const unit = longUnit[form.find("select[name=unit]").val()];

    const waxes = parseWax(form);
    const fragrances = parseFragrance(form);

    let waxHtml = "";
    let fragHtml = "";

    waxes.forEach(wax => {
        waxHtml += OBJECT_HTML
            .replace("::NAME", wax.name)
            .replace("::AMOUNT", wax.amount.toFixed(round))
            .replace("::UNIT", unit);
    });

    fragrances.forEach(frag => {
        fragHtml += OBJECT_HTML
            .replace("::NAME", frag.name)
            .replace("::AMOUNT", frag.amount.toFixed(round))
            .replace("::UNIT", unit);
    });

    $(".waxResults").html(waxHtml);
    $(".fragranceResults").html(fragHtml);
}

$(function() {
    $(".unit").on("change", function() {
        $(this).closest("form").find(".unit").val($(this).val());
        $(this).closest("form").find("div.unit:not(.unit-percent)").text(longUnit[$(this).val()]);
    });

    $("input").on("change", function() {
        const form = $(this).closest("form");
        if (!form) return;

        updateCalculator(form);
    });
});
