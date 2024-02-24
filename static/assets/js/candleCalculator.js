const longUnit = {
    oz: "ounces",
    g: "grams",
}

const FRAG_WAX_HTML = `
<div class="object ::TYPE" data-type="::TYPE">
    <div class="form-group name">
        <label for="::TYPE-::ID-name">::TYPE_UPPER Name</label>
        <input type="text" name="::TYPE-name[::ID]" id="::TYPE-::ID-name">
    </div>
    <div class="form-group">
        <label for="::TYPE-::ID-percent">::TYPE_UPPER Percent</label>
        <div class="unit-input">
            <input type="number" name="::TYPE-percent[::ID]" id="::TYPE-::ID-percent" min="1" max="100" step="0.1">
            <div class="unit unit-percent">%</div>
        </div>
    </div>
    <div class="remove">
        <a href="#" label="Remove" data-type="::TYPE"><i class="fa-solid fa-trash"></i></a>
    </div>
</div>`;

const CONT_HTML = `<div class="object cont" data-type="cont">
    <div class="form-group">
        <label for="cont-::ID-quantity">Quantity</label>
        <input type="number" name="cont-quantity[::ID]" id="cont-::ID-quantity" min="1" step="1">
    </div>
    <div class="form-group name">
        <label for="cont-::ID-name">Container Name</label>
        <input type="text" name="cont-name[::ID]" id="cont-::ID-name">
    </div>
    <div class="form-group">
        <label for="cont-::ID-size">Container Size</label>
        <div class="unit-input">
            <input type="number" name="cont-size[::ID]" id="cont-::ID-size" min="0" step="0.01">
            <select class="unit">
                <option value="oz"::OZ>ounces</option>
                <option value="g"::G>grams</option>
            </select>
        </div>
    </div>
    <div class="remove">
        <a href="#" label="Remove" data-type="cont"><i class="fa-solid fa-trash"></i></a>
    </div>
</div>`;

function roundTo(form) {
    return form.find("select[name=unit]").val() === "g" ? 1 : 2;
}

function totalSize(form) {
    const containers = parseContainer(form);
    let size = 0;
    containers.forEach(container => {
        size += container.size * container.quantity;
    });
    return size;
}

function totalProduct(form) {
    const size = totalSize(form);
    const buffer = Number(form.find("input[name=buffer]").val());

    return size + buffer;
}

function totalWax(form, product = null) {
    if (!product) product = totalProduct(form);
    const fragrancePercent = Number(form.find("input[name=fragrance-percent]").val());
    return product * (100 - fragrancePercent) / 100;
}

function totalFragrance(form, product = null) {
    if(!product) product = totalProduct(form);
    const fragrancePercent = Number(form.find("input[name=fragrance-percent]").val());
    return product * fragrancePercent / 100;
}

function parseObjectId(name) {
    return name.substring(name.indexOf("[") + 1, name.indexOf("]"));
}

// object can be "wax" "frag" or "cont"
function parseObject(form, object) {
    const serializedArray = form.serializeArray();
    const names = serializedArray.filter(x => x.name.startsWith(object + "-name"));

    let objects = [];
    names.forEach(name => {
        const objName = name.value;
        if (object === "cont") {
            const quantity = serializedArray.find(x => x.name === name.name.replace("name","quantity"));
            const size = serializedArray.find(x => x.name === name.name.replace("name","size"));
            if (!quantity || !size) return;
            const objQuantity = Number(quantity.value);
            const objSize = Number(size.value);
            objects.push({
                id: parseObjectId(name.name),
                name: objName,
                quantity: objQuantity,
                size: objSize,
            });
        } else {
            const percent = serializedArray.find(x => x.name === name.name.replace("name","percent"));
            if (!percent) return;
            const objPercent = Number(percent.value);
            objects.push({
                id: parseObjectId(name.name),
                name: objName,
                percent: objPercent,
            });
        }
    });
    return objects;
}

function parseContainer(form) {
    const objects = parseObject(form, "cont");
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
    const wax = totalWax(form, product);
    const fragrance = totalFragrance(form, product);

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

function parseData(form) {
    const raw = form.serializeArray();
    return {
        id: raw.find(x => x.name === "id").value,
        buffer: Number(raw.find(x => x.name === "buffer").value),
        unit: raw.find(x => x.name === "unit").value,
        fragrancePercent: Number(raw.find(x => x.name === "fragrance-percent").value),
        containers: parseContainer(form),
        waxes: parseWax(form),
        fragrances: parseFragrance(form),
    };
}

let nextId = 0;

let formHasChanged = false;
const formUpdate = function() {
    const ele = $(this);

    const form = ele.closest("form");
    if (!form) return;

    const object = ele.closest(".object");

    if (object) {
        const type = object.attr("data-type");
        if (ele.attr("name").includes("percent") && ele.val() <= 100) {
            const id = parseObjectId(ele.attr("name"));
            if (type === "wax") {
                const waxes = parseWax(form);
                if (waxes.length === 2) {
                    const otherWaxPercentId = waxes.find(x => x.id !== id);
                    if (otherWaxPercentId) {
                        const otherWaxPercent = form.find(`input[name="wax-percent[${otherWaxPercentId.id}]"]`);
                        otherWaxPercent.val(100 - ele.val());
                    }
                }
            } else if (type === "frag") {
                const fragrances = parseFragrance(form);
                if (fragrances.length === 2) {
                    const otherFragPercentId = fragrances.find(x => x.id !== id);
                    if (otherFragPercentId) {
                        const otherFragPercent = form.find(`input[name="frag-percent[${otherFragPercentId.id}]"]`);
                        otherFragPercent.val(100 - ele.val());
                    }
                }
            }
        }
    }

    formHasChanged = true;

    updateCalculator(form);
}

const updateUnit = function() {
    $(this).closest("form").find(".unit").val($(this).val());
    $(this).closest("form").find("div.unit:not(.unit-percent)").text(longUnit[$(this).val()]);
}

let handling = false;
const handleRemove = function() {
    if (handling) return;
    handling = true;
    const ele = $(this);
    let type = ele.attr("data-type");
    const form = ele.closest("form");
    let elements = [
        ele.closest(".cont"),
        ele.closest(".wax"),
        ele.closest(".frag"),
    ];
    elements.forEach(element => {
        element.slideUp(250);
    });
    setTimeout(() => {
        elements.forEach(element => {
            element.remove();
        });
        updateCalculator(form);
        if ($(`.${type}`).length <= 1) {
            $(`.${type} .remove`).hide();
            $(`.${type} input[type=number]`).val(100);
        }
        handling = false;
    }, 250);

    return false;
}

const RESET_FIELDS = [
    "cont-name",
    "cont-quantity",
    "cont-size",
    "frag-name",
    "frag-percent",
    "wax-name",
    "wax-percent",
]

$(function() {
    $(".unit").on("change", updateUnit);

    $("input").on("change", formUpdate);

    $("#calculatorResult").on("submit", function(e) {
        const form = $(this);
        const data = parseData(form);
        const isNew = data.id === "new";
        statusPopup("info", "Saving...");
        api.post(`/api/calculator/candle/${isNew ? "" : data.id}`, data, function(data) {
            if (data.ok) {
                formHasChanged = false;
                if (isNew) {
                    formHasChanged = false;
                    window.location.href = "/calculator/candle/" + data.data._id;
                } else {
                    data.changedIds.forEach(changedId => {
                        RESET_FIELDS.forEach(resetField => {
                            $(`input[name="${resetField}[${changedId.old}]"]`).attr("name", `${resetField}[${changedId.new}]`);
                        });
                    });
                    statusPopup("success", "Saved!", 1250);
                }
            } else {
                statusPopup("danger", data.error.replace(/\n/g, "<br>"));
            }
        });
        return false;
    });

    window.onbeforeunload = function(e) {
        if (formHasChanged) {
            e.preventDefault();
            e.returnValue = "";
        }
    }

    $(".remove a").on("click", handleRemove);

    $("#visibility").on("change", function() {
        const ele = $(this);
        const value = ele.val();
        const entryId = ele.attr("data-id");
        if (!value || !entryId) {
            return statusPopup("danger", "Invalid entry ID or value!");
        }
        statusPopup("info", "Saving...");
        api.put(`/api/calculator/candle/${entryId}`, {privacy: value}, function(data) {
            if (data.ok) {
                statusPopup("success", "Privacy setting changed successfully!", 2500);
                if (value === "public") {
                    $(".privacy-warning").slideDown(250);
                } else {
                    $(".privacy-warning").slideUp(250);
                }
            } else {
                statusPopup("danger", data.error, 2500);
            }
        });
    });

    // all of these are similar yet different. maybe wrap into function?
    $(".add-container").on("click", function() {
        const form = $(this).closest("form");
        const unit = form.find("select[name=unit]").val();
        const ele = $(
            CONT_HTML
                .replace(/::ID/g, "New" + nextId++)
                .replace(/::OZ/g, unit === "oz" ? ` selected="selected"` : "")
                .replace(/::G/g, unit === "g" ? ` selected="selected"` : "")
        );
        ele.css("display","none");
        ele.find("select").on("change", updateUnit);
        ele.find("input").on("change", formUpdate);
        $(".containers").append(ele);
        $(".containers .remove").show();
        ele.slideDown(250);
        ele.find("input")[0].focus();
        ele.find(".remove a").on("click", handleRemove);
        updateCalculator(form);
        return false;
    });

    $(".add-wax").on("click", function() {
        const ele = $(
            FRAG_WAX_HTML
                .replace(/::ID/g, "New" + nextId++)
                .replace(/::TYPE_UPPER/g, "Wax")
                .replace(/::TYPE/g, "wax")
        );
        ele.css("display","none");
        ele.find("input").on("change", formUpdate);
        const form = $(this).closest("form");
        $(".waxes").append(ele);
        $(".waxes .remove").show();
        ele.slideDown(250);
        ele.find("input")[0].focus();
        ele.find(".remove a").on("click", handleRemove);
        updateCalculator(form);
        return false;
    });

    $(".add-fragrance").on("click", function() {
        const ele = $(
            FRAG_WAX_HTML
                .replace(/::ID/g, "New" + nextId++)
                .replace(/::TYPE_UPPER/g, "Fragrance")
                .replace(/::TYPE/g, "frag")
        );
        ele.css("display","none");
        ele.find("input").on("change", formUpdate);
        const form = $(this).closest("form");
        $(".fragrances").append(ele);
        $(".fragrances .remove").show();
        ele.slideDown(250);
        ele.find("input")[0].focus();
        ele.find(".remove a").on("click", handleRemove);
        updateCalculator(form);
        return false;
    });

    $(".clone").on("click", function() {
        const ele = $(this);
        const entryId = ele.attr("data-id");
        if (!entryId) {
            return statusPopup("danger", "Invalid ID given", 2500);
        }
        statusPopup("info", "Cloning...");
        api.post(`/api/calculator/candle/${entryId}/clone`, {}, function(data) {
            if (data.ok) {
                formHasChanged = false;
                window.location.href = "/calculator/candle/" + data.data._id;
            } else {
                statusPopup("danger", data.error);
            }
        });
        return false;
    });

    $(".delete").on("click", function() {
        const ele = $(this);
        const entryId = ele.attr("data-id");
        if (!entryId) {
            return statusPopup("danger", "Invalid ID given", 2500);
        }
        statusPopup("info", "Deleting...");
        api.delete(`/api/calculator/candle/${entryId}`, function(data) {
            if (data.ok) {
                formHasChanged = false;
                window.location.href = "/calculator/candle?deleted=true";
            } else {
                statusPopup("danger", data.error);
            }
        });
        return false;
    });
});
