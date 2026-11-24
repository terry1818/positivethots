/** Geometry for the daily spin wheel. Wedge 0 starts at the top and wedges run clockwise; the pointer sits at the top. */

/** Degrees the wheel must be turned (clockwise, 0–360) so the pointer rests inside wedge `index`.
 *  `within` moves the resting point off the wedge's centre, in degrees; keep it under half a wedge. */
export function landingRotation(index: number, wedgeCount: number, within = 0): number {
  const seg = 360 / wedgeCount;
  return (((360 - (index * seg + seg / 2 + within)) % 360) + 360) % 360;
}

/** Which wedge is under the pointer after the wheel has been turned `rotation` degrees clockwise. */
export function wedgeUnderPointer(rotation: number, wedgeCount: number): number {
  const seg = 360 / wedgeCount;
  const atTop = (((360 - rotation) % 360) + 360) % 360;
  return Math.floor(atTop / seg) % wedgeCount;
}

/** Total clockwise travel for one spin: `turns` full turns, then on to the landing rotation. */
export function spinTravel(from: number, landing: number, turns = 6): number {
  return 360 * turns + ((((landing - from) % 360) + 360) % 360);
}
