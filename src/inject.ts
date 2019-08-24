import { InjectFlags, InjectionToken } from '@angular/core';
import { ComponentContext } from './component';
import { getContext } from './context';

interface TypeAbstract<T> extends Function {
  prototype: T;
}

export function inject<T>(token: TypeAbstract<T> | InjectionToken<T>, notFoundValue?: T, flags?: InjectFlags): T {
  const { injector } = getContext<ComponentContext>();
  if (!injector || typeof injector.get !== 'function') {
    throw new Error('ngx-hooks: Injector is not available, unsupported compiler mode');
  }
  return injector.get(token as any, notFoundValue, flags);
}
