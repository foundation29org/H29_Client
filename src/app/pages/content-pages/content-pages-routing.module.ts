import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ErrorPageComponent } from "./error/error-page.component";
import { LoadingPageComponent } from "./loading/loading-page.component";
import { LoginPageComponent } from "./login/login-page.component";
import { RegisterPageComponent } from "./register/register-page.component";
import { PrivacyPolicyPageComponent } from "./privacy-policy/privacy-policy.component";
import { DataPrivacySecurityPageComponent } from "./data-privacy-security/data-privacy-security.component";
import { DeleteAccountPageComponent } from "./deleteaccount/deleteaccount-page.component";

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'error',
        component: ErrorPageComponent,
        data: {
          title: 'Error Page'
        }
      },
      {
        path: 'loading',
        component: LoadingPageComponent,
        data: {
          title: 'Loading Page'
        }
      },
      {
        path: 'login',
        component: LoginPageComponent,
        data: {
          title: 'menu.Login'
        }
      },
      {
        path: 'register',
        component: RegisterPageComponent,
        data: {
          title: 'menu.Register'
        }
      },
      {
        path: 'privacy-policy',
        component: PrivacyPolicyPageComponent,
        data: {
          title: 'registration.Privacy Policy'
        }
      },
      {
        path: 'data-privacy-security',
        component: DataPrivacySecurityPageComponent,
        data: {
          title: 'Data Privacy and Security'
        }
      },
      {
        path: 'delete-account',
        component: DeleteAccountPageComponent,
        data: {
          title: 'Delete account info'
        }
      }

    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ContentPagesRoutingModule { }
