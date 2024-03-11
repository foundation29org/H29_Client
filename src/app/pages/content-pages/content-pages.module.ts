import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormsModule } from '@angular/forms';
import { CustomFormsModule } from 'ng2-validation';
import { ContentPagesRoutingModule } from "./content-pages-routing.module";
import { TranslateModule } from '@ngx-translate/core';

import { ErrorPageComponent } from "./error/error-page.component";
import { LoadingPageComponent } from "./loading/loading-page.component";
import { LoginPageComponent } from "./login/login-page.component";
import { RegisterPageComponent } from "./register/register-page.component";
import { TermsConditionsPageComponent } from "./terms-conditions/terms-conditions-page.component";
import { PrivacyPolicyPageComponent } from "./privacy-policy/privacy-policy.component";
import { DataPrivacySecurityPageComponent } from "./data-privacy-security/data-privacy-security.component";
import { DeleteAccountPageComponent } from "./deleteaccount/deleteaccount-page.component";
import {PasswordValidator} from "app/shared/directives/password-validator.directive"; //imported to modules
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import {MatCheckboxModule} from '@angular/material';
import { SafePipe } from 'app/shared/services/safe.pipe';

@NgModule({
    exports: [
        TranslateModule
    ],
    imports: [
        CommonModule,
        ContentPagesRoutingModule,
        FormsModule,
        TranslateModule,
        CustomFormsModule,
        NgbModule,
        MatCheckboxModule
    ],
    declarations: [
        ErrorPageComponent,
        LoadingPageComponent,
        LoginPageComponent,
        RegisterPageComponent,
        TermsConditionsPageComponent,
        PrivacyPolicyPageComponent,
        DataPrivacySecurityPageComponent,
        DeleteAccountPageComponent,
        SafePipe,
        PasswordValidator
    ],
    entryComponents:[TermsConditionsPageComponent]
})
export class ContentPagesModule { }
