import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { RoleGuard } from 'app/shared/auth/role-guard.service';
import { PersonalInfoComponent } from './personal-info/personal-info.component';
import { SocialInfoComponent } from './social-info/social-info.component';
import { ClinicalInfoComponent } from './clinical-info/clinical-info.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'personalinfo',
        component: PersonalInfoComponent,
        data: {
          title: 'menu.Personal Info',
          expectedRole: ['User']
        },
        canActivate: [AuthGuard, RoleGuard]
      },
      {
        path: 'socialinfo',
        component: SocialInfoComponent,
        data: {
          title: 'menu.Social Info',
          expectedRole: ['User']
        },
        canActivate: [AuthGuard, RoleGuard]
      },
      {
        path: 'clinicalinfo',
        component: ClinicalInfoComponent,
        data: {
          title: 'Información clínica',
          expectedRole: ['User']
        },
        canActivate: [AuthGuard, RoleGuard]
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BasicInfoRoutingModule { }
