import { Injector } from '@angular/core';

export interface Context {
  injector: Injector;
}

let currentContext: Context = null;

export function getContext<T extends Context>() {
  return currentContext as T;
}

export function withContext<T extends Context, R>(context: T, fn: () => R) {
  currentContext = context;
  const result = fn();
  currentContext = null;
  return result;
}
