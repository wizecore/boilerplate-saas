import logger from "@/lib/logger";
import { useEffect } from "react";

/**
 * Creates the Matrix effect on the given element. Best fit for the console / terminal windows.
 *
 * const matrixRef = useRef<HTMLDivElement>(null);
 * useMatrixEffect(matrixRef);
 *
 * <div ref={matrixRef} className="relative z-[5]">
 * <div className="relative z-[10]">Overlay content</div>
 * </div>
 */
export const useMatrixEffect = (ref: React.RefObject<HTMLDivElement>) => {
  useEffect(() => {
    const parent = ref.current;
    if (!parent) {
      logger.error("No parent found", ref);
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.filter = "brightness(0.25)";
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      logger.error("No 2d context found", canvas);
      return;
    }

    parent.appendChild(canvas);
    const w = (canvas.width = document.body.offsetWidth);
    const h = (canvas.height = document.body.offsetHeight);
    const cols = Math.floor(w / 20) + 1;
    const ypos = Array(cols).fill(0);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);

    function matrix(ctx: CanvasRenderingContext2D) {
      ctx.fillStyle = "#0001";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#0f0";
      ctx.font = "13pt monospace";

      ypos.forEach((y, ind) => {
        const text = String.fromCharCode(Math.random() * 512);
        const x = ind * 20;
        ctx.fillText(text, x, y);
        if (y > 100 + Math.random() * 10000) {
          ypos[ind] = 0;
        } else {
          ypos[ind] = y + 20;
        }
      });
    }

    const interval = setInterval(() => matrix(ctx), 50);
    return () => {
      clearInterval(interval);
      parent.removeChild(canvas);
    };
  }, [ref]);
};
