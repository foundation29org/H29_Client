import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { UserRoutingModule } from "./user-routing.module";

import { CustomFormsModule } from 'ng2-validation';
import { TranslateModule } from '@ngx-translate/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import {MatSelectModule, MatInputModule, MatDatepickerModule, MatNativeDateModule} from '@angular/material';
import { TagInputModule } from 'ngx-chips';
import { UiSwitchModule } from 'ngx-ui-switch';
import { NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';

import { GenotypeComponent } from './genotype/genotype.component';
import { FaqComponent } from './faq/faq.component';

@NgModule({
    exports: [
        TranslateModule
    ],
    imports: [
        CommonModule,
        UserRoutingModule,
        FormsModule,
        CustomFormsModule,
        NgbModule,
        TranslateModule,
        MatSelectModule,
        MatInputModule,
        MatDatepickerModule,
        MatNativeDateModule,
        TagInputModule,
        ReactiveFormsModule,
        UiSwitchModule,
        NgbTypeaheadModule
    ],
    declarations: [
        GenotypeComponent,
        FaqComponent
    ]
})
export class UserModule { }
