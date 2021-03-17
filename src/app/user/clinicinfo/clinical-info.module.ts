import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ClinicalInfoRoutingModule } from "./clinical-info-routing.module";
import { TranslateModule } from '@ngx-translate/core';

import { AnthropometryComponent } from './anthropometry/anthropometry.component';
import { CourseOfThediseaseComponent } from './course-of-the-disease/course-of-the-disease.component';
import { MedicalCareComponent } from './medical-care/medical-care.component';
import { MedicationComponent } from './medication/medication.component';
import { VaccinationComponent } from './vaccination/vaccination.component';
import { OtherDrugsComponent } from './other-drugs/other-drugs.component';
import { ClinicalTrialsComponent } from './clinical-trials/clinical-trials.component';

import { CustomFormsModule } from 'ng2-validation';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap/dropdown/dropdown.module';
import {MatSelectModule, MatInputModule, MatDatepickerModule, MatNativeDateModule, MatFormFieldModule} from '@angular/material';

import { NgxChartsModule } from '@swimlane/ngx-charts';
import { UiSwitchModule } from 'ngx-ui-switch';
@NgModule({
    exports: [
        TranslateModule
    ],
    imports: [
        CommonModule,
        ClinicalInfoRoutingModule,
        FormsModule,
        TranslateModule,
        CustomFormsModule,
        NgbModule,
        MatSelectModule,
        MatInputModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatFormFieldModule,
        ReactiveFormsModule,
        NgbDropdownModule.forRoot(),
        NgxChartsModule,
        UiSwitchModule
    ],
    declarations: [
        AnthropometryComponent,
        CourseOfThediseaseComponent,
        MedicalCareComponent,
        MedicationComponent,
        VaccinationComponent,
        OtherDrugsComponent,
        ClinicalTrialsComponent
    ]
})
export class ClinicalInfoModule { }
