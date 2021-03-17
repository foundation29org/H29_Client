import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { RoleGuard } from 'app/shared/auth/role-guard.service';

import { DashboardAdminComponent } from './dashboard-admin/dashboard-admin.component';
import { TranslationsComponent } from './translations/translations.component';
import { UsersAdminComponent } from "./users-admin/users-admin.component";
import { StatisticsComponent } from "./statistics/statistics.component";
import { SupportComponent } from './support/support.component';
import { NotificationsComponent } from "./notifications/notifications.component";

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'dashboard-admin',
        component: DashboardAdminComponent,
        data: {
          title: 'menu.Dashboard Admin',
          expectedRole: ['Admin']
        },
        canActivate: [AuthGuard, RoleGuard]
      },
      {
        path: 'managefaqs',
        loadChildren: './manage-faqs-menu/manage-faqs-menu.module#ManageFaqsModule',
      },
      /*{
        path: 'managefaqs',
        component: ManageFaqsComponent,
        loadChildren: '#ManageFaqsModule',
        data: {
          title: 'menu.Manage FAQ',
          expectedRole: ['Admin']
        },
        canActivate: [AuthGuard, RoleGuard]
      },*/
      {
        path: 'translations',
        component: TranslationsComponent,
        data: {
          title: 'menu.Translations',
          expectedRole: ['Admin']
        },
        canActivate: [AuthGuard, RoleGuard]
      },
      {
        path: 'users-admin',
        component: UsersAdminComponent,
        data: {
          title: 'Users',
          expectedRole: ['Admin']
        },
        canActivate: [AuthGuard, RoleGuard]
      },
      {
        path: 'statistics',
        component: StatisticsComponent,
        data: {
          title: 'menu.Stats',
          expectedRole: ['Admin']
        },
        canActivate: [AuthGuard, RoleGuard]
      },
      {
        path: 'notifications',
        component: NotificationsComponent,
        data: {
          title: 'menu.Notifications',
          expectedRole: ['Admin']
        },
        canActivate: [AuthGuard, RoleGuard]
      },
      {
        path: 'support',
        component: SupportComponent,
        data: {
          title: 'Support'
        }
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule { }
