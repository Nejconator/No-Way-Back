// Lighting.js
export const MAX_POINT_LIGHTS = 16;
export const UNIFORM_FLOATS = 44 + 8 * MAX_POINT_LIGHTS;
export const UNIFORM_BYTES = UNIFORM_FLOATS * 4;

/**
 * lightingState = {
 *   dir: [x,y,z],
 *   dirColor: [r,g,b],
 *   ambient: number,
 *   pointLights: [{pos:[x,y,z], color:[r,g,b], intensity:number, range:number}, ...]
 * }
 */
export function buildUniformData({ mvp, model, cameraPos, lightingState }) {
  const data = new Float32Array(UNIFORM_FLOATS);

  data.set(mvp, 0);       // 0..15
  data.set(model, 16);    // 16..31

  const pointLights = lightingState?.pointLights ?? [];
  const count = Math.min(pointLights.length, MAX_POINT_LIGHTS);

  // cameraPos.xyz + count
  data.set([cameraPos[0], cameraPos[1], cameraPos[2], count], 32);

  const dir = lightingState?.dir ?? [0, -1, 0];
  const dirColor = lightingState?.dirColor ?? [1, 1, 1];
  const ambient = lightingState?.ambient ?? 0.2;

  // dir.xyz + intensity (w)
  data.set([dir[0], dir[1], dir[2], 1.0], 36);

  // dirColor.xyz + ambient (w)
  data.set([dirColor[0], dirColor[1], dirColor[2], ambient], 40);

  // Arrays
  const baseA = 44;
  const baseB = 44 + 4 * MAX_POINT_LIGHTS;

  for (let i = 0; i < MAX_POINT_LIGHTS; i++) {
    if (i < count) {
      const L = pointLights[i];
      data.set([L.pos[0], L.pos[1], L.pos[2], L.intensity], baseA + i * 4);
      data.set([L.color[0], L.color[1], L.color[2], L.range], baseB + i * 4);
    } else {
      data.set([0, 0, 0, 0], baseA + i * 4);
      data.set([0, 0, 0, 0], baseB + i * 4);
    }
  }

  return data;
}

export const enemyLight = {
  pos: [0, 0, 0],
  color: [1.0, 0.0, 0.0],
  intensity: 3.0,
  range: 7.0,
};

export const lightingState = {
  dir: [0.3, -1.0, 0.2],
  dirColor: [0, 0, 0],
  ambient: 0.2,
  pointLights: [
    enemyLight,
    { pos: [0, 9.6, 0], color: [1.0, 0.75, 0.35], intensity: 1.2, range: 11 },
    { pos: [-2, 9.6, -28], color: [1.0, 0.75, 0.35], intensity: 1.2, range: 11 },
    { pos: [28, 9.6, -28], color: [1.0, 0.75, 0.35], intensity: 1.2, range: 11 },
    { pos: [-15, 9.6, -17], color: [1.0, 0.75, 0.35], intensity: 1.2, range: 11 },
    { pos: [28, 9.6, -13], color: [1.0, 0.75, 0.35], intensity: 1.2, range: 11 },
    { pos: [-25, 9.6, -9], color: [1.0, 0.75, 0.35], intensity: 1.2, range: 11 },
    { pos: [12, 9.6, -5], color: [1.0, 0.75, 0.35], intensity: 1.2, range: 11 },
    { pos: [-22, 9.6, 11], color: [1.0, 0.75, 0.35], intensity: 1.2, range: 11 },
    { pos: [24, 9.6, 2], color: [1.0, 0.75, 0.35], intensity: 1.2, range: 11 },
    { pos: [-10, 9.6, 3], color: [1.0, 0.75, 0.35], intensity: 1.2, range: 11 },
    { pos: [2, 9.6, 11], color: [1.0, 0.75, 0.35], intensity: 1.2, range: 11 },
    { pos: [24, 9.6, 20], color: [1.0, 0.75, 0.35], intensity: 1.2, range: 11 },
    { pos: [-16, 9.6, 28], color: [1.0, 0.75, 0.35], intensity: 1.2, range: 11 },
    //{ pos: [-2, 9.6, 28], color: [1.0, 0.75, 0.35], intensity: 1.2, range: 11 },
    { pos: [12, 9.6, 28], color: [1.0, 0.75, 0.35], intensity: 1.2, range: 11 },
    { pos: [-28, 9.6, -28], color: [1.0, 0.75, 0.35], intensity: 1.2, range: 11 },
  ],
};