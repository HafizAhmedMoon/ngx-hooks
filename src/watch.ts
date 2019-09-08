import { Context, getContext } from './context';
import { createInternalRefsStream } from './helpers';
import { onAfterContentChecked, onAfterViewChecked, onDestroy } from './lifecycle';
import { computed, InternalRef, Ref, scheduleRefsUpdates } from './state';

export interface ComponentWatchContext extends Context {
  watchAsyncQueue?: {
    content: (() => void)[];
    view: (() => void)[];
  };
}

type WatcherValue<T = any> = Ref<T> | ((...args: any[]) => T);

type WatcherCleanup = (callback: () => void) => void;
type WatcherCallback<T = any> = (newValue: T, oldValue: T, onCleanup: WatcherCleanup) => void;

type FlushMode = 'content' | 'view' | 'sync';

interface WatcherOption {
  lazy: boolean;
  mode: FlushMode;
}

type WatcherStop = () => void;
type Cleanup = () => void;

export function watch<T>(
  source: WatcherValue<T>,
  callback: WatcherCallback<T>,
  options?: Partial<WatcherOption>
): WatcherStop;

export function watch<V>(
  values: [WatcherValue<V>],
  callback: WatcherCallback<[V]>,
  options?: Partial<WatcherOption>
): WatcherStop;
export function watch<V, V2>(
  values: [WatcherValue<V>, WatcherValue<V2>],
  callback: WatcherCallback<[V, V2]>,
  options?: Partial<WatcherOption>
): WatcherStop;
export function watch<V, V2, V3>(
  values: [WatcherValue<V>, WatcherValue<V2>, WatcherValue<V3>],
  callback: WatcherCallback<[V, V2, V3]>,
  options?: Partial<WatcherOption>
): WatcherStop;
export function watch<V, V2, V3, V4>(
  values: [WatcherValue<V>, WatcherValue<V2>, WatcherValue<V3>, WatcherValue<V4>],
  callback: WatcherCallback<[V, V2, V3, V4]>,
  options?: Partial<WatcherOption>
): WatcherStop;
export function watch<V, V2, V3, V4, V5>(
  values: [WatcherValue<V>, WatcherValue<V2>, WatcherValue<V3>, WatcherValue<V4>, WatcherValue<V5>],
  callback: WatcherCallback<[V, V2, V3, V4, V5]>,
  options?: Partial<WatcherOption>
): WatcherStop;
export function watch<V, V2, V3, V4, V5, V6>(
  values: [WatcherValue<V>, WatcherValue<V2>, WatcherValue<V3>, WatcherValue<V4>, WatcherValue<V5>, WatcherValue<V6>],
  callback: WatcherCallback<[V, V2, V3, V4, V5, V6]>,
  options?: Partial<WatcherOption>
): WatcherStop;

export function watch<T>(
  source: WatcherValue<T> | WatcherValue<T>[],
  cb?: WatcherCallback<T>,
  options?: Partial<WatcherOption>
): WatcherStop {
  const { lazy, mode }: WatcherOption = {
    ...{
      lazy: false,
      mode: 'content',
    },
    ...options,
  };

  const context = getContext<ComponentWatchContext>();

  if (!context.watchAsyncQueue) {
    context.watchAsyncQueue = {
      content: [],
      view: [],
    };

    onAfterContentChecked(() => {
      flushQue(context.watchAsyncQueue.content);
    });

    onAfterViewChecked(() => {
      flushQue(context.watchAsyncQueue.view);
    });
  }

  let cleanup: Cleanup;
  const registerCleanup = (fn: Cleanup) => {
    cleanup = () => {
      cleanup = null;
      try {
        fn();
      } catch (error) {
        console.error('onCleanup()', error);
      }
    };
  };

  const isArray = Array.isArray(source);
  let sources = (isArray ? source : [source]) as WatcherValue[];
  const internalRefs = sources.map((source) => {
    if (typeof source === 'function') {
      return computed(source) as InternalRef;
    }
    return source as InternalRef;
  });
  let scheduled: (() => void) | null = null;

  const applyCb = (n, o) => {
    // cleanup before rerun
    cleanup && cleanup();

    if (isArray) {
      cb(n, o, registerCleanup);
    } else {
      cb(n[0], o[0], registerCleanup);
    }
  };

  const _callback =
    mode === 'sync'
      ? applyCb
      : (n, o) => {
          const scheduledAlready = !!scheduled;
          scheduled = () => {
            scheduled = null;
            applyCb(n, o);
          };
          if (scheduledAlready) return;
          queJob(context, () => scheduled(), mode);
        };

  // for immediate first run only
  let shiftCallback = (n, o) => {
    shiftCallback = _callback;
    applyCb(n, o);
  };

  return scheduleWatch(internalRefs, lazy ? _callback : (n, o) => shiftCallback(n, o), {
    lazy,
    cleanup: () => cleanup && cleanup(),
  });
}

function scheduleWatch(
  internalRefs: InternalRef[],
  cb: (...args: any[]) => any,
  { lazy, cleanup }: { cleanup: () => void; lazy: boolean }
): WatcherStop {
  let oldValues = new Array(internalRefs.length);
  const getNewValues = () => internalRefs.map((internalRef) => internalRef.__value);
  let newValues = getNewValues();

  const callback = (n, o) => {
    oldValues = newValues;
    cb(n, o);
  };

  const subscription = createInternalRefsStream(internalRefs).subscribe(() => {
    newValues = getNewValues();
    const hasUpdate = newValues.some((newVal, index) => {
      const oldVal = oldValues[index];
      return newVal !== oldVal;
    });

    if (hasUpdate) {
      callback(newValues, oldValues);
    }
  });

  if (!lazy) {
    callback(newValues, oldValues);
  }

  const watchStop = () => {
    subscription.unsubscribe();
    cleanup();
  };

  onDestroy(watchStop);

  return watchStop;
}

function queJob(context, cb: () => void, mode: FlushMode) {
  context.watchAsyncQueue[mode].push(cb);
}

function flushQue(que: (() => void)[]) {
  while (que.length) {
    const cb = que.shift();
    scheduleRefsUpdates(cb);
  }
}
