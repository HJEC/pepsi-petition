// CODE GENEROUSLY DONATED BY DAVID AUREL //

let hiddenSig = $("input[name='sig']"),
    canvasDraw = document.getElementById("canvas"),
    canvas = $("#canvas"),
    ctx = canvasDraw.getContext("2d");

canvas.mouseenter(() => {
    canvas.mousedown(e => {
        let x = e.pageX - e.target.offsetLeft,
            y = e.pageY - e.target.offsetTop;

        canvas.mousemove(e => {
            let newX = e.pageX - e.target.offsetLeft,
                newY = e.pageY - e.target.offsetTop;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(newX, newY);
            ctx.stroke();
            (x = newX), (y = newY);
        });
    });
    canvas.mouseup(() => {
        var dataURL = canvasDraw.toDataURL();
        hiddenSig.val(dataURL);
        console.log(hiddenSig.val());

        canvas.unbind("mousemove");
    });
    canvas.mouseleave(() => {
        canvas.unbind("mousemove");
    });
});
