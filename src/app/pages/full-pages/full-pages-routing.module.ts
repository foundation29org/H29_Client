import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { NotificationsMenuComponent } from "./notifications-menu/notifications-menu.component";
import { UserProfilePageComponent } from "./user-profile/user-profile-page.component";
import { SupportComponent } from './support/support.component';

import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { RoleGuard } from 'app/shared/auth/role-guard.service';

const routes: Routes = [
  {
    path: '',
    children: [

      {
        path: 'profile',
        component: UserProfilePageComponent,
        data: {
          title: 'menu.User Profile',
          expectedRole: ['User', 'SuperAdmin', 'Admin']
        },
        canActivate: [AuthGuard, RoleGuard]
      }
    ]
  },
  {
    path: 'notifications-menu',
    component: NotificationsMenuComponent,
    data: {
      title: 'menu.Notifications'
    }
  },
  {
    path: 'support',
    component: SupportComponent,
    data: {
      title: 'Support'
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FullPagesRoutingModule { }
