export function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export const measureTextWidth = (() => {
  if (typeof document === "undefined") {
    return function measureTextWidth() {
      return 0;
    };
  }

  const canvas = document.createElement("canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d")!;
  ctx.font = "16px Inter";

  return function measureTextWidth(text: string) {
    return Math.ceil(ctx.measureText(text).width);
  };
})();
