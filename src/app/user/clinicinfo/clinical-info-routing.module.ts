import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { RoleGuard } from 'app/shared/auth/role-guard.service';
import { CanDeactivateGuard } from 'app/shared/auth/can-deactivate-guard.service';
import { AnthropometryComponent } from './anthropometry/anthropometry.component';
import { MedicalCareComponent } from './medical-care/medical-care.component';
import { MedicationComponent } from './medication/medication.component';
import { VaccinationComponent } from './vaccination/vaccination.component';
import { OtherDrugsComponent } from './other-drugs/other-drugs.component';
import { CourseOfThediseaseComponent } from './course-of-the-disease/course-of-the-disease.component';
import { ClinicalTrialsComponent } from './clinical-trials/clinical-trials.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'anthropometry',
        component: AnthropometryComponent,
        data: {
          title: 'clinicalinfo.Anthropometry',
          expectedRole: ['User']
        },
        canActivate: [AuthGuard, RoleGuard]
      },
      {
        path: 'courseofthedisease',
        component: CourseOfThediseaseComponent,
        data: {
          title: 'Course Of The disease.Course Of The disease',
          expectedRole: ['User']
        },
        canActivate: [AuthGuard, RoleGuard],
        canDeactivate: [CanDeactivateGuard]
      },
      {
        path: 'medicalcare',
        component: MedicalCareComponent,
        data: {
          title: 'clinicalinfo.Medical Care',
          expectedRole: ['User']
        },
        canActivate: [AuthGuard, RoleGuard],
        canDeactivate: [CanDeactivateGuard]
      },
      {
        path: 'vaccinations',
        component: VaccinationComponent,
        data: {
          title: 'clinicalinfo.Vaccinations',
          expectedRole: ['User']
        },
        canActivate: [AuthGuard, RoleGuard]
      },
      {
        path: 'otherdrugs',
        component: OtherDrugsComponent,
        data: {
          title: 'clinicalinfo.Other Drugs',
          expectedRole: ['User']
        },
        canActivate: [AuthGuard, RoleGuard]
      },
      {
        path: 'medication',
        component: MedicationComponent,
        data: {
          title: 'clinicalinfo.Medication',
          expectedRole: ['User']
        },
        canActivate: [AuthGuard, RoleGuard]
      },
      {
        path: 'clinicalTrials',
        component: ClinicalTrialsComponent,
        data: {
          title: 'clinicalinfo.Clinical Trials',
          expectedRole: ['User']
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
export class ClinicalInfoRoutingModule { }
