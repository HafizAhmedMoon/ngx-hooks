import { Component, Injector } from '@angular/core';
import { Context, withContext } from './context';
import { getPropertyDescriptor } from './helpers';
import { ComponentLifecycleContext, Lifecycle, onDestroy } from './lifecycle';
import { InternalRef, isRef } from './state';
import { ComponentWatchContext } from './watch';

export interface ComponentContext extends ComponentWatchContext, ComponentLifecycleContext, Context {}

function createContext(injector: Injector): ComponentContext {
  return { injector };
}

type NgHooksPropsProtected = '__context';

const propsProtected: NgHooksPropsProtected[] & string[] = ['__context'];

export type NgHooksContext<C extends NgHooks, P = Omit<C, NgHooksPropsProtected>> = {
  [K in keyof P]: P[K];
};
export type NgHooksFunction<T, R = any> = (props: NgHooksContext<T>) => NgHooksFunctionReturn<R>;
export type NgHooksFunctionReturn<R = any> = R & { [key: string]: any };

interface Type<T> {
  new (...args: any[]): T;
}

export interface NgHooks {
  [key: string]: any;
}

export abstract class FunctionComponent implements NgHooks {
  [key: string]: any;
}

interface NgHooksStatic<T> extends Type<FunctionComponent> {
  ngHooks: NgHooksFunction<T>;
}

const ANNOTATIONS = '__annotations__';
const PARAMETERS = '__parameters__';
const PROP_METADATA = '__prop__metadata__';

const NG_COMPONENT_DEF = 'ngComponentDef';
const ComponentDefProps_DoNotCopy = [
  'type',
  'factory',
  'onChanges',
  'onInit',
  'doCheck',
  'afterContentInit',
  'afterContentChecked',
  'afterViewInit',
  'afterViewChecked',
  'onDestroy',
  'setInput',
];

export function NgHooks<T>() {
  return (target: NgHooksStatic<T>) => {
    @Component({
      template: '',
    })
    class HookHelperComponent extends target implements Lifecycle {
      __context: ComponentContext;

      constructor(injector: Injector) {
        super();
        const context = (this.__context = createContext(injector));

        withContext(context, () => setup.call(this, target));
      }

      ngOnChanges(changes) {
        this.__context.lifecycleEvents.next({ event: 'ngOnChanges', arg: changes });
      }
      ngOnInit() {
        this.__context.lifecycleEvents.next({ event: 'ngOnInit' });
      }
      ngDoCheck() {
        this.__context.lifecycleEvents.next({ event: 'ngDoCheck' });
      }
      ngAfterContentInit() {
        this.__context.lifecycleEvents.next({ event: 'ngAfterContentInit' });
      }
      ngAfterContentChecked() {
        this.__context.lifecycleEvents.next({ event: 'ngAfterContentChecked' });
      }
      ngAfterViewInit() {
        this.__context.lifecycleEvents.next({ event: 'ngAfterContentInit' });
      }
      ngAfterViewChecked() {
        this.__context.lifecycleEvents.next({ event: 'ngAfterContentChecked' });
      }
      ngOnDestroy() {
        this.__context.lifecycleEvents.next({ event: 'ngOnDestroy' });
      }
    }

    // for Ivy render
    const targetComponentDef = target[NG_COMPONENT_DEF];
    if (targetComponentDef) {
      const destComponentDef = HookHelperComponent[NG_COMPONENT_DEF];
      Object.keys(targetComponentDef).forEach((key) => {
        if (ComponentDefProps_DoNotCopy.includes(key)) return;
        destComponentDef[key] = targetComponentDef[key];
      });
    } else {
      Object.defineProperty(HookHelperComponent, ANNOTATIONS, { value: target[ANNOTATIONS] || [] });
      Object.defineProperty(HookHelperComponent, PARAMETERS, { value: target[PARAMETERS] || [] });
      Object.defineProperty(HookHelperComponent, PROP_METADATA, { value: target[PROP_METADATA] || {} });
    }

    Object.defineProperty(HookHelperComponent, 'name', { value: target.name, configurable: true });

    return HookHelperComponent as any;
  };
}

function setup(this: NgHooks) {
  const result = (this.constructor as NgHooksStatic<any>).ngHooks.call(undefined, this);

  copyResultToContext.call(this, result);
}

function copyResultToContext(this: NgHooks, result: Object) {
  if (result == null) return;

  Object.getOwnPropertyNames(result).forEach((objKey) => {
    if (propsProtected.includes(objKey)) return;

    const resultElement = result[objKey];
    if (isRef(resultElement)) {
      bindRefToContext(this, objKey, resultElement as InternalRef);
    } else {
      this[objKey] = resultElement;
    }
  });
}

function bindRefToContext<T extends object>(obj: T, key: keyof T, ref: InternalRef) {
  const propertyDescriptor = getPropertyDescriptor(obj, key);

  Object.defineProperty(obj, key, {
    configurable: true,
    get() {
      return ref.value;
    },
    set(val) {
      ref.value = val;
    },
  });

  if (propertyDescriptor && !Object.prototype.hasOwnProperty.call(obj, 'value')) {
    const subscription = ref.__updates.subscribe(() => propertyDescriptor.set(ref.__value));
    onDestroy(() => subscription.unsubscribe());

    propertyDescriptor.set(ref.__value);
  }
}
