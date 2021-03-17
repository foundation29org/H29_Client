import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { RoleGuard } from 'app/shared/auth/role-guard.service';
import { CalendarsComponent } from './calendar.component';

const routes: Routes = [
  {
    path: '',
     component: CalendarsComponent,
    data: {
      title: 'Calendar',
      expectedRole: ['User']
    },
    canActivate: [AuthGuard, RoleGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CalendarRoutingModule { }

export const routedComponents = [CalendarsComponent];
