import { Transform } from './Transform.js';

export class Collisions {
    constructor({ playerNode, playerSize = [1, 1.8, 1], wallColliders = [] }) {
        this.playerNode = playerNode;
        this.playerSize = this._toVec(playerSize);
        this.wallColliders = wallColliders.slice();
       
    }

    _toVec(s) {
        if (Array.isArray(s)) return s;
        if (typeof s === 'object') return [s.x || 1, s.y || 1, s.z || 1];
        return [1, 1, 1];
    }

    _getPositionOf(node) {
        if (!node) return [0,0,0];
        try {
            const t = node.getComponentOfType?.(Transform);
            if (t && Array.isArray(t.translation)) return t.translation;

            if (Array.isArray(node.translation)) return node.translation;
        } catch (e) {

        }
        return [0,0,0];
    }


    _getAABB(node, size) {
        const pos = this._getPositionOf(node);
        const half = [size[0] / 2, size[1] / 2, size[2] / 2];
        return {
            min: [pos[0] - half[0], pos[1] - half[1], pos[2] - half[2]],
            max: [pos[0] + half[0], pos[1] + half[1], pos[2] + half[2]],
            center: pos
        };
    }


    _aabbIntersect(a, b) {
        return !(
            a.max[0] < b.min[0] || a.min[0] > b.max[0] ||
            a.max[1] < b.min[1] || a.min[1] > b.max[1] ||
            a.max[2] < b.min[2] || a.min[2] > b.max[2]
        );
    }


    _getPenetration(a, b) {
        if (!this._aabbIntersect(a, b)) return null;
        const penX = Math.min(a.max[0] - b.min[0], b.max[0] - a.min[0]);
        const penY = Math.min(a.max[1] - b.min[1], b.max[1] - a.min[1]);
        const penZ = Math.min(a.max[2] - b.min[2], b.max[2] - a.min[2]);
        return [penX, penY, penZ];
    }


    update() {
        if (!this.playerNode) return;

        const playerAABB = this._getAABB(this.playerNode, this.playerSize);

        for (const wc of this.wallColliders) {
            const node = wc.node ?? wc;
            const size = this._toVec(wc.size ?? [1,1,1]);
            const aabb = this._getAABB(node, size);
            const pen = this._getPenetration(playerAABB, aabb);
            if (pen) {
                let [px, py, pz] = pen;
                const axes = [
                    { axis: 'x', pen: px },
                    { axis: 'z', pen: pz },
                    { axis: 'y', pen: py }
                ];
                axes.sort((a,b) => a.pen - b.pen);
                const smallest = axes[0];
                const playerPos = this._getPositionOf(this.playerNode);
                const otherCenter = aabb.center;

                let sign = (playerPos[ smallest.axis === 'x' ? 0 : smallest.axis === 'y' ? 1 : 2 ] <
                            otherCenter[ smallest.axis === 'x' ? 0 : smallest.axis === 'y' ? 1 : 2 ]) ? -1 : 1;

                const epsilon = 0.0001;
                const push = (smallest.pen + epsilon) * sign;
                const t = this.playerNode.getComponentOfType?.(Transform);
                if (t && Array.isArray(t.translation)) {
                    if (smallest.axis === 'x') t.translation[0] += push;
                    else if (smallest.axis === 'y') t.translation[1] += push;
                    else t.translation[2] += push;
                } else {

                    if (smallest.axis === 'x') playerPos[0] += push;
                    else if (smallest.axis === 'y') playerPos[1] += push;
                    else playerPos[2] += push;
                }

                Object.assign(playerAABB, this._getAABB(this.playerNode, this.playerSize));
            }
        }

    }

    addWall(node, size = [1,1,1], meta = {}) {
        this.wallColliders.push({ node, size, meta });
    }

    removeWall(predicate) {
        this.wallColliders = this.wallColliders.filter(wc => !predicate(wc.meta));
    }

    
}
