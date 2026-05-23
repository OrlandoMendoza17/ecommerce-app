// useScrollToErro custom hook
import { useEffect } from "react";
import { FieldErrors } from "react-hook-form";

const useScrollToError = (errors: FieldErrors) => {
  useEffect(() => {
    let elements = Array.from(document.getElementsByClassName("FormError"));
    elements = elements.map(e => e.parentElement).filter(Boolean) as Element[];
    elements.sort((a, b) => b.scrollHeight - a.scrollHeight);
    const target = elements[0];
    if (!target) return;
    window.requestAnimationFrame(() => {
      const yOffset = -64 - 8;
      const y = target.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    });
  }, [errors]);
};

export default useScrollToError;
