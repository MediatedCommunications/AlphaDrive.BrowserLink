import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getBrowserExtensionAPI(): typeof chrome {
  if (typeof chrome !== 'undefined') {
    return chrome;
  }
  return browser;
}

export function checkSelector(selector: string): boolean {
  return document.querySelectorAll(selector).length > 0;
}

export function checkAnySelector(selectors: string[]): boolean {
  return selectors.some((selector) => checkSelector(selector));
}
