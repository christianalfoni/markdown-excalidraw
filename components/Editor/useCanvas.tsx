import { useEffect, useRef, useState } from "react";

var PIXEL_RATIO = (function () {
  var ctx = document.createElement("canvas").getContext("2d"),
    dpr = window.devicePixelRatio || 1,
    bsr =
      //@ts-ignore
      ctx.webkitBackingStorePixelRatio ||
      //@ts-ignore
      ctx.mozBackingStorePixelRatio ||
      //@ts-ignore
      ctx.msBackingStorePixelRatio ||
      //@ts-ignore
      ctx.oBackingStorePixelRatio ||
      //@ts-ignore
      ctx.backingStorePixelRatio ||
      1;

  return dpr / bsr;
})();

export function useCanvas(
  width: number,
  height: number
): [JSX.Element, CanvasRenderingContext2D] {
  const ratio = PIXEL_RATIO;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D>(
    null as unknown as CanvasRenderingContext2D
  );
  const canvas = (
    <canvas
      ref={canvasRef}
      width={width * ratio}
      height={height * ratio}
      style={{
        width: width + "px",
        height: height + "px",
      }}
    ></canvas>
  );

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    setContext(ctx);
  }, []);

  return [canvas, context];
}
