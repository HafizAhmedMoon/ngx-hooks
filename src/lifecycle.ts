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
  lifecycleEvents: Subject<{ event: DirectiveLifecycleKeys; arg?: any }>;
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

function lifecycle(lifecycleTypes: DirectiveLifecycleKeys, fn: (...args: any[]) => void) {
  const context = getContext<DirectiveLifecycleContext>();

  if (isBasicLifecycleContext(context) && lifecycleTypes !== 'ngOnDestroy') {
    return;
  }

  context.lifecycleEvents.pipe(filter(({ event }) => event === lifecycleTypes)).subscribe(({ arg }) => fn(arg), null);
}

export function isBasicLifecycleContext(context: Context) {
  return Object.prototype.hasOwnProperty.call(context, '__basicLifecycle');
}

export const onChanges = (fn: (changes: SimpleChanges) => void) => lifecycle('ngOnChanges', fn);
export const onInit = (fn: () => void) => lifecycle('ngOnInit', fn);
export const onDoCheck = (fn: () => void) => lifecycle('ngDoCheck', fn);
export const onAfterContentInit = (fn: () => void) => lifecycle('ngAfterContentInit', fn);
export const onAfterContentChecked = (fn: () => void) => lifecycle('ngAfterContentChecked', fn);
export const onAfterViewInit = (fn: () => void) => lifecycle('ngAfterViewInit', fn);
export const onAfterViewChecked = (fn: () => void) => lifecycle('ngAfterViewChecked', fn);
export const onDestroy = (fn: () => void) => lifecycle('ngOnDestroy', fn);

export function registerLifecycleCleanup() {
  const context = getContext<BasicLifecycleContext>();
  onDestroy(() => {
    context.lifecycleEvents.complete();
  });
}
