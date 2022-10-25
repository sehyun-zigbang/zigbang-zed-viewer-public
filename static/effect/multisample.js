class MultiSampleEffect extends pc.PostEffect{
    constructor(graphicsDevice) {
        super(graphicsDevice);

        this.outputShader = new pc.Shader(graphicsDevice, {
            attributes: {
                aPosition: pc.SEMANTIC_POSITION
            },
            vshader: [
                "attribute vec2 aPosition;",
                "",
                "varying vec2 vUv0;",
                "",
                "void main(void)",
                "{",
                "    gl_Position = vec4(aPosition, 0.0, 1.0);",
                "    vUv0 = (aPosition.xy + 1.0) * 0.5;",
                "}"
            ].join("\n"),
            fshader: [
                "precision " + graphicsDevice.precision + " float;",
                "",
                "uniform sampler2D uColorBuffer;",
                "varying vec2 vUv0;",
                "void main()",
                "{",
                "   gl_FragColor = texture2D( uColorBuffer, vUv0 );",
                "}"
            ].join("\n")
        });
    }

    createTexture(width, height, format){
        return new pc.Texture(this.device, {
            width: width,
            height: height,
            format: format,
            mipmaps: false,
            minFilter: pc.FILTER_NEAREST,
            magFilter: pc.FILTER_NEAREST,
            addressU: pc.ADDRESS_CLAMP_TO_EDGE,
            addressV: pc.ADDRESS_CLAMP_TO_EDGE
        });
    };


    render(inputTarget, outputTarget, rect) {
        
        var device = this.device;
        var scope = device.scope;
        var width = Math.ceil(inputTarget.colorBuffer.width);
        var height = Math.ceil(inputTarget.colorBuffer.height);
        var ratio = window.devicePixelRatio;

        const w = Math.floor(width * ratio);
        const h = Math.floor(height * ratio);
        const colorBuffer = this.createTexture(w, h, pc.PIXELFORMAT_R8_G8_B8_A8);
        const depthBuffer = this.createTexture(w, h, pc.PIXELFORMAT_DEPTH);
        const renderTarget = new pc.RenderTarget({
            colorBuffer: colorBuffer,
            depthBuffer: depthBuffer,
            flipY: false,
            samples: device.maxSamples,
        });

        scope.resolve("uColorBuffer").setValue(renderTarget.colorBuffer);
        pc.drawFullscreenQuad(device, renderTarget, this.vertexBuffer, this.shader, rect);
    }
}

// ----------------- SCRIPT DEFINITION ------------------ //
var MultiSample = pc.createScript('multisample');

MultiSample.prototype.initialize = function () {
    this.effect = new MultiSampleEffect(this.app.graphicsDevice);

    var queue = this.entity.camera.postEffects;

    queue.addEffect(this.effect);

    this.on('state', function (enabled) {
        if (enabled) {
            queue.addEffect(this.effect);
        } else {
            queue.removeEffect(this.effect);
        }
    });

    this.on('destroy', function () {
        queue.removeEffect(this.effect);
    });
};