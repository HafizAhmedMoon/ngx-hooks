import {
  AfterContentChecked,
  AfterContentInit,
  Component,
  DoCheck,
  Injector,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Context, getContext, withContext } from './context';
import { isRef, Ref } from './state';

export interface ComponentContext extends Context {
  lifecycleEvents: Subject<{ event: LifecycleKeys; arg?: any }>;
}

function createContext(injector: Injector): ComponentContext {
  return {
    injector,
    lifecycleEvents: new Subject(),
  };
}

export interface Lifecycle
  extends OnChanges,
    OnInit,
    DoCheck,
    AfterContentInit,
    AfterContentChecked,
    AfterContentInit,
    AfterContentChecked,
    OnDestroy {}

type LifecycleKeys = keyof Lifecycle;

function lifecycle(lifecycleTypes: LifecycleKeys, fn: (...args: any[]) => void) {
  getContext<ComponentContext>()
    .lifecycleEvents.pipe(filter(({ event }) => event === lifecycleTypes))
    .subscribe(({ arg }) => fn(arg), null);
}

export const onChanges = (fn: (changes: SimpleChanges) => void) => lifecycle('ngOnChanges', fn);
export const onInit = (fn: () => void) => lifecycle('ngOnInit', fn);
export const onDoCheck = (fn: () => void) => lifecycle('ngDoCheck', fn);
export const onAfterContentInit = (fn: () => void) => lifecycle('ngAfterContentInit', fn);
export const onAfterContentChecked = (fn: () => void) => lifecycle('ngAfterContentChecked', fn);
export const onAfterViewInit = (fn: () => void) => lifecycle('ngAfterContentInit', fn);
export const onAfterViewChecked = (fn: () => void) => lifecycle('ngAfterContentChecked', fn);
export const onDestroy = (fn: () => void) => lifecycle('ngOnDestroy', fn);

type NgHooksPropsProtected = '__context';

const propsProtected: NgHooksPropsProtected[] & string[] = ['__context'];

export type NgHooksProps<C extends NgHooks<any>, P = Omit<C, NgHooksPropsProtected>> = {
  [K in keyof P]: P[K];
};

interface Type<T> {
  new (...args: any[]): T;
}

export interface NgHooks<T> {
  [key: string]: any;
}

export class FunctionComponent<T> implements NgHooks<T> {
  [key: string]: any;
}

interface NgHooksStatic<T> extends Type<FunctionComponent<T>> {
  ngHooks(props: NgHooksProps<T>): { [key: string]: any };
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
    class HookHelperComponent implements Lifecycle {
      __context: ComponentContext;

      constructor(injector: Injector) {
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

    return HookHelperComponent as any;
  };
}

function setup(this: NgHooks<any>, target: NgHooksStatic<any>) {
  const instance = new target();

  setDefaultProps.call(this, instance);

  const props = proxyProps.call(this);

  const result = target.ngHooks.call(undefined, props);

  copyResultToContext.call(this, result);

  registerCleanup();
}

function registerCleanup() {
  const context = getContext<ComponentContext>();

  onDestroy(() => {
    context.lifecycleEvents.complete();
  });
}

function setDefaultProps(this: NgHooks<any>, instance: NgHooks<any>) {
  Object.keys(instance).forEach((propKey) => {
    // TODO: maybe it should only assign input/outputs/view decorated props not all class props
    if (!propsProtected.includes(propKey)) {
      this[propKey] = instance[propKey];
    }
  });
}

function proxyProps(this: NgHooks<any>) {
  const _this = this;
  const props: { [key: string]: any } = new Proxy(Object.create(null), {
    get(target, propKey: string) {
      if (!propsProtected.includes(propKey)) {
        return _this[propKey];
      }
    },
  });

  return props;
}

function copyResultToContext(this: NgHooks<any>, result: Object) {
  Object.keys(result).forEach((objKey) => {
    const resultElement = result[objKey];
    if (isRef(resultElement)) {
      bindRefToContext(this, objKey, resultElement);
    } else {
      this[objKey] = resultElement;
    }
  });
}

function bindRefToContext(obj: Object, key: string, ref: Ref<any>) {
  Object.defineProperty(obj, key, {
    get() {
      return ref.value;
    },
    set(val) {
      ref.value = val;
    },
  });
}
