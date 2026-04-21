import { useEffect, useRef, useState } from "react";

interface BMIMeterProps {
  bmi: number;
  category: string;
}

export const BMIMeter = ({ bmi, category }: BMIMeterProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animatedBmi, setAnimatedBmi] = useState(0);

  // Animate the BMI value
  useEffect(() => {
    const targetBmi = Math.min(Math.max(bmi, 0), 40);
    const duration = 1500; // 1.5 seconds
    const startTime = performance.now();
    const startBmi = animatedBmi;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentBmi = startBmi + (targetBmi - startBmi) * easeOutCubic;
      
      setAnimatedBmi(currentBmi);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [bmi]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height - 30;
    const radius = Math.min(width, height) - 60;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Get computed styles for theming
    const computedStyle = getComputedStyle(document.documentElement);
    const primaryColor = `hsl(${computedStyle.getPropertyValue("--primary").trim()})`;
    const mutedColor = `hsl(${computedStyle.getPropertyValue("--muted-foreground").trim()})`;
    const foregroundColor = `hsl(${computedStyle.getPropertyValue("--foreground").trim()})`;

    // Define BMI zones with colors
    const zones = [
      { min: 0, max: 18.5, color: "#3b82f6", label: "Underweight" },
      { min: 18.5, max: 25, color: "#22c55e", label: "Normal" },
      { min: 25, max: 30, color: "#f59e0b", label: "Overweight" },
      { min: 30, max: 40, color: "#ef4444", label: "Obese" },
    ];

    // Draw arc segments
    const startAngle = Math.PI;
    const endAngle = 2 * Math.PI;
    const totalRange = 40; // BMI range 0-40

    zones.forEach((zone) => {
      const zoneStartAngle = startAngle + (zone.min / totalRange) * Math.PI;
      const zoneEndAngle = startAngle + (zone.max / totalRange) * Math.PI;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, zoneStartAngle, zoneEndAngle);
      ctx.lineWidth = 25;
      ctx.strokeStyle = zone.color;
      ctx.lineCap = "butt";
      ctx.stroke();
    });

    // Draw tick marks and labels
    ctx.fillStyle = mutedColor;
    ctx.font = "12px Inter, sans-serif";
    ctx.textAlign = "center";

    const ticks = [0, 10, 18.5, 25, 30, 40];
    ticks.forEach((tick) => {
      const angle = startAngle + (tick / totalRange) * Math.PI;
      const innerRadius = radius - 35;
      const outerRadius = radius + 15;

      const x1 = centerX + Math.cos(angle) * innerRadius;
      const y1 = centerY + Math.sin(angle) * innerRadius;
      const x2 = centerX + Math.cos(angle) * outerRadius;
      const y2 = centerY + Math.sin(angle) * outerRadius;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = mutedColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Labels
      const labelRadius = radius + 30;
      const labelX = centerX + Math.cos(angle) * labelRadius;
      const labelY = centerY + Math.sin(angle) * labelRadius;
      ctx.fillText(tick.toString(), labelX, labelY);
    });

    // Draw needle with animation
    const clampedBmi = Math.min(Math.max(animatedBmi, 0), 40);
    const needleAngle = startAngle + (clampedBmi / totalRange) * Math.PI;
    const needleLength = radius - 40;

    // Needle shadow
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // Draw needle
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    const needleX = centerX + Math.cos(needleAngle) * needleLength;
    const needleY = centerY + Math.sin(needleAngle) * needleLength;
    ctx.lineTo(needleX, needleY);
    ctx.strokeStyle = foregroundColor;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.restore();

    // Draw needle tip (triangle pointer)
    const tipLength = 15;
    const tipWidth = 8;
    ctx.save();
    ctx.translate(needleX, needleY);
    ctx.rotate(needleAngle + Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(0, -tipLength);
    ctx.lineTo(-tipWidth / 2, 0);
    ctx.lineTo(tipWidth / 2, 0);
    ctx.closePath();
    ctx.fillStyle = foregroundColor;
    ctx.fill();
    ctx.restore();

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 15, 0, 2 * Math.PI);
    ctx.fillStyle = primaryColor;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
    ctx.fillStyle = foregroundColor;
    ctx.fill();

  }, [animatedBmi]);

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "underweight":
        return "text-blue-500";
      case "normal":
        return "text-green-500";
      case "overweight":
        return "text-amber-500";
      case "obese":
        return "text-red-500";
      default:
        return "text-primary";
    }
  };

  return (
    <div className="flex flex-col items-center">
      <canvas
        ref={canvasRef}
        width={300}
        height={180}
        className="max-w-full"
      />
      <div className="text-center mt-4">
        <div className="text-5xl font-bold text-primary">{bmi.toFixed(1)}</div>
        <div className={`text-xl font-semibold mt-1 ${getCategoryColor(category)}`}>
          {category}
        </div>
      </div>
    </div>
  );
};
