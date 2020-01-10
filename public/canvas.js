let hiddenSig = $(".sig"),
    canvas = $("#canvas"),
    ctx = canvas.getContext("2d"),
    w = canvas.width,
    h = canvas.height;

canvas.on(
    "mousedown",
    function(e) {
        findxy("down", e);
    },
    false
);
canvas.on(
    "mousemove",
    function(e) {
        findxy("move", e);
    },
    false
);
canvas.on(
    "mouseup",
    function(e) {
        findxy("up", e);
    },
    false
);
canvas.on(
    "mouseout",
    function(e) {
        findxy("out", e);
    },
    false
);
