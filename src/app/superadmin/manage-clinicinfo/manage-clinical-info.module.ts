import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ManageClinicalInfoRoutingModule } from "./manage-clinical-info-routing.module";
import { TranslateModule } from '@ngx-translate/core';

import { MedicationComponent } from './medication/medication.component';

import { CustomFormsModule } from 'ng2-validation';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import {MatSelectModule, MatInputModule, MatDatepickerModule, MatNativeDateModule} from '@angular/material';

@NgModule({
    exports: [
        TranslateModule
    ],
    imports: [
        CommonModule,
        ManageClinicalInfoRoutingModule,
        FormsModule,
        TranslateModule,
        CustomFormsModule,
        NgbModule,
        MatSelectModule,
        MatInputModule,
        MatDatepickerModule,
        MatNativeDateModule,
        ReactiveFormsModule
    ],
    declarations: [
        MedicationComponent
    ]
})
export class ManageClinicalInfoModule { }
