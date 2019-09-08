import {
  AfterContentChecked,
  AfterContentInit,
  DoCheck,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { Subject } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { Context, getContext } from './context';

export interface ComponentLifecycleContext extends Context {
  lifecycleEvents?: Subject<{ event: LifecycleKeys; arg?: any }>;
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
  const context = getContext<ComponentLifecycleContext>();
  if (!context.lifecycleEvents) {
    context.lifecycleEvents = new Subject();

    onDestroy(() => {
      context.lifecycleEvents.complete();
    });
  }
  context.lifecycleEvents.pipe(filter(({ event }) => event === lifecycleTypes)).subscribe(({ arg }) => fn(arg), null);
}

export const onChanges = (fn: (changes: SimpleChanges) => void) => lifecycle('ngOnChanges', fn);
export const onInit = (fn: () => void) => lifecycle('ngOnInit', fn);
export const onDoCheck = (fn: () => void) => lifecycle('ngDoCheck', fn);
export const onAfterContentInit = (fn: () => void) => lifecycle('ngAfterContentInit', fn);
export const onAfterContentChecked = (fn: () => void) => lifecycle('ngAfterContentChecked', fn);
export const onAfterViewInit = (fn: () => void) => lifecycle('ngAfterContentInit', fn);
export const onAfterViewChecked = (fn: () => void) => lifecycle('ngAfterContentChecked', fn);
export const onDestroy = (fn: () => void) => lifecycle('ngOnDestroy', fn);
