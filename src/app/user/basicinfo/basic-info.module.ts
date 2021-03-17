import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { BasicInfoRoutingModule } from "./basic-info-routing.module";
import { TranslateModule } from '@ngx-translate/core';

import { PersonalInfoComponent } from "./personal-info/personal-info.component";
import { SocialInfoComponent } from './social-info/social-info.component';

import { ClinicalInfoComponent } from './clinical-info/clinical-info.component';
import { CustomFormsModule } from 'ng2-validation';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import {MatSelectModule, MatInputModule, MatDatepickerModule, MatNativeDateModule} from '@angular/material';

@NgModule({
    exports: [
        TranslateModule
    ],
    imports: [
        CommonModule,
        BasicInfoRoutingModule,
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
        PersonalInfoComponent,
        SocialInfoComponent,
        ClinicalInfoComponent
    ]
})
export class BasicInfoModule { }
