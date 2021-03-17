import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { RoleGuard } from 'app/shared/auth/role-guard.service';
import { GenotypeComponent } from './genotype/genotype.component';
import { FaqComponent } from './faq/faq.component';

const routes: Routes = [
  {
    path: 'dashboard',
    loadChildren: './dashboard/dashboard.module#DashboardModule'
  },
  {
    path: 'basicinfo',
    loadChildren: './basicinfo/basic-info.module#BasicInfoModule'
  },
  {
    path: 'calendar',
    loadChildren: './calendar/calendar.module#CalendarsModule'
  },
  {
    path: 'clinicinfo',
    loadChildren: './clinicinfo/clinical-info.module#ClinicalInfoModule'
  },
  {
    path: 'genotype',
    component: GenotypeComponent,
    data: {
      title: 'menu.Genotype',
      expectedRole: ['User']
    },
    canActivate: [AuthGuard, RoleGuard]
  },
  {
    path: 'faq',
    component: FaqComponent,
    data: {
      title: 'FAQ'
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UserRoutingModule { }
