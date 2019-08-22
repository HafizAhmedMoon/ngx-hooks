import { InjectFlags, InjectionToken, Type } from '@angular/core';
import { ComponentContext } from './component';
import { getContext } from './context';

export function inject<T>(token: Type<T> | InjectionToken<T>, notFoundValue?: T, flags?: InjectFlags): T {
  const context = getContext<ComponentContext>();
  return context.injector.get(token, notFoundValue, flags);
}
