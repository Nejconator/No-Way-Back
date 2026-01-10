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

        this.imageBitmap = await fetch('monkey.PNG')
        .then(r => r.blob())
        .then(b => createImageBitmap(b));

        this.imageBitmap2 = await fetch('suit.PNG')
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
            -0.75, 0, -0.5, 1,          1, 1,
            0.75, 0, -0.5, 1,          0, 1,
            -0.75, 0, 0.5, 1,          1, 1,
            0.75, 0, 0.5, 1,          0, 1,

            -0.75, 3, -0.5, 1,          1, 0,
            0.75, 3, -0.5, 1,          0, 0,
            -0.75, 3, 0.5, 1,          1, 0,
            0.75, 3, 0.5, 1,          0, 0,
        ]);

        const head = new Float32Array([
            // positions         // texcoords
            -0.5, -2.5, -0.3, 1,      1, 1,
            0.5, -2.5, -0.3, 1,      0, 1,
            -0.5, -2.5, 0.3, 1,      1, 1,
            0.5, -2.5, 0.3, 1,      0, 1,

            -0.5, 0, -0.3, 1,      1, 0,
            0.5, 0, -0.3, 1,      0, 0,
            -0.5, 0, 0.3, 1,      1, 0,
            0.5, 0, 0.3, 1,      0, 0,
        ]);

        const arm1 = new Float32Array([
            // positions         // texcoords
           0.35, -0.25,-0.25, 1,      0, 0,
           0.5, -0.25, -0.25, 1,      1, 0,
           0.5, -0.25, 0.25, 1,      0, 0,
           0.35, -0.25, 0.25, 1,      1, 0,

            0.65, -2,-0.25, 1,      0, 1,
           0.8, -2, -0.25, 1,      1, 1,
           0.8, -2, 0.25, 1,      0, 1,
           0.65, -2, 0.25, 1,      1, 1,

        ]);

        const arm2 = new Float32Array([
            // positions         // texcoords
           -0.35, -0.25,-0.25, 1,      0, 0,    //0
           -0.5, -0.25, -0.25, 1,      1, 0,    //1
           -0.5, -0.25, 0.25, 1,      0, 0,     //2
           -0.35, -0.25, 0.25, 1,      1, 0,    //3

            -0.65, -2,-0.25, 1,      0, 1,      //4
           -0.8, -2, -0.25, 1,      1, 1,       //5
           -0.8, -2, 0.25, 1,      0, 1,        //6
           -0.65, -2, 0.25, 1,      1, 1,       //7

        ]);
        /*
        const leg1 = new Float32Array([
            // positions         // texcoords
            -0.4, -2.5, -0.15, 1,      0, 0,
            -0.1, -2.5, -0.15, 1,      1, 0,
            -0.1, -2.5, 0.15, 1,      1, 1,
            -0.4, -2.5, 0.15, 1,      0, 1,

            -0.4, -4, -0.15, 1,      0, 0,
            -0.1, -4, -0.15, 1,      1, 0,
            -0.1, -4, 0.15, 1,      1, 1,
            -0.4, -4, 0.15, 1,      0, 1,
        ]);

        const leg2 = new Float32Array([
            // positions         // texcoords
            0.4, -2.5, -0.15, 1,      0, 0,
            0.1, -2.5, -0.15, 1,      1, 0,
            0.1, -2.5, 0.15, 1,      1, 1,
            0.4, -2.5, 0.15, 1,      0, 1,

            0.4, -4, -0.15, 1,      0, 0,
            0.1, -4, -0.15, 1,      1, 0,
            0.1, -4, 0.15, 1,      1, 1,
            0.4, -4, 0.15, 1,      0, 1,
        ]);

        */

        const leg = new Float32Array([
            -0.5, -2.5, -0.3, 1,      0, 1,
            0.5, -2.5, -0.3, 1,      1, 1,
            -0.5, -2.5, 0.3, 1,      1, 0,
            0.5, -2.5, 0.3, 1,      0, 0,

            0, -3.5, 0, 1,      0.5, 0.5,
        ]);
        
       

        this.bodyBuffer = device.createBuffer({
            size: body.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });

        this.headBuffer = device.createBuffer({
            size: head.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });

        this.arm1Buffer = device.createBuffer({
            size: arm1.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });

        this.arm2Buffer = device.createBuffer({
            size: arm2.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        /*
        this.leg1Buffer = device.createBuffer({
            size: leg1.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });

        this.leg2Buffer = device.createBuffer({
            size: leg2.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        */
        this.legBuffer = device.createBuffer({
            size: leg.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        


        device.queue.writeBuffer(this.bodyBuffer, 0, body);
        device.queue.writeBuffer(this.headBuffer, 0, head);
        device.queue.writeBuffer(this.arm1Buffer, 0, arm1);
        device.queue.writeBuffer(this.arm2Buffer, 0, arm2);
        //device.queue.writeBuffer(this.leg1Buffer, 0, leg1);
        //device.queue.writeBuffer(this.leg2Buffer, 0, leg2);
        device.queue.writeBuffer(this.legBuffer, 0, leg);

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
        //12
        //56
        const arm1Indices = new Uint32Array([
            0, 2, 1,
            1, 2, 3,
            1, 6, 2,
            1, 5, 6,
            2, 6, 3,
            3, 6, 7,
            0, 4, 2,
            2, 4, 6,
            1, 3, 5,
            3, 7, 5,
            4, 5, 6,
            5, 7, 6,
        ]);

        const arm2Indices = new Uint32Array([
            0, 2, 1,
            1, 2, 3,
            1, 6, 2,
            1, 5, 6,
            2, 6, 3,
            3, 6, 7,
            0, 4, 2,
            2, 4, 6,
            1, 3, 5,
            3, 7, 5,
            4, 5, 6,
            5, 7, 6,
        ]);
        /*
        const leg1Indices = new Uint32Array([
            0, 1, 2,    2, 1, 3,
            4, 0, 6,    6, 0, 2,
            5, 4, 7,    7, 4, 6,
            1, 5, 3,    3, 5, 7,
            6, 2, 7,    7, 2, 3,
            1, 0, 5,    5, 0, 4,
        ]);

        const leg2Indices = new Uint32Array([
            0, 1, 2,    2, 1, 3,    
            4, 0, 6,    6, 0, 2,
            5, 4, 7,    7, 4, 6,
            1, 5, 3,    3, 5, 7,
            6, 2, 7,    7, 2, 3,
            1, 0, 5,    5, 0, 4,
        ]);
        */
        const legIndices = new Uint32Array([
            0, 2, 1,
            1, 2, 3,
            0, 1, 4,
            1, 3, 4,
            3, 2, 4,
            2, 0, 4,
        ]);

        this.bodyIndexBuffer = device.createBuffer({
            size: bodyIndices.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });

        this.headIndexBuffer = device.createBuffer({
            size: headIndices.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });

        this.arm1IndexBuffer = device.createBuffer({
            size: arm1Indices.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });

        this.arm2IndexBuffer = device.createBuffer({
            size: arm2Indices.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });
        /*
        this.leg1IndexBuffer = device.createBuffer({
            size: leg1Indices.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });

        this.leg2IndexBuffer = device.createBuffer({
            size: leg2Indices.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });
        */
        this.legIndexBuffer = device.createBuffer({
            size: legIndices.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        })
       

        device.queue.writeBuffer(this.bodyIndexBuffer, 0, bodyIndices);
        device.queue.writeBuffer(this.headIndexBuffer, 0, headIndices);
        device.queue.writeBuffer(this.arm1IndexBuffer, 0, arm1Indices);
        device.queue.writeBuffer(this.arm2IndexBuffer, 0, arm2Indices);
        //device.queue.writeBuffer(this.leg1IndexBuffer, 0, leg1Indices);
        //device.queue.writeBuffer(this.leg2IndexBuffer, 0, leg2Indices);
        device.queue.writeBuffer(this.legIndexBuffer, 0, legIndices);

        this.bodyIndexCount = bodyIndices.length;
        this.headIndexCount = headIndices.length;
        this.arm1IndexCount = arm1Indices.length;
        this.arm2IndexCount = arm2Indices.length;
        //this.leg1IndexCount = leg1Indices.length;
        //this.leg2IndexCount = leg2Indices.length;
        this.legIndexCount = legIndices.length;

        this.bodyUniformBuffer = device.createBuffer({
            size: UNIFORM_BYTES,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.headUniformBuffer = device.createBuffer({
            size: UNIFORM_BYTES,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.arm1UniformBuffer = device.createBuffer({
            size: UNIFORM_BYTES,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.arm2UniformBuffer = device.createBuffer({
            size: UNIFORM_BYTES,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        /*
        this.leg1UniformBuffer = device.createBuffer({
            size: UNIFORM_BYTES,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.leg2UniformBuffer = device.createBuffer({
            size: UNIFORM_BYTES,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        */
        this.legUniformBuffer = device.createBuffer({
            size: UNIFORM_BYTES,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        

        this.bodyBindGroup = device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.bodyUniformBuffer } },
                { binding: 1, resource: this.texture.createView() },
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

        this.arm1BindGroup = device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.arm1UniformBuffer} },
                { binding: 1, resource: this.texture2.createView() },
                { binding: 2, resource: sampler },
            ]
        });

        this.arm2BindGroup = device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.arm2UniformBuffer} },
                { binding: 1, resource: this.texture2.createView() },
                { binding: 2, resource: sampler },
            ]
        });
        /*
        this.leg1BindGroup = device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.leg1UniformBuffer} },
                { binding: 1, resource: this.texture2.createView() },
                { binding: 2, resource: sampler },
            ]
        });

        this.leg2BindGroup = device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.leg2UniformBuffer} },
                { binding: 1, resource: this.texture2.createView() },
                { binding: 2, resource: sampler },
            ]
        });
        */
        this.legBindGroup = device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.legUniformBuffer} },
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
        this.device.queue.writeBuffer(this.arm1UniformBuffer, 0, uniformData);
        this.device.queue.writeBuffer(this.arm2UniformBuffer, 0, uniformData);
        //this.device.queue.writeBuffer(this.leg1UniformBuffer, 0, uniformData);
        //this.device.queue.writeBuffer(this.leg2UniformBuffer, 0, uniformData);
        this.device.queue.writeBuffer(this.legUniformBuffer, 0, uniformData);
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

        renderPass.setVertexBuffer(0, this.arm1Buffer);
        renderPass.setIndexBuffer(this.arm1IndexBuffer, 'uint32');
        renderPass.setBindGroup(0, this.arm1BindGroup);
        renderPass.drawIndexed(this.arm1IndexCount);

        renderPass.setVertexBuffer(0, this.arm2Buffer);
        renderPass.setIndexBuffer(this.arm2IndexBuffer, 'uint32');
        renderPass.setBindGroup(0, this.arm2BindGroup);
        renderPass.drawIndexed(this.arm2IndexCount);
        /*
        renderPass.setVertexBuffer(0, this.leg1Buffer);
        renderPass.setIndexBuffer(this.leg1IndexBuffer, 'uint32');
        renderPass.setBindGroup(0, this.leg1BindGroup);
        renderPass.drawIndexed(this.leg1IndexCount);

        renderPass.setVertexBuffer(0, this.leg2Buffer);
        renderPass.setIndexBuffer(this.leg2IndexBuffer, 'uint32');
        renderPass.setBindGroup(0, this.leg2BindGroup);
        renderPass.drawIndexed(this.leg2IndexCount);
        */
        renderPass.setVertexBuffer(0, this.legBuffer);
        renderPass.setIndexBuffer(this.legIndexBuffer, 'uint32');
        renderPass.setBindGroup(0, this.legBindGroup);
        renderPass.drawIndexed(this.legIndexCount);
        
    }

        
}