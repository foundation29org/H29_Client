import { Component, ViewChild, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from "@angular/router";
import { environment } from 'environments/environment';
import { HttpClient } from "@angular/common/http";
import { AuthService } from 'app/shared/auth/auth.service';
import { TranslateService } from '@ngx-translate/core';
import { PatientService } from 'app/shared/services/patient.service';
import swal from 'sweetalert2';
import { Subscription } from 'rxjs/Subscription';
declare let cordova: any;

declare global {
  interface Window {
    app: {
      requestIdleCallback: () => any; // Or whatever is the type of the exitApp function
    }
  }
}

@Component({
    selector: 'app-login-page',
    templateUrl: './login-page.component.html',
    styleUrls: ['./login-page.component.scss'],
    providers: [PatientService]
})

export class LoginPageComponent implements OnDestroy, OnInit {

    @ViewChild('f') loginForm: NgForm;
    sending: boolean = false;

    isBlockedAccount: boolean = false;
    isLoginFailed: boolean = false;
    errorAccountActivated: boolean = false;
    isAccountActivated: boolean = false;
    isActivationPending: boolean = false;
    isBlocked: boolean = false;
    email: string;
    private subscription: Subscription = new Subscription();

    showInstructions: boolean = false;
    loginCode: number;
    
    isApp: boolean = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1 && location.hostname != "localhost" && location.hostname != "127.0.0.1";

    constructor(private router: Router, private http: HttpClient, private authService: AuthService, public translate: TranslateService, private patientService: PatientService) {

      if(this.authService.getEnvironment()){
        this.authService.logout()
      }
     }

     ngOnInit() {
      }

     ngOnDestroy() {
       //this.subscription.unsubscribe();
     }

     submitInvalidForm() {
       if (!this.loginForm) { return; }
       const base = this.loginForm;
       for (const field in base.form.controls) {
         if (!base.form.controls[field].valid) {
             base.form.controls[field].markAsTouched()
         }
       }
     }

     onSubmit(){
      if(this.showInstructions){
        this.onLogin();
      }else{
        //this.showInstructions = true;
        this.sendCode();
      }
     }

      sendCode(){
        this.sending = true;
        this.isBlockedAccount = false;
        this.isLoginFailed = false;
        this.isActivationPending = false;
        this.isBlocked = false;
        let form = {email: this.loginForm.value.email}
        this.subscription.add( this.authService.sendCode(form).subscribe(
          (authenticated:any) => {
            console.log(authenticated);
            if(authenticated.logged) {
              this.sending = false;
              this.showInstructions = true;
              this.isLoginFailed = false;
            }else{
              this.sending = false;
              this.loginForm.reset();
              let message =  this.authService.getMessage();
              if(message == "Login failed" || message == "Not found"){
                  this.isLoginFailed = true;
              }else if(message == "Account is temporarily locked"){
                this.isBlockedAccount = true;
              }else if(message == "Account is unactivated"){
                this.isActivationPending = true;
              }else if(message == "Account is blocked"){
                this.isBlocked = true;
              }
            }
            
          }));
      }

    onLogin() {
      this.sending = true;
      this.isBlockedAccount = false;
      this.isLoginFailed = false;
      this.isActivationPending = false;
      this.isBlocked = false;
      let form = {email: this.loginForm.value.email, confirmationCode: this.loginForm.value.loginCode};
  	   this.subscription.add( this.authService.signinUser(form).subscribe(
          (authenticated:any) => {
            console.log(authenticated);
    		    if(authenticated.logged) {
              this.loginForm.reset();
               //this.translate.setDefaultLang( this.authService.getLang() );
               this.translate.use(this.authService.getLang());
               let url =  this.authService.getRedirectUrl();
              console.log(url)
              if(this.authService.getRole()=='User'){
                this.subscription.add( this.patientService.getPatientId()
                  .subscribe( (res : any) => {
                      if(res==null){
                        swal(this.translate.instant("personalinfo.Welcome"), this.translate.instant("personalinfo.Fill personal info"), "info");
                        this.router.navigate(['/user/basicinfo/personalinfo']);
                      }
                      else{
                        this.router.navigate([ url ]);
                        var patientId=res.sub;
                        this.subscription.add( this.http.get(environment.api+'/api/alerts/patient/checkDateForUserAlerts/'+patientId)
                        .subscribe( (res2 : any) => {
                          this.router.navigate([ url ]);
                        }, (err) => {
                          console.log(err);
                          this.router.navigate([ url ]);
                        }));
                      }
                    this.sending = false;
                  }, (err) => {
                    console.log(err);
                    this.sending = false;
                  }));
                
              }
              else{
                  this.sending = false;
                 this.router.navigate([ url ]);
              }

            }
            else {
              this.sending = false;
              this.loginForm.reset();
              let message =  this.authService.getMessage();
              if(message == "Login failed" || message == "Not found"){
                  this.isLoginFailed = true;
              }else if(message == "Account is temporarily locked"){
                this.isBlockedAccount = true;
              }else if(message == "Account is unactivated"){
                this.isActivationPending = true;
              }else if(message == "Account is blocked"){
                this.isBlocked = true;
              }
    		    }
          }
  	   ));
    }

    launchDemo(){
      this.loginForm.value.email = 'demo@duchenne.org';
      this.loginForm.value.password = 'dddddddd';
      //this.onSubmit();
    }

    // On registration link click
    onRegister() {
        this.router.navigate(['/register']);
    }

    backToLogin(){
      this.showInstructions = false;
      this.sending = false;
      this.loginForm.reset();
    }
}
