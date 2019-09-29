import { Injector } from '@angular/core';
import { Subject } from 'rxjs';
import { Context } from './context';
import { getPropertyDescriptor } from './helpers';
import { ComposedLifecycle, DirectiveLifecycleContext, onDestroy, registerLifecycleCleanup } from './lifecycle';
import { InternalRef, isRef, Ref } from './state';
import { WatcherContext } from './watch';

export interface Options {
  lifecycle?: ComposedLifecycle<any>[];
}

export interface DirectiveContext extends WatcherContext, DirectiveLifecycleContext, Context {}

export function createDirectiveContext(injector: Injector): DirectiveContext {
  return { injector, lifecycleEvents: new Subject() };
}

const ProtectedProp = '__context';

type NgHooksProtectedProp = typeof ProtectedProp;

interface Type<T> {
  new (...args: any[]): T;
}

export interface NgHooksClass {
  [key: string]: any;
}

export abstract class FunctionClass implements NgHooksClass {
  [key: string]: any;
}

export interface NgHooksStatic<T> extends Type<FunctionClass> {
  ngHooks: NgHooks<T>;
}

export type NgHooksContext<C extends NgHooksClass, P = Omit<C, NgHooksProtectedProp>> = {
  readonly [K in keyof P]: P[K];
};

export type NgHooks<T, R = any> = (props: NgHooksContext<T>) => void | NgHooksReturn<R>;
export type NgHooksReturn<R = any> = { [P in keyof R]?: Ref<R[P]> | R[P] } & { [key: string]: any };

const ANNOTATIONS = '__annotations__';
const PARAMETERS = '__parameters__';
const PROP_METADATA = '__prop__metadata__';

const NgDefProps_DoNotCopy = [
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

export function extendLifecycle(target: NgHooksStatic<any>, options?: Options) {
  if (!options || typeof options !== 'object' || !Array.isArray(options.lifecycle)) return;

  const lifecycleMap = options.lifecycle.reduce((map, lifecycle) => {
    const name = lifecycle.lifecycle || lifecycle.name;
    map[lifecycle.lifecycle || lifecycle.name] = function(...args) {
      const context = this.__context as DirectiveContext;
      context.lifecycleEvents.next({ event: name as any, args });
    };
    return map;
  }, {});
  Object.assign(target.prototype, lifecycleMap);
}

export function copyNgDef(target, source, NG_DEF) {
  // for Ivy render
  const targetComponentDef = source[NG_DEF];
  if (targetComponentDef) {
    const destComponentDef = target[NG_DEF];
    Object.keys(targetComponentDef).forEach((key) => {
      if (NgDefProps_DoNotCopy.includes(key)) return;
      destComponentDef[key] = targetComponentDef[key];
    });
  } else {
    const error = new Error('ngx-hooks: Angular Ivy is not enabled.');
    if (source[ANNOTATIONS]) {
      console.error(error);
    } else {
      throw error;
    }

    Object.defineProperty(target, ANNOTATIONS, { value: source[ANNOTATIONS] || [] });
    Object.defineProperty(target, PARAMETERS, { value: source[PARAMETERS] || [] });
    Object.defineProperty(target, PROP_METADATA, { value: source[PROP_METADATA] || {} });
  }

  Object.defineProperty(target, 'name', { value: source.name, configurable: true });
}

export function directiveSetup(this: NgHooksClass) {
  const result = (this.constructor as NgHooksStatic<any>).ngHooks.call(undefined, this);

  copyResultToContext.call(this, result);

  registerLifecycleCleanup();
}

function copyResultToContext(this: NgHooksClass, result: Object) {
  if (result == null) return;

  Object.getOwnPropertyNames(result).forEach((objKey) => {
    if (ProtectedProp === objKey) return;

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
