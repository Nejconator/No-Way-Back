import { mat4 } from './glm.js';

export class Camera {

    constructor({
        aspect = 1,
        fovy = 1,
        near = 0.01,
        far = 1000,
    } = {}) {
        this.aspect = aspect;
        this.fovy = fovy;
        this.near = near;
        this.far = far;
    }

    get matrix() {
        const { fovy, aspect, near, far } = this;
        return mat4.perspectiveZO(mat4.create(), fovy, aspect, near, far);
    }

}
