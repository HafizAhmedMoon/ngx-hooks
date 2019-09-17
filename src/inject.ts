import { InjectFlags, InjectionToken } from '@angular/core';
import { DirectiveContext } from './common';
import { getContext } from './context';

interface TypeAbstract<T> extends Function {
  prototype: T;
}

export function inject<T>(token: TypeAbstract<T> | InjectionToken<T>, notFoundValue?: T, flags?: InjectFlags): T {
  const { injector } = getContext<DirectiveContext>() || ({} as DirectiveContext);
  if (!injector || typeof injector.get !== 'function') {
    throw new Error('ngx-hooks: Injector is not available');
  }
  return injector.get(token as any, notFoundValue, flags);
}
