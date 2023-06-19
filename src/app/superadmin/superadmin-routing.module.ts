import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { RoleGuard } from 'app/shared/auth/role-guard.service';

import { DashboardSuperAdminComponent } from "./dashboard-superadmin/dashboard-superadmin.component";
import { GroupComponent } from "./groups/groups.component";
import { LangsComponent } from "./langs/langs.component";
import { TranslationsComponent } from "./translations/translations.component";
import { PhenotypesComponent } from "./phenotypes/phenotypes.component";
import { PromsComponent } from "./proms/proms.component";
import { SupportComponent } from './support/support.component';
import { NotificationsSAComponent } from "./notifications-superadmin/notifications-superadmin.component";

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'dashboard-superadmin',
        component: DashboardSuperAdminComponent,
        data: {
          title: 'menu.Dashboard Super Admin',
          expectedRole: ['SuperAdmin']
        },
        canActivate: [AuthGuard, RoleGuard]
      },
      {
        path: 'groups',
        component: GroupComponent,
        data: {
          title: 'menu.Groups',
          expectedRole: ['SuperAdmin']
        },
        canActivate: [AuthGuard, RoleGuard]
      },
      {
        path: 'langs',
        component: LangsComponent,
        data: {
          title: 'menu.Languages',
          expectedRole: ['SuperAdmin']
        },
        canActivate: [AuthGuard, RoleGuard]
      },
      {
        path: 'manageproms',
        component: PromsComponent,
        data: {
          title: 'Proms',
          expectedRole: ['SuperAdmin']
        },
        canActivate: [AuthGuard, RoleGuard]
      },
      {
        path: 'translations',
        component: TranslationsComponent,
        data: {
          title: 'menu.Translations',
          expectedRole: ['SuperAdmin']
        },
        canActivate: [AuthGuard, RoleGuard]
      },
      {
        path: 'phenotypes',
        component: PhenotypesComponent,
        data: {
          title: 'menu.Phenotype',
          expectedRole: ['SuperAdmin']
        },
        canActivate: [AuthGuard, RoleGuard]
      },
      {
        path: 'manageclinicinfo',
        loadChildren: './manage-clinicinfo/manage-clinical-info.module#ManageClinicalInfoModule'
      },
      {
        path: 'notifications-superadmin',
        component: NotificationsSAComponent,
        data: {
          title: 'menu.Notifications',
          expectedRole: ['SuperAdmin']
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
export class SuperAdminRoutingModule { }
