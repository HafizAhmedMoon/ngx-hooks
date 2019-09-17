import { Directive, ElementRef, Input } from '@angular/core';
import { FunctionDirective, inject, NgHooksContext, observe, watch } from 'ngx-hooks';

@Directive({
  selector: '[todoComplete]',
})
@FunctionDirective()
export class TodoCompleteDirective {
  @Input('todoComplete')
  complete: boolean;

  static ngHooks(context: NgHooksContext<TodoCompleteDirective>) {
    const elementRef: ElementRef<HTMLDivElement> = inject(ElementRef);

    const complete = observe(context, (prop) => prop.complete);
    watch(complete, (complete) => {
      elementRef.nativeElement.style.textDecoration = complete ? 'line-through' : '';
    });
  }
}
