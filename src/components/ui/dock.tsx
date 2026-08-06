"use client";

import { motion, useMotionValue, useSpring, useTransform, MotionValue } from "motion/react";
import Link from "next/link";
import { useRef } from "react";

interface DockItemProps {
  label: string;
  icon: React.ReactNode;
  href: string;
  mouseX: MotionValue<number>;
}

function DockItem({ label, icon, href, mouseX }: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-150, 0, 150], [40, 80, 40]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  return (
    <Link href={href}>
      <motion.div
        ref={ref}
        style={{ width }}
        className="aspect-square bg-secondary/80 backdrop-blur-xl border border-border/50 rounded-2xl flex items-center justify-center relative group cursor-pointer overflow-hidden shadow-lg hover:bg-secondary transition-colors"
      >
        <motion.div className="flex items-center justify-center text-foreground w-1/2 h-1/2">
          {icon}
        </motion.div>
        
        {/* Tooltip */}
        <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap pointer-events-none shadow-xl border border-border">
          {label}
        </div>
      </motion.div>
    </Link>
  );
}

export function Dock({
  items,
}: {
  items: { label: string; icon: React.ReactNode; href: string }[];
}) {
  const mouseX = useMotionValue(Infinity);

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
    >
      <div 
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className="flex items-end gap-3 px-4 pb-3 pt-4 bg-background/50 backdrop-blur-2xl border border-border/50 rounded-3xl shadow-2xl pointer-events-auto"
      >
        {items.map((item, i) => (
          <DockItem key={i} mouseX={mouseX} {...item} />
        ))}
      </div>
    </motion.div>
  );
}
