import { Directive, Injector } from '@angular/core';
import { copyNgDef, createDirectiveContext, DirectiveContext, NgHooksStatic, directiveSetup } from './common';
import { withContext } from './context';
import { DirectiveLifecycle } from './lifecycle';

const NG_DIRECTIVE_DEF = 'ngDirectiveDef';

export function FunctionDirective<T>() {
  return (source: NgHooksStatic<T>) => {
    @Directive({ selector: 'functionDirectiveHelper' })
    class FunctionDirectiveHelper extends source implements DirectiveLifecycle {
      __context: DirectiveContext;

      constructor(injector: Injector) {
        super();
        const context = (this.__context = createDirectiveContext(injector));

        withContext(context, () => directiveSetup.call(this, source));
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
        this.__context.lifecycleEvents.next({ event: 'ngAfterViewInit' });
      }
      ngAfterViewChecked() {
        this.__context.lifecycleEvents.next({ event: 'ngAfterViewChecked' });
      }
      ngOnDestroy() {
        this.__context.lifecycleEvents.next({ event: 'ngOnDestroy' });
      }
    }

    copyNgDef(FunctionDirectiveHelper, source, NG_DIRECTIVE_DEF);

    return FunctionDirectiveHelper as any;
  };
}
