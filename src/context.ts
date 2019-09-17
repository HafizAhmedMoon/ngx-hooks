import { Injector } from '@angular/core';

export interface Context {
  injector: Injector;
}

let contextStack: Context[] = [];

export function getContext<T extends Context>() {
  return contextStack[contextStack.length - 1] as T;
}

export function withContext<T extends Context, R>(context: T, fn: () => R) {
  contextStack.push(context);
  const result = fn();
  contextStack.pop();
  return result;
}
