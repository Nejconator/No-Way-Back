import { Transform } from './Transform.js';

export class Minimap {
    constructor(options = {}) {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    
    this.size =  300; 
    this.worldSize =  60;
    this.canvas.width = this.size;
    this.canvas.height = this.size;
    
    Object.assign(this.canvas.style, {
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            width: this.size + 'px',
            height: this.size + 'px',
            border: '2px solid white', 
            borderRadius: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: '10000',
            pointerEvents: 'none',
            display: 'block'     
        });

    document.body.appendChild(this.canvas);

    this.playerNode = options.playerNode;
    this.walls = options.walls || [];
    this.monkeys = options.monkeys || [];
    this.shards = options.shards || [];
}


worldToMap(x, z) {

    const centerX = x + (this.worldSize / 2);
    const centerZ = z + (this.worldSize / 2);

    const mapX = (centerX / this.worldSize) * this.size;
    const mapY = (centerZ / this.worldSize) * this.size;

    return { x: mapX, y: mapY };
}

update() {
    this.ctx.clearRect(0, 0, this.size, this.size);


    this.ctx.strokeStyle = 'white';
    this.ctx.lineWidth = 1;
    this.walls.forEach(wall => {
        const p = this.worldToMap(wall.pos[0], wall.pos[2]);

        const w = (wall.size[0] / this.worldSize) * this.size;
        const h = (wall.size[2] / this.worldSize) * this.size;

        this.ctx.strokeRect(p.x - w/2, p.y - h/2, w, h);
    });

    this.ctx.fillStyle = '#00ff00';
    this.shards.forEach(shard => {
       
        if (shard.visible === false) return;


        
        const t = shard.node.getComponentOfType(Transform);
        if (t) {
            const p = this.worldToMap(t.translation[0], t.translation[2]);
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
    });


    if (this.playerNode) {
        const trs = this.playerNode.getComponentOfType(Transform);
        if (trs) {
            const p = this.worldToMap(trs.translation[0], trs.translation[2]);
            this.ctx.fillStyle = 'yellow';
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);

            
            this.ctx.fill();
        }
    }

        this.ctx.fillStyle = '#ff0000';
        this.monkeys.forEach(m => {
            const node = m.node || m; 
            const trsf = node.getComponentOfType ? node.getComponentOfType(Transform) : null;


            if (trsf) {
                const p = this.worldToMap(trsf.translation[0], trsf.translation[2]);
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
}
}
