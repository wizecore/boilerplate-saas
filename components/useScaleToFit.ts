import { useEffect, useRef } from "react";

export const useScaleToFit = (width: number) => {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!elementRef.current) {
      return;
    }

    const updateScale = () => {
      if (!elementRef.current) {
        return;
      }

      const targetElement = elementRef.current.parentElement;
      if (!targetElement) {
        return;
      }

      const height = Array.from(elementRef.current.children)
        .filter(el => el instanceof HTMLElement)
        .filter(el => el.classList.contains("left-0"))
        .reduce((acc, element) => {
          if (element instanceof HTMLElement) {
            return acc + element.clientHeight;
          }
          return acc;
        }, 0);

      const targetWidth = targetElement.clientWidth;

      if (targetWidth < width) {
        const scale = targetWidth / width;
        elementRef.current.style.transformOrigin = "0 0";
        elementRef.current.style.transform = `scale(${scale})`;
        targetElement.style.height = height * scale + "px";
      } else {
        elementRef.current.style.transform = "none";
        const pad = Math.round(targetWidth - width) / 2;
        elementRef.current.style.transform = "scale(1.0) translateX(" + pad + "px)";
        elementRef.current.style.transformOrigin = "0 0";
        targetElement.style.height = height + "px";
      }
    };

    const resizeObserver = new ResizeObserver(updateScale);
    const updateObserver = new MutationObserver(updateScale);
    resizeObserver.observe(elementRef.current.parentElement!);
    updateObserver.observe(elementRef.current, {
      childList: true,
      subtree: true
    });

    updateScale();

    return () => {
      resizeObserver.disconnect();
    };
  }, [width]);

  return { elementRef };
};
