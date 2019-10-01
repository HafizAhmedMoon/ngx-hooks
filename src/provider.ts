import {
  ClassProvider,
  ClassSansProvider,
  FactoryProvider,
  Injectable,
  InjectionToken,
  Injector,
  Type,
} from '@angular/core';
import { Subject } from 'rxjs';
import { Context, withContext } from './context';
import { BaseLifecycle, BasicLifecycleContext, registerLifecycleCleanup } from './lifecycle';

type Factory<T extends object> = () => T;

interface ProviderContext extends BasicLifecycleContext, Context {}

function createContext(injector: Injector): ProviderContext {
  return { injector, lifecycleEvents: new Subject(), __basicLifecycle: 1 };
}

type ProviderReturn<N extends string, T> = [InjectionToken<T>, ClassProvider] & {
  name: N;
  token: InjectionToken<T>;
  provider: ClassProvider;
};

export function createProvider<N extends string, T extends object>(
  name: N,
  { providedIn, factory }: { providedIn?: Type<any> | 'root'; factory: Factory<T> }
): ProviderReturn<N, T>;
export function createProvider<N extends string, T extends object>(name: N, factory: Factory<T>): ProviderReturn<N, T>;
export function createProvider<N extends string, T extends object>(
  name: N,
  factoryOrOptions: { providedIn?: Type<any> | 'root'; factory: Factory<T> } | Factory<T>
): ProviderReturn<N, T> {
  let providedIn;
  let factory = factoryOrOptions as Factory<T>;

  if (typeof factoryOrOptions !== 'function') {
    providedIn = factoryOrOptions.providedIn;
    factory = factoryOrOptions.factory;
  }

  const token = new InjectionToken<T>(name, { providedIn, factory });

  @Injectable()
  class FunctionProviderHelper implements BaseLifecycle {
    private __context: ProviderContext;
    constructor(injector: Injector) {
      const context = (this.__context = createContext(injector));
      withContext(context, () => {
        const result = factory();
        if (result == null) {
          Object.getOwnPropertyNames(result).forEach((propKey) => {
            this[propKey] = result[propKey];
          });
        }

        registerLifecycleCleanup();
      });
    }
    ngOnDestroy() {
      this.__context.lifecycleEvents.next({ event: 'ngOnDestroy' });
    }
  }
  Object.defineProperty(FunctionProviderHelper, 'name', { value: name, writable: false, configurable: true });

  const provider: ClassProvider = {
    provide: token,
    useClass: FunctionProviderHelper,
  };

  return Object.assign([token, provider], { name, token, provider }) as ProviderReturn<N, T>;
}
