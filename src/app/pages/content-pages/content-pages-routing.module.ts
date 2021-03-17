import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ErrorPageComponent } from "./error/error-page.component";
import { LoadingPageComponent } from "./loading/loading-page.component";
import { ForgotPasswordPageComponent } from "./forgot-password/forgot-password-page.component";
import { NewPasswordPageComponent } from "./new-password/new-password-page.component";
import { LoginPageComponent } from "./login/login-page.component";
import { RegisterPageComponent } from "./register/register-page.component";
import { PrivacyPolicyPageComponent } from "./privacy-policy/privacy-policy.component";
import { DataPrivacySecurityPageComponent } from "./data-privacy-security/data-privacy-security.component";


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
        path: 'forgotpassword',
        component: ForgotPasswordPageComponent,
        data: {
          title: 'menu.Forgot Password'
        }
      },
      {
        path: 'newpassword',
        component: NewPasswordPageComponent,
        data: {
          title: 'menu.New Password'
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
      }

    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ContentPagesRoutingModule { }
