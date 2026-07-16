import { HTMLAttributes } from "react";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-[#14110F]/10 dark:bg-[#FAF8F3]/10 ${className || ""}`}
      {...props}
    />
  );
}