import gsap from "gsap";

const widgets = [
  { image: "/widget_1.jpg", name: "Velvet" },
  { image: "/widget_2.jpg", name: "Glass Relay" },
  { image: "/widget_3.jpg", name: "Noir-17" },
  { image: "/widget_4.jpg", name: "Driftline" },
  { image: "/widget_5.jpg", name: "Pulse 9" },
  { image: "/widget_6.jpg", name: "Cold Meridian" },
  { image: "/widget_7.jpg", name: "Astra" },
  { image: "/widget_8.jpg", name: "Mono Circuit" },
  { image: "/widget_9.jpg", name: "Lumen-04" },
  { image: "/widget_10.jpg", name: "Shadow Bloom" },
];

const lerp = (a, b, t) => a + (b - a) * t;

const createSVG = (type, attrs = {}) => {
  const svgElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    type
  );
  Object.entries(attrs).forEach(([k, v]) => svgElement.setAttribute(k, v));
  return svgElement;
};

let svg, centerX, centerY, outerRadius;
let currentIndicatorRotation = 0;
let targetIndicatorRotation = 0;
let currentSpinnerRotation = 0;
let targetSpinnerRotation = 0;
let lastTime = performance.now();
let lastSegmentIndex = -1;

const createWidgetSpinner = () => {
  const container = document.querySelector(".widgets");
  const viewportSize = Math.min(window.innerWidth, window.innerHeight);
  outerRadius = viewportSize * 0.4;
  const innerRadius = viewportSize * 0.25;
  centerX = window.innerWidth / 2;
  centerY = window.innerHeight / 2;

  svg = createSVG("svg", { id: "widget-svg" });
  const defs = createSVG("defs");
  svg.appendChild(defs);

  const anglePerSegment = (2 * Math.PI) / widgets.length;

  for (let i = 0; i < widgets.length; i++) {
    const startAngle = i * anglePerSegment - Math.PI / 2;
    const endAngle = (i + 1) * anglePerSegment - Math.PI / 2;
    const midAngle = (startAngle + endAngle) / 2;

    const clipPath = createSVG("clipPath", { id: `clip-${i}` });
    const path = `M ${centerX + outerRadius * Math.cos(startAngle)} ${
      centerY + outerRadius * Math.sin(startAngle)
    } A ${outerRadius} ${outerRadius} 0 0 1 ${
      centerX + outerRadius * Math.cos(endAngle)
    } ${centerY + outerRadius * Math.sin(endAngle)} L ${
      centerX + innerRadius * Math.cos(endAngle)
    } ${
      centerY + innerRadius * Math.sin(endAngle)
    } A ${innerRadius} ${innerRadius} 0 0 0 ${
      centerX + innerRadius * Math.cos(startAngle)
    } ${centerY + innerRadius * Math.sin(startAngle)} Z`;

    clipPath.appendChild(createSVG("path", { d: path }));
    defs.appendChild(clipPath);

    const g = createSVG("g", {
      "clip-path": `url(#clip-${i})`,
      "data-segment": i,
    });

    const segmentRadius = (innerRadius + outerRadius) / 2;
    const segmentX = centerX + Math.cos(midAngle) * segmentRadius;
    const segmentY = centerY + Math.sin(midAngle) * segmentRadius;

    const arcLength = outerRadius * anglePerSegment;
    const imgWidth = arcLength * 1.25;
    const imgHeight = (outerRadius - innerRadius) * 1.25;
    const rotation = (midAngle * 180) / Math.PI + 90;

    const image = createSVG("image", {
      href: widgets[i].image,
      width: imgWidth,
      height: imgHeight,
      x: segmentX - imgWidth / 2,
      y: segmentY - imgHeight / 2,
      preserveAspectRatio: "xMidYMid slice",
      transform: `rotate(${rotation} ${segmentX} ${segmentY})`,
    });

    g.appendChild(image);
    svg.appendChild(g);
  }

  container.appendChild(svg);
};

createWidgetSpinner();

const updateContent = () => {
  const relativeRotation =
    (((currentIndicatorRotation - currentSpinnerRotation) % 360) + 360) % 360;
  const segmentIndex = Math.floor(relativeRotation / 36) % widgets.length;

  if (segmentIndex !== lastSegmentIndex) {
    lastSegmentIndex = segmentIndex;

    document.querySelector(".widget-title").textContent =
      widgets[segmentIndex].name;

    const previewContainer = document.querySelector(".widget-preview-img");
    const img = document.createElement("img");
    img.src = widgets[segmentIndex].image;
    img.alt = widgets[segmentIndex].name;

    gsap.set(img, { opacity: 0 });
    previewContainer.appendChild(img);
    gsap.to(img, { opacity: 1, duration: 0.1, ease: "power2.out" });

    const allImages = previewContainer.querySelectorAll("img");
    if (allImages.length > 3) {
      for (let i = 0; i < allImages.length - 3; i++) {
        previewContainer.removeChild(allImages[i]);
      }
    }
  }
};

const animate = () => {
  const currentTime = performance.now();
  let deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;
  deltaTime = Math.min(deltaTime, 0.1);

  targetIndicatorRotation += 18 * deltaTime;
  targetSpinnerRotation -= 18 * 0.25 * deltaTime;

  currentIndicatorRotation = lerp(
    currentIndicatorRotation,
    targetIndicatorRotation,
    0.1
  );
  currentSpinnerRotation = lerp(
    currentSpinnerRotation,
    targetSpinnerRotation,
    0.1
  );

  document
    .getElementById("widget-indicator")
    .setAttribute(
      "transform",
      `rotate(${currentIndicatorRotation % 360} ${centerX} ${centerY})`
    );

  svg.querySelectorAll("[data-segment]").forEach((seg) => {
    seg.setAttribute(
      "transform",
      `rotate(${currentSpinnerRotation % 360} ${centerX} ${centerY})`
    );
  });

  updateContent();

  requestAnimationFrame(animate);
};

const innerRadius = outerRadius * 0.625;
const widgetIndicator = createSVG("line", {
  id: "widget-indicator",
  x1: centerX,
  y1: centerY - innerRadius * 0.85,
  x2: centerX,
  y2: centerY - outerRadius * 1.05,
});
svg.appendChild(widgetIndicator);

animate();

window.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    const delta = e.deltaY * 0.05;
    targetIndicatorRotation += delta;
    targetSpinnerRotation -= delta;
  },
  { passive: false }
);

window.addEventListener("resize", () => {
  if (svg) svg.remove();
  createWidgetSpinner();

  const innerRadius = outerRadius * 0.625;
  const widgetIndicator = createSVG("line", {
    id: "widget-indicator",
    x1: centerX,
    y1: centerY - innerRadius * 0.85,
    x2: centerX,
    y2: centerY - outerRadius * 1.05,
  });
  svg.appendChild(widgetIndicator);
});
