import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { animate as motionAnimate } from "motion"
import type { DOMKeyframesDefinition, AnimationOptions } from "motion-dom"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function animateEl(
  el: Element | NodeListOf<Element> | Element[] | string,
  keyframes: DOMKeyframesDefinition,
  options?: AnimationOptions
) {
  return motionAnimate(el as Element, keyframes, options)
}
