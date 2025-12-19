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

    static async loadTexture(device) {
        if (Wall.imageBitmap) return;

        this.imageBitmap = await fetch('wall_texture.jpg')
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

        device.queue.copyExternalImageToTexture(
            { source: Wall.imageBitmap },
            { texture: this.texture },
            [Wall.imageBitmap.width, Wall.imageBitmap.height]);

        const sampler = device.createSampler();

         
        this.node = new Node();
        this.node.addComponent(new Transform({
            translation: position
        }));
        

        
        const wall1 = new Float32Array([
            // positions         // texcoords
            -this.length, 0, -this.length, 1,       0, 0,    // 0 - spodaj levo (rdeča)
            this.length, 0, -this.length, 1,       1, 0,    // 1 - spodaj desno
            -this.length, 15, -this.length, 1,       0, 1,   // 2 - zgoraj levo (svetlejša rdeča)
            this.length, 15, -this.length, 1,       1, 1,   // 3 - zgoraj desno
        ]);

        const wall2 = new Float32Array([
            // positions         // texcoords
            this.length, 0, this.length, 1,       0, 0,    // 0 - spodaj levo (rdeča)
            this.length, 0, -this.length, 1,       1, 0,    // 1 - spodaj desno
            this.length, 15, this.length, 1,       0, 1,   // 2 - zgoraj levo (svetlejša rdeča)
            this.length, 15, -this.length, 1,       1, 1,   // 3 - zgoraj desno
        ]);

        const wall = this.rotation === 1 ? wall2 : wall1;


        this.wallBuffer = device.createBuffer({
            size: wall.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });

        device.queue.writeBuffer(this.wallBuffer, 0, wall);

        const wallIndices = new Uint32Array([
            0, 1, 2,    // Spodnji trikotnik
            1, 3, 2,    // Zgornji trikotnik
        ]);

        this.wallIndexBuffer = device.createBuffer({
            size: wallIndices.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });

        device.queue.writeBuffer(this.wallIndexBuffer, 0, wallIndices);

        this.indexCount = wallIndices.length;


        this.wallUniformBuffer = device.createBuffer({
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
    }

    draw(renderPass) {
        this.updateRender();

        renderPass.setPipeline(this.pipeline);
        renderPass.setVertexBuffer(0, this.wallBuffer);
        renderPass.setIndexBuffer(this.wallIndexBuffer, 'uint32');
        renderPass.setBindGroup(0, this.wallBindGroup);
        renderPass.drawIndexed(this.indexCount);
    }

        
}