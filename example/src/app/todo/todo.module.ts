import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { TodoCompleteDirective } from './todo-complete.directive';
import { TodoComponent } from './todo.component';

@NgModule({
  declarations: [TodoComponent, TodoCompleteDirective],
  exports: [TodoComponent],
  imports: [BrowserModule, FormsModule],
  providers: [],
})
export class TodoModule {}
