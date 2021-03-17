import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { RoleGuard } from 'app/shared/auth/role-guard.service';

import { ManageFaqsComponent } from './manage-faqs/manage-faqs.component';
import { QuestionAskedNotAnsweredComponent } from './Question_Asked_Not_Answered/questionAskedNotAnswered.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'managefaqs',
        component: ManageFaqsComponent,
        data: {
          title: 'faqs.Manage FAQ',
          expectedRole: ['Admin']
        },
        canActivate: [AuthGuard, RoleGuard]
      },
      {
        path: 'questionAskedNotAnswered',
        component: QuestionAskedNotAnsweredComponent,
        data: {
          title: 'faqs.Questions Asked not Answered',
          expectedRole: ['Admin']
        },
        canActivate: [AuthGuard, RoleGuard]
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ManageFaqsRoutingModule { }
