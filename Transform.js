import { mat4 } from './glm.js';

export class Transform {

    constructor({
        rotation = [0, 0, 0, 1],
        translation = [0, 0, 0],
        scale = [1, 1, 1],
    } = {}) {
        this.rotation = rotation;
        this.translation = translation;
        this.scale = scale;
    }

    get matrix() {
        return mat4.fromRotationTranslationScale(mat4.create(),
            this.rotation, this.translation, this.scale);
    }

}
