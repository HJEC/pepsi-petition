let hiddenSig = $("input[name='sig']"),
    canvasDraw = document.getElementById("canvas"),
    canvas = $("#canvas"),
    ctx = canvasDraw.getContext("2d"),
    bottlecap = $("#bottlecap");

canvas.mouseenter(() => {
    canvas.mousedown(e => {
        let x = e.pageX - e.target.offsetLeft,
            y = e.pageY - e.target.offsetTop;

        canvas.mousemove(e => {
            let newX = e.pageX - e.target.offsetLeft,
                newY = e.pageY - e.target.offsetTop;
            ctx.strokeStyle = "#ff501c";
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(newX, newY);
            ctx.stroke();
            ctx.lineWidth = 7;
            ctx.lineJoin = "bevel";
            ctx.setLineDash([1, 0]);
            (x = newX), (y = newY);
        });
    });
    canvas.mouseup(() => {
        var dataURL = canvasDraw.toDataURL();
        hiddenSig.val(dataURL);

        canvas.unbind("mousemove");
    });
    canvas.mouseleave(() => {
        canvas.unbind("mousemove");
    });
});

bottlecap.click(() => {
    let pop = new Audio("soda.mp3");
    pop.play();
});
