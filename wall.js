import { quat, mat4 } from './glm.js';
import { Transform } from './Transform.js';
import { Camera } from './Camera.js';
import { Node } from './Node.js';
import {
    getGlobalModelMatrix,
    getGlobalViewMatrix,
    getProjectionMatrix,
} from './SceneUtils.js';


export class Wall {

    static imageBitmap = null;
    static imageBitmap2 = null;

    static async loadTexture(device) {
        if (Wall.imageBitmap) return;

        this.imageBitmap = await fetch('wall_texture.jpg')
        .then(r => r.blob())
        .then(b => createImageBitmap(b));

        this.imageBitmap2 = await fetch('wood.jpg')
        .then(r => r.blob())
        .then(b => createImageBitmap(b));

        this.device = device;
    }

    constructor(device, pipeline, camera, position, rotation, length) { // rotation 0 = along x axis, 1 = along y axis

        this.device = device;
        this.pipeline = pipeline;
        this.camera = camera;
        this.length = length;
        this.rotation = rotation;

        this.texture = device.createTexture({
            size: [Wall.imageBitmap.width, Wall.imageBitmap.height],
            format: 'rgba8unorm',
            usage:
                GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.RENDER_ATTACHMENT |
                GPUTextureUsage.COPY_DST,
        });

        this.texture2 = device.createTexture({
            size: [Wall.imageBitmap2.width, Wall.imageBitmap2.height],
            format: 'rgba8unorm',
            usage:
                GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.RENDER_ATTACHMENT |
                GPUTextureUsage.COPY_DST,
        });

        device.queue.copyExternalImageToTexture(
            { source: Wall.imageBitmap },
            { texture: this.texture },
            [Wall.imageBitmap.width, Wall.imageBitmap.height]);


        const sampler = device.createSampler({
        addressModeU: 'repeat',
        addressModeV: 'repeat',
        magFilter: "linear",
        minFilter: "linear",
        });


        device.queue.copyExternalImageToTexture(
            { source: Wall.imageBitmap2 },
            { texture: this.texture2 },
            [Wall.imageBitmap2.width, Wall.imageBitmap2.height]);

        
         
        this.node = new Node();
        this.node.addComponent(new Transform({
            translation: position
        }));

        const repeatU = this.length / 2.5 ;
        const repeatV = 10 / 5 ;

        
        const wall1 = new Float32Array([
            // positions         // texcoords
            -this.length, 0.5, 0, 1,       0, 0,    // 0 - spodaj levo (rdeča)
            this.length, 0.5, 0, 1,       repeatU, 0,    // 1 - spodaj desno
            -this.length, 10, 0, 1,       0, repeatV,   // 2 - zgoraj levo (svetlejša rdeča)
            this.length, 10, 0, 1,       repeatU, repeatV,   // 3 - zgoraj desno
        ]);

        const wall2 = new Float32Array([
            // positions         // texcoords
            0, 0.5, this.length, 1,       0, 0,    // 0 - spodaj levo (rdeča)
            0, 0.5, -this.length, 1,       repeatU, 0,    // 1 - spodaj desno
            0, 10, this.length, 1,       0, repeatV,   // 2 - zgoraj levo (svetlejša rdeča)
            0, 10, -this.length, 1,       repeatU, repeatV,   // 3 - zgoraj desno
        ]);

        const wall = this.rotation === 1 ? wall2 : wall1;

        const plank1 = new Float32Array([
            // positions         // texcoords
            -this.length, 0, -0.1, 1,       0, 0,    // 0 - spodaj levo (rdeča)
            this.length, 0, -0.1, 1,       repeatU, 0,    // 1 - spodaj desno
            -this.length, 0, +0.1, 1,       0, 0,    // 0 - spodaj levo (rdeča)
            this.length, 0, +0.1, 1,       repeatU, 0,    // 1 - spodaj desno
            -this.length, 0.5, -0.1, 1,       0, repeatV,   // 2 - zgoraj levo (svetlejša rdeča)
            this.length, 0.5, -0.1, 1,       repeatU, repeatV,   // 3 - zgoraj desno
            -this.length, 0.5, +0.1, 1,       0, repeatV,   // 2 - zgoraj levo (svetlejša rdeča)
            this.length, 0.5, +0.1, 1,       repeatU, repeatV,
        ]);

        const plank2 = new Float32Array([
            // positions         // texcoords
            -0.1, 0, this.length, 1,       0, 0,    // 0 - spodaj levo (rdeča)
            -0.1, 0, -this.length, 1,       repeatU, 0,    // 1 - spodaj desno
            +0.1, 0, this.length, 1,       0, 0,    // 0 - spodaj levo (rdeča)
            +0.1, 0, -this.length, 1,       repeatU, 0,    // 1 - spodaj desno
            -0.1, 0.5, this.length, 1,       0, repeatV,   // 2 - zgoraj levo (svetlejša rdeča)
            -0.1, 0.5, -this.length, 1,       repeatU, repeatV,
            +0.1, 0.5, this.length, 1,       0, repeatV,   // 2 - zgoraj levo (svetlejša rdeča)
            +0.1, 0.5, -this.length, 1,       repeatU, repeatV,
        ]);

        const plank = this.rotation === 1 ? plank2 : plank1;

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

        const edgePlank = this.rotation === 1 ? edgeplank2 : edgeplank1;

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

        const secEdgePlank = this.rotation === 1 ? secEdgeplank2 : secEdgeplank1;

        this.wallBuffer = device.createBuffer({
            size: wall.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });

        this.plankBuffer = device.createBuffer({
            size: plank.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });

        this.edgeplankBuffer = device.createBuffer({
            size: edgePlank.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        this.secEdgeplankBuffer = device.createBuffer({
            size: secEdgePlank.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });

        device.queue.writeBuffer(this.wallBuffer, 0, wall);
        device.queue.writeBuffer(this.plankBuffer, 0, plank);
        device.queue.writeBuffer(this.edgeplankBuffer, 0, edgePlank);
        device.queue.writeBuffer(this.secEdgeplankBuffer, 0, secEdgePlank);

        const wallIndices = new Uint32Array([
            0, 1, 2,    // Spodnji trikotnik
            1, 3, 2,    // Zgornji trikotnik
        ]);

        const plankIndices = new Uint32Array([
            0, 1, 2,    2, 1, 3,
            4, 0, 6,    6, 0, 2,
            5, 4, 7,    7, 4, 6,
            1, 5, 3,    3, 5, 7,
            6, 2, 7,    7, 2, 3,
            1, 0, 5,    5, 0, 4,
        ]);

        const edgePlankIndices = new Uint32Array([
            0, 1, 2,    2, 1, 3,
            4, 0, 6,    6, 0, 2,
            5, 4, 7,    7, 4, 6,
            1, 5, 3,    3, 5, 7,
            6, 2, 7,    7, 2, 3,
            1, 0, 5,    5, 0, 4,
        ]);

        const secEdgePlankIndices = new Uint32Array([
            0, 1, 2,    2, 1, 3,
            4, 0, 6,    6, 0, 2,
            5, 4, 7,    7, 4, 6,
            1, 5, 3,    3, 5, 7,
            6, 2, 7,    7, 2, 3,
            1, 0, 5,    5, 0, 4,
        ]);


        this.wallIndexBuffer = device.createBuffer({
            size: wallIndices.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });

        this.plankIndexBuffer = device.createBuffer({
            size: plankIndices.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });

        this.edgePlankIndexBuffer = device.createBuffer({
            size: edgePlankIndices.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });

        this.secEdgePlankIndexBuffer = device.createBuffer({
            size: secEdgePlankIndices.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });

        device.queue.writeBuffer(this.wallIndexBuffer, 0, wallIndices);
        device.queue.writeBuffer(this.plankIndexBuffer, 0, plankIndices);
        device.queue.writeBuffer(this.edgePlankIndexBuffer, 0, edgePlankIndices);
        device.queue.writeBuffer(this.secEdgePlankIndexBuffer, 0, secEdgePlankIndices);

        this.indexCount = wallIndices.length;
        this.plankIndexCount = plankIndices.length;
        this.edgePlankIndexCount = edgePlankIndices.length;
        this.secEdgePlankIndexCount = secEdgePlankIndices.length;

        this.wallUniformBuffer = device.createBuffer({
            size: 16 * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.plankUniformBuffer = device.createBuffer({
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
        
        this.wallBindGroup = device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.wallUniformBuffer } },
                { binding: 1, resource: this.texture.createView() },
                { binding: 2, resource: sampler },
            ]
        });

        this.plankBindGroup = device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.plankUniformBuffer } },
                { binding: 1, resource: this.texture2.createView() },
                { binding: 2, resource: sampler },
            ]
        });

        this.edgePlankBindGroup = device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.edgePlankUniformBuffer} },
                { binding: 1, resource: this.texture2.createView() },
                { binding: 2, resource: sampler },
            ]
        });

        this.secEdgePlankBindGroup = device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.secEdgePlankUniformBuffer} },
                { binding: 1, resource: this.texture2.createView() },
                { binding: 2, resource: sampler },
            ]
        });

    }

    returnNode() {
        return this.node;
    }       

    updateRender() {
        const model = getGlobalModelMatrix(this.node);
        const view = getGlobalViewMatrix(this.camera);
        const proj = getProjectionMatrix(this.camera);

        const matrix = mat4.create()
            .multiply(proj)
            .multiply(view)
            .multiply(model);

        this.device.queue.writeBuffer(this.wallUniformBuffer, 0, matrix);
        this.device.queue.writeBuffer(this.plankUniformBuffer, 0, matrix);
        this.device.queue.writeBuffer(this.edgePlankUniformBuffer, 0, matrix);
        this.device.queue.writeBuffer(this.secEdgePlankUniformBuffer, 0, matrix);

    }

    draw(renderPass) {
        this.updateRender();

        renderPass.setPipeline(this.pipeline);
        renderPass.setVertexBuffer(0, this.wallBuffer);
        renderPass.setIndexBuffer(this.wallIndexBuffer, 'uint32');
        renderPass.setBindGroup(0, this.wallBindGroup);
        renderPass.drawIndexed(this.indexCount);

        renderPass.setVertexBuffer(0, this.plankBuffer);
        renderPass.setIndexBuffer(this.plankIndexBuffer, 'uint32');
        renderPass.setBindGroup(0, this.plankBindGroup);
        renderPass.drawIndexed(this.plankIndexCount);

        renderPass.setVertexBuffer(0, this.edgeplankBuffer);
        renderPass.setIndexBuffer(this.edgePlankIndexBuffer, 'uint32');
        renderPass.setBindGroup(0, this.edgePlankBindGroup);
        renderPass.drawIndexed(this.edgePlankIndexCount);

        renderPass.setVertexBuffer(0, this.secEdgeplankBuffer);
        renderPass.setIndexBuffer(this.secEdgePlankIndexBuffer, 'uint32');
        renderPass.setBindGroup(0, this.secEdgePlankBindGroup);
        renderPass.drawIndexed(this.secEdgePlankIndexCount);
    }

        
}