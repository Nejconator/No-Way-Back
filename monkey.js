import { quat, mat4 } from './glm.js';
import { Transform } from './Transform.js';
import { Camera } from './Camera.js';
import { Node } from './Node.js';
import { UNIFORM_BYTES, buildUniformData, lightingState } from "./Lighting.js";
import {
    getGlobalModelMatrix,
    getGlobalViewMatrix,
    getProjectionMatrix,
} from './SceneUtils.js';


export class monkey {

    static imageBitmap = null;
    static imageBitmap2 = null;

    static async loadTexture(device) {
        if (monkey.imageBitmap) return;

        this.imageBitmap = await fetch('wall_texture.jpg')
        .then(r => r.blob())
        .then(b => createImageBitmap(b));

        this.imageBitmap2 = await fetch('red-fabric.jpg')
        .then(r => r.blob())
        .then(b => createImageBitmap(b));

        this.device = device;
    }

    constructor(device, pipeline, camera, position) { // rotation 0 = along x axis, 1 = along y axis

        this.device = device;
        this.pipeline = pipeline;
        this.camera = camera;
        

        this.texture = device.createTexture({
            size: [monkey.imageBitmap.width, monkey.imageBitmap.height],
            format: 'rgba8unorm',
            usage:
                GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.RENDER_ATTACHMENT |
                GPUTextureUsage.COPY_DST,
        });

        this.texture2 = device.createTexture({
            size: [monkey.imageBitmap2.width, monkey.imageBitmap2.height],
            format: 'rgba8unorm',
            usage:
                GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.RENDER_ATTACHMENT |
                GPUTextureUsage.COPY_DST,
        });

        device.queue.copyExternalImageToTexture(
            { source: monkey.imageBitmap },
            { texture: this.texture },
            [monkey.imageBitmap.width, monkey.imageBitmap.height]);


        const sampler = device.createSampler({
        addressModeU: 'repeat',
        addressModeV: 'repeat',
        magFilter: "linear",
        minFilter: "linear",
        });


        device.queue.copyExternalImageToTexture(
            { source: monkey.imageBitmap2 },
            { texture: this.texture2 },
            [monkey.imageBitmap2.width, monkey.imageBitmap2.height]);

        
         
        this.node = new Node();
        this.node.addComponent(new Transform({
            translation: position
        }));

        const repeatU = 1 ;
        const repeatV = 1 ;


        const body = new Float32Array([
            // positions         // texcoords
            -0.75, 0, -0.75, 1,          0, 0,
            0.75, 0, -0.75, 1,          repeatU, 0,
            -0.75, 0, 0.75, 1,          0, repeatV,
            0.75, 0, 0.75, 1,          repeatU, repeatV,

            -0.75, 3, -0.75, 1,          0, 0,
            0.75, 3, -0.75, 1,          repeatU, 0,
            -0.75, 3, 0.75, 1,          0, repeatV,
            0.75, 3, 0.75, 1,          repeatU, repeatV,
        ]);

        const head = new Float32Array([
            // positions         // texcoords
            -0.5, -3, -0.5, 1,      0, 0,
            0.5, -3, -0.5, 1,      repeatU, 0,
            -0.5, -3, 0.5, 1,      0, repeatV,
            0.5, -3, 0.5, 1,      repeatU, repeatV,

            -0.5, 0, -0.5, 1,      0, 0,
            0.5, 0, -0.5, 1,      repeatU, 0,
            -0.5, 0, 0.5, 1,      0, repeatV,
            0.5, 0, 0.5, 1,      repeatU, repeatV,
        ]);

        
        /*
        const edgeplank1 = new Float32Array([
            this.length-0.5, 0, -0.1, 1,       0, 0,    // 0 - spodaj levo (rdeča)
            this.length, 0, -0.1, 1,       repeatU, 0,    // 1 - spodaj desno
            this.length-0.5, 0, +0.1, 1,       0, 0,    // 0 - spodaj levo (rdeča)
            this.length, 0, +0.1, 1,       repeatU, 0,    // 1 - spodaj desno
            this.length-0.5, 10, -0.1, 1,       0, repeatV,   // 2 - zgoraj levo (svetlejša rdeča)
            this.length, 10, -0.1, 1,       repeatU, repeatV,   // 3 - zgoraj desno
            this.length-0.5, 10, +0.1, 1,       0, repeatV,   // 2 - zgoraj levo (svetlejša rdeča)
            this.length, 10, +0.1, 1,       repeatU, repeatV,

        ]);

        const edgeplank2 = new Float32Array([
            // positions         // texcoords
            -0.1, 0, this.length, 1,       0, 0,    // 0 - spodaj levo (rdeča)
            -0.1, 0, this.length-0.5, 1,       repeatU, 0,    // 1 - spodaj desno
            +0.1, 0, this.length, 1,       0, 0,    // 0 - spodaj levo (rdeča)
            +0.1, 0, this.length-0.5, 1,       repeatU, 0,    // 1 - spodaj desno
            -0.1, 10, this.length, 1,       0, repeatV,   // 2 - zgoraj levo (svetlejša rdeča)
            -0.1, 10, this.length-0.5, 1,       repeatU, repeatV,
            +0.1, 10, this.length, 1,       0, repeatV,   // 2 - zgoraj levo (svetlejša rdeča)
            +0.1, 10, this.length-0.5, 1,       repeatU, repeatV,
        ]);

        

        const secEdgeplank1 = new Float32Array([
            -this.length+0.5, 0, -0.1, 1,       0, 0,    // 0 - spodaj levo (rdeča)
            -this.length, 0, -0.1, 1,       repeatU, 0,    // 1 - spodaj desno
            -this.length+0.5, 0, +0.1, 1,       0, 0,    // 0 - spodaj levo (rdeča)
            -this.length, 0, +0.1, 1,       repeatU, 0,    // 1 - spodaj desno
            -this.length+0.5, 10, -0.1, 1,       0, repeatV,   // 2 - zgoraj levo (svetlejša rdeča)
            -this.length, 10, -0.1, 1,       repeatU, repeatV,   // 3 - zgoraj desno
            -this.length+0.5, 10, +0.1, 1,       0, repeatV,   // 2 - zgoraj levo (svetlejša rdeča)
            -this.length, 10, +0.1, 1,       repeatU, repeatV,
        ]);

        const secEdgeplank2 = new Float32Array([
            // positions         // texcoords
            -0.1, 0, -this.length, 1,       0, 0,    // 0 - spodaj levo (rdeča)
            -0.1, 0, -this.length+0.5, 1,       repeatU, 0,    // 1 - spodaj desno
            +0.1, 0, -this.length, 1,       0, 0,    // 0 - spodaj levo (rdeča)
            +0.1, 0, -this.length+0.5, 1,       repeatU, 0,    // 1 - spodaj desno
            -0.1, 10, -this.length, 1,       0, repeatV,   // 2 - zgoraj levo (svetlejša rdeča)
            -0.1, 10, -this.length+0.5, 1,       repeatU, repeatV,
            +0.1, 10, -this.length, 1,       0, repeatV,   // 2 - zgoraj levo (svetlejša rdeča)
            +0.1, 10, -this.length+0.5, 1,       repeatU, repeatV,
        ]);

        */

       

        this.bodyBuffer = device.createBuffer({
            size: body.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });

        this.headBuffer = device.createBuffer({
            size: head.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        /*
        this.secEdgeplankBuffer = device.createBuffer({
            size: secEdgePlank.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });*/



        device.queue.writeBuffer(this.bodyBuffer, 0, body);
        device.queue.writeBuffer(this.headBuffer, 0, head);
        /*
        device.queue.writeBuffer(this.secEdgeplankBuffer, 0, secEdgePlank);
        */
        

        const bodyIndices = new Uint32Array([
            0, 1, 2,    2, 1, 3,
            4, 0, 6,    6, 0, 2,
            5, 4, 7,    7, 4, 6,
            1, 5, 3,    3, 5, 7,
            6, 2, 7,    7, 2, 3,
            1, 0, 5,    5, 0, 4,
        ]);

        const headIndices = new Uint32Array([
            0, 1, 2,    2, 1, 3,
            4, 0, 6,    6, 0, 2,
            5, 4, 7,    7, 4, 6,
            1, 5, 3,    3, 5, 7,
            6, 2, 7,    7, 2, 3,
            1, 0, 5,    5, 0, 4,
        ]);
        /*
        const secEdgePlankIndices = new Uint32Array([
            0, 1, 2,    2, 1, 3,
            4, 0, 6,    6, 0, 2,
            5, 4, 7,    7, 4, 6,
            1, 5, 3,    3, 5, 7,
            6, 2, 7,    7, 2, 3,
            1, 0, 5,    5, 0, 4,
        ]);
        */

        

        this.bodyIndexBuffer = device.createBuffer({
            size: bodyIndices.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });

        this.headIndexBuffer = device.createBuffer({
            size: headIndices.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });
        /*
        this.secEdgePlankIndexBuffer = device.createBuffer({
            size: secEdgePlankIndices.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });
        */

        device.queue.writeBuffer(this.bodyIndexBuffer, 0, bodyIndices);
        device.queue.writeBuffer(this.headIndexBuffer, 0, headIndices);
        
        //device.queue.writeBuffer(this.secEdgePlankIndexBuffer, 0, secEdgePlankIndices);

        
        this.bodyIndexCount = bodyIndices.length;
        this.headIndexCount = headIndices.length;
        //this.secEdgePlankIndexCount = secEdgePlankIndices.length;


        this.bodyUniformBuffer = device.createBuffer({
            size: UNIFORM_BYTES,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.headUniformBuffer = device.createBuffer({
            size: UNIFORM_BYTES,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        /*
        this.secEdgePlankUniformBuffer = device.createBuffer({
            size: 16 * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.edgePlankUniformBuffer = device.createBuffer({
            size: 16 * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.secEdgePlankUniformBuffer = device.createBuffer({
            size: 16 * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        
        */

        this.bodyBindGroup = device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.bodyUniformBuffer } },
                { binding: 1, resource: this.texture2.createView() },
                { binding: 2, resource: sampler },
            ]
        });

        this.headBindGroup = device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.headUniformBuffer} },
                { binding: 1, resource: this.texture2.createView() },
                { binding: 2, resource: sampler },
            ]
        });

        /*
        this.secEdgePlankBindGroup = device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.secEdgePlankUniformBuffer} },
                { binding: 1, resource: this.texture2.createView() },
                { binding: 2, resource: sampler },
            ]
        });
        */

    }

    returnNode() {
        return this.node;
    }       

    updateRender() {
        const model = getGlobalModelMatrix(this.node);
        const view = getGlobalViewMatrix(this.camera);
        const proj = getProjectionMatrix(this.camera);

        const mvp = mat4.create()
            .multiply(proj)
            .multiply(view)
            .multiply(model);

        const cameraPos = this.camera.getComponentOfType(Transform).translation;

        const uniformData = buildUniformData({
          mvp,
          model,
          cameraPos,
          lightingState,
        });

        this.device.queue.writeBuffer(this.bodyUniformBuffer, 0, uniformData);
        this.device.queue.writeBuffer(this.headUniformBuffer, 0, uniformData);
        //this.device.queue.writeBuffer(this.secEdgePlankUniformBuffer, 0, matrix);

    }

    draw(renderPass) {
        this.updateRender();


        renderPass.setVertexBuffer(0, this.bodyBuffer);
        renderPass.setIndexBuffer(this.bodyIndexBuffer, 'uint32');
        renderPass.setBindGroup(0, this.bodyBindGroup);
        renderPass.drawIndexed(this.bodyIndexCount);

        renderPass.setVertexBuffer(0, this.headBuffer);
        renderPass.setIndexBuffer(this.headIndexBuffer, 'uint32');
        renderPass.setBindGroup(0, this.headBindGroup);
        renderPass.drawIndexed(this.headIndexCount);
        /*
        renderPass.setVertexBuffer(0, this.secEdgeplankBuffer);
        renderPass.setIndexBuffer(this.secEdgePlankIndexBuffer, 'uint32');
        renderPass.setBindGroup(0, this.secEdgePlankBindGroup);
        renderPass.drawIndexed(this.secEdgePlankIndexCount);
        */
    }

        
}