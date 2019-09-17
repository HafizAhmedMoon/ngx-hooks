import {
  AfterContentChecked,
  AfterContentInit,
  AfterViewChecked,
  AfterViewInit,
  DoCheck,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Context, getContext } from './context';

export interface BasicLifecycleContext extends Context {
  lifecycleEvents: Subject<{ event: BaseLifecycleKeys }>;
  __basicLifecycle: 1;
}

export interface DirectiveLifecycleContext extends Context {
  lifecycleEvents: Subject<{ event: DirectiveLifecycleKeys; args?: any }>;
}

export interface BaseLifecycle extends OnDestroy {}

export interface DirectiveLifecycle
  extends OnChanges,
    OnInit,
    DoCheck,
    AfterContentInit,
    AfterContentChecked,
    AfterViewInit,
    AfterViewChecked,
    BaseLifecycle {}

type BaseLifecycleKeys = keyof BaseLifecycle;
type DirectiveLifecycleKeys = keyof DirectiveLifecycle;

function lifecycle(lifecycleTypes: DirectiveLifecycleKeys | string, fn: (...args: any[]) => void) {
  const context = getContext<DirectiveLifecycleContext>();

  if (isBasicLifecycleContext(context) && lifecycleTypes !== 'ngOnDestroy') {
    return;
  }

  context.lifecycleEvents
    .pipe(filter(({ event }) => event === lifecycleTypes))
    .subscribe(({ args }) => fn.apply(undefined, args), null);
}

export function isBasicLifecycleContext(context: Context) {
  return Object.prototype.hasOwnProperty.call(context, '__basicLifecycle');
}

export interface ComposedLifecycle<F> extends Function {
  (fn: F): void;
  lifecycle: string;
}

export function composeLifecycle<F extends (...args: any[]) => void = (...args: any[]) => void>(
  name: string
): ComposedLifecycle<F> {
  const fn = (fn: F) => lifecycle(name, fn);
  const nameDescriptor = { value: name, writable: false, configurable: true };
  Object.defineProperties(fn, { name: nameDescriptor, lifecycle: nameDescriptor });
  return fn as any;
}

export const onChanges = composeLifecycle<(changes: SimpleChanges) => void>('ngOnChanges');
export const onInit = composeLifecycle<() => void>('ngOnInit');
export const onDoCheck = composeLifecycle<() => void>('ngDoCheck');
export const onAfterContentInit = composeLifecycle<() => void>('ngAfterContentInit');
export const onAfterContentChecked = composeLifecycle<() => void>('ngAfterContentChecked');
export const onAfterViewInit = composeLifecycle<() => void>('ngAfterViewInit');
export const onAfterViewChecked = composeLifecycle<() => void>('ngAfterViewChecked');
export const onDestroy = composeLifecycle<() => void>('ngOnDestroy');

export function registerLifecycleCleanup() {
  const context = getContext<BasicLifecycleContext>();
  onDestroy(() => {
    context.lifecycleEvents.complete();
  });
}
