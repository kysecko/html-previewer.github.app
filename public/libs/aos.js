(function () {
  const elements = document.querySelectorAll("[data-aos]");

  function animate() {
    const windowHeight = window.innerHeight;

    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const offset = el.dataset.aosOffset || 120;
      const once = el.dataset.aosOnce !== "false";

      if (rect.top <= windowHeight - offset) {
        el.classList.add("aos-animate");
      } else if (!once) {
        el.classList.remove("aos-animate");
      }
    });
  }

  function init() {
    elements.forEach(el => {
      const delay = el.dataset.aosDelay || 0;
      const duration = el.dataset.aosDuration || 800;

      el.style.transitionDuration = duration + "ms";
      el.style.transitionDelay = delay + "ms";
    });

    animate();
    window.addEventListener("scroll", animate);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
