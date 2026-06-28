import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { animate as motionAnimate } from "motion"
import type { DOMKeyframesDefinition, AnimationOptions, KeyframeGenerator } from "motion-dom"

type AnimateElOptions = Omit<AnimationOptions, "type"> & {
  type?: AnimationOptions["type"] | KeyframeGenerator<number>
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function animateEl(
  el: Element | NodeListOf<Element> | Element[] | string,
  keyframes: DOMKeyframesDefinition,
  options?: AnimateElOptions
) {
  return motionAnimate(el as Element, keyframes, options as AnimationOptions)
}
