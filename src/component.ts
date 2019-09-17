import { Component, Injector } from '@angular/core';
import {
  copyNgDef,
  createDirectiveContext,
  DirectiveContext,
  directiveSetup,
  extendLifecycle,
  NgHooksStatic,
  Options,
} from './common';
import { withContext } from './context';
import { DirectiveLifecycle } from './lifecycle';

const NG_COMPONENT_DEF = 'ngComponentDef';

export function FunctionComponent<T>(options?: Options) {
  return (source: NgHooksStatic<T>) => {
    @Component({ template: '' })
    class FunctionComponentHelper extends source implements DirectiveLifecycle {
      __context: DirectiveContext;

      constructor(injector: Injector) {
        super();
        const context = (this.__context = createDirectiveContext(injector));

        withContext(context, () => directiveSetup.call(this, source));
      }

      ngOnChanges(...args) {
        this.__context.lifecycleEvents.next({ event: 'ngOnChanges', args });
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
        this.__context.lifecycleEvents.next({ event: 'ngAfterViewInit' });
      }
      ngAfterViewChecked() {
        this.__context.lifecycleEvents.next({ event: 'ngAfterViewChecked' });
      }
      ngOnDestroy() {
        this.__context.lifecycleEvents.next({ event: 'ngOnDestroy' });
      }
    }

    extendLifecycle(FunctionComponentHelper, options);

    copyNgDef(FunctionComponentHelper, source, NG_COMPONENT_DEF);

    return FunctionComponentHelper as any;
  };
}
