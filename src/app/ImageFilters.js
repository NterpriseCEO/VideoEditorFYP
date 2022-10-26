ImageFilters.CropBuiltin = function (srcImageData, x, y, width, height) {
    var srcWidth  = srcImageData.width,
        srcHeight = srcImageData.height,
        canvas    = this.utils.getSampleCanvas(),
        context   = this.utils.getSampleContext();

    canvas.width = srcWidth;
    canvas.height = srcHeight;
    context.putImageData(srcImageData, 0, 0);
    var result = context.getImageData(x, y, width, height);

    canvas.width = 0;
    canvas.height = 0;

    return result;
};