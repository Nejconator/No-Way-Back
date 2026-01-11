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


export class Shard {

    static imageBitmap = null;
    
    static async loadTexture(device) {
        if (Shard.imageBitmap) return;

        this.imageBitmap = await fetch('shard_texture.jpg')
        .then(r => r.blob())
        .then(b => createImageBitmap(b));

        this.device = device;
    }


    constructor(device, pipeline, camera, position) { // rotation 0 = x, 1 = y 

        this.device = device;
        this.pipeline = pipeline;
        this.camera = camera;

        this.texture = device.createTexture({
            size: [Shard.imageBitmap.width, Shard.imageBitmap.height],
            format: 'rgba8unorm',
            usage:
                GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.RENDER_ATTACHMENT |
                GPUTextureUsage.COPY_DST,
        });

        device.queue.copyExternalImageToTexture(
            { source: Shard.imageBitmap },
            { texture: this.texture },
            [Shard.imageBitmap.width, Shard.imageBitmap.height]);


        const sampler = device.createSampler({
        addressModeU: 'repeat',
        addressModeV: 'repeat',
        magFilter: "linear",
        minFilter: "linear",
        });
        
        
         
        this.node = new Node();
        this.node.addComponent(new Transform({
            translation: position
        }));

        

        
        const shard = new Float32Array([
            0, 3.5, 0, 1,       0.5, 0,
            -0.5, 2, -0.5, 1,   0, 1,
            0.5, 2, -0.5, 1,    1, 1,
            0, 3.5, 0, 1,       0.5, 0,
            0.5, 2, -0.5, 1,    0, 1,
            0.5, 2, 0.5, 1,     1, 1,
            0, 3.5, 0, 1,       0.5, 0,
            0.5, 2, 0.5, 1,     0, 1,
            -0.5, 2, 0.5, 1,    1, 1,
            0, 3.5, 0, 1,       0.5, 0,
            -0.5, 2, 0.5, 1,    0, 1,
            -0.5, 2, -0.5, 1,   1, 1,
            0, -0.5, 0, 1,      0.5, 1,
            0.5, 2, -0.5, 1,    1, 0,
            -0.5, 2, -0.5, 1,   0, 0,
            0, -0.5, 0, 1,      0.5, 1,
            0.5, 2, 0.5, 1,     1, 0,
            0.5, 2, -0.5, 1,    0, 0,
            0, -0.5, 0, 1,      0.5, 1,
            -0.5, 2, 0.5, 1,    1, 0,
            0.5, 2, 0.5, 1,     0, 0,
            0, -0.5, 0, 1,      0.5, 1,
            -0.5, 2, -0.5, 1,   1, 0,
            -0.5, 2, 0.5, 1,    0, 0,
        ]);

        

        this.shardBuffer = device.createBuffer({
            size: shard.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });


        device.queue.writeBuffer(this.shardBuffer, 0, shard);
      

        const shardIndices = new Uint32Array([
            0, 1, 2,
            3, 4, 5,
            6, 7, 8,
            9, 10, 11,
            
            12, 13, 14,
            15, 16, 17,
            18, 19, 20,
            21, 22, 23,    
        ]);



        this.shardIndexBuffer = device.createBuffer({
            size: shardIndices.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });

        device.queue.writeBuffer(this.shardIndexBuffer, 0, shardIndices);

        this.indexCount = shardIndices.length;


        this.shardUniformBuffer = device.createBuffer({
            size: UNIFORM_BYTES,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });



        this.shardBindGroup = device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.shardUniformBuffer } },
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

        this.device.queue.writeBuffer(this.shardUniformBuffer, 0, uniformData);

    }

    draw(renderPass) {
        this.updateRender();

        renderPass.setPipeline(this.pipeline);
        renderPass.setVertexBuffer(0, this.shardBuffer);
        renderPass.setIndexBuffer(this.shardIndexBuffer, 'uint32');
        renderPass.setBindGroup(0, this.shardBindGroup);
        renderPass.drawIndexed(this.indexCount);

    }

        
}