import { Component, ViewChild, OnDestroy, OnInit, ElementRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from "@angular/router";
import { environment } from 'environments/environment';
import { HttpClient, HttpParams } from "@angular/common/http";
import { sha512 } from "js-sha512";
import { AuthService } from 'app/shared/auth/auth.service';
import { TranslateService } from '@ngx-translate/core';
import { SortService} from 'app/shared/services/sort.service';
import { PatientService } from 'app/shared/services/patient.service';
import swal from 'sweetalert2';
import { Subscription } from 'rxjs/Subscription';
import { NgbModalRef, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as Fingerprint2 from 'fingerprintjs2';
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
    @ViewChild('fPhone') phoneForm: NgForm;
    sending: boolean = false;

    isBlockedAccount: boolean = false;
    isLoginFailed: boolean = false;
    authyFail: boolean = false;
    authyWaiting: boolean = false;
    authyTimeout:boolean = false;
    updateAuthyTimer:boolean=false;
    errorAccountActivated: boolean = false;
    isAccountActivated: boolean = false;
    isActivationPending: boolean = false;
    isBlocked: boolean = false;
    email: string;
    requiredUpdatePhone:Boolean=false;
    phoneCodes:any=[];
    emailForUpdatePhone:String;
    modalReference: NgbModalRef;
    private subscription: Subscription = new Subscription();
    deviceId=null;
    deviceInformation=null;
    deviceType="";

    seleccionado: string = null;
    showInstructions: boolean = false;
    textIntroInstructions: string = "";
    textInstruction6: string = "";
    isApp: boolean = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1 && location.hostname != "localhost" && location.hostname != "127.0.0.1";

    constructor(private router: Router, private route: ActivatedRoute, private http: HttpClient, private authService: AuthService, public translate: TranslateService, private patientService: PatientService,private modalService: NgbModal, private sortService: SortService) {
      if(localStorage.getItem('deviceid')){
        this.deviceId=localStorage.getItem('deviceid')
      }else{
        this.deviceId = sha512(Math.random().toString(36).substr(2, 9));
        localStorage.setItem('deviceid', this.deviceId)
      }

      setTimeout(() =>{
        Fingerprint2.get((components:any) => {
          var timezone="";
          var platform="";
          var userAgent="";
          for(var i=0;i<components.length;i++){
            if(components[i].key=="timezone"){
              timezone=components[i].value;
            }
            else if(components[i].key=="platform"){
              platform=components[i].value;
            }
            else if(components[i].key=="userAgent"){
              userAgent=components[i].value;
            }
          }
          this.deviceInformation={timezone:timezone,platform:platform,userAgent:userAgent}
          var param = router.parseUrl(router.url).queryParams;
          if(param.email && param.key){
            //activar la cuenta
            this.subscription.add( this.http.post(environment.api+'/api/activateuser',param)
              .subscribe( (res : any) => {
                if(res.message=='activated'){
                  this.isAccountActivated = true;
                  this.email = param.email;
                  this.loginForm.controls['email'].setValue(param.email);
                }else if(res.message=='error'){
                  this.errorAccountActivated = true;
                }
              }, (err) => {
                console.log(err);
                this.errorAccountActivated = true;
              }
            ));

            this.authService.logout()
          }else{
            if(this.authService.getEnvironment()){
              this.translate.use(this.authService.getLang());
              let url =  this.authService.getRedirectUrl();
              this.router.navigate([ url ]);
            }
          }
        })
      }, 500)


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

     loadPhoneCodes(){
      //cargar la lista mundial de ciudades
      this.subscription.add( this.http.get('assets/jsons/phone_codes.json')
      .subscribe( (res : any) => {
        for (var i=0;i<res.length;i++){
          var phoneCodeList=res[i].phone_code.split(/["]/g)
          var phoneCode="+"+phoneCodeList[1]
          var countryNameCode="";
          var countryNameCodeList=[];
          if(this.authService.getLang()=="es"){
            countryNameCodeList=res[i].nombre.split(/["]/g)
          }
          else{
            countryNameCodeList=res[i].name.split(/["]/g)
          }
          countryNameCode=countryNameCodeList[1]
          this.phoneCodes.push({countryCode:countryNameCode,countryPhoneCode:phoneCode})
        }
        this.phoneCodes.sort(this.sortService.GetSortOrder("countryCode"));
      }));

    }

    cancelAuthyWaiting(){
      this.authyWaiting=false;
      this.sending=false;
      this.authService.stopPetition();
      this.loginForm.reset();
    }
    // On submit button click
    onSubmit(panelAddPhone) {
      this.sending = true;
      this.isBlockedAccount = false;
      this.isLoginFailed = false;
      this.authyFail=false;
      this.authyTimeout=false;
      this.authyWaiting=false;
      this.isActivationPending = false;
      this.isBlocked = false;
      this.requiredUpdatePhone=false;
      this.loginForm.value.password= sha512(this.loginForm.value.password)
      this.emailForUpdatePhone=this.loginForm.value.email;
      this.loginForm.value.device={id:this.deviceId,info:this.deviceInformation};
  	   this.subscription.add( this.authService.signinUser(this.loginForm.value).subscribe(
          (authenticated:any) => {
    		    if(authenticated.logged) {
              this.loginForm.reset();
               //this.translate.setDefaultLang( this.authService.getLang() );
               this.translate.use(this.authService.getLang());
               let url =  this.authService.getRedirectUrl();

              if(this.authService.getRole()=='User'){
                //this.loadAlertsState();
                this.subscription.add( this.patientService.getPatientId()
                .subscribe( (res : any) => {
                    if(res==null){
                      swal(this.translate.instant("personalinfo.Welcome"), this.translate.instant("personalinfo.Fill personal info"), "info");
                      this.router.navigate(['/user/basicinfo/personalinfo']);
                    }
                    else{

                      if(authenticated.reason=='showPopup'){
                        swal({
                          title: this.translate.instant("login.titlePopup"),
                          html: '<div class="col-md-12 mt-2"> <p> ' + this.translate.instant("registration.consent") + '</p> <p> ' + this.translate.instant("registration.consent3") + '</p> <p> ' + this.translate.instant("registration.consent4") + '</p> <p> ' + this.translate.instant("registration.consent5") + '</p> <p> ' + this.translate.instant("registration.consent6") + '</p></div>',
                          type: 'warning',
                          showCancelButton: true,
                          confirmButtonColor: '#0CC27E',
                          cancelButtonColor: '#FF586B',
                          confirmButtonText: this.translate.instant("login.accept"),
                          cancelButtonText: this.translate.instant("login.no accept"),
                          showLoaderOnConfirm: true,
                          allowOutsideClick: false
                        }).then((result) => {
                          console.log(result)
                          if (result.value) {
                            
                            console.log(result.value);
                            if (result.value == true){
                              this.sendTerms(true);
                            }else{
                              this.sendTerms(false);
                            }
                            //this.phenotype.data.splice(index, 1);
                          }else{
                            this.sendTerms(false);
                          }
                        }).catch(swal.noop);
                      }

                      // Check alerts with type 6 or 12 months if showDate > X months in each case
                      // and update all userAlerts showdate, state=Not read and launch = false
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
              if(authenticated.reason=="2FA"){
                this.textIntroInstructions="";
                this.textInstruction6="";
                this.textIntroInstructions=this.translate.instant("login.Instructions to download the app")
                this.textInstruction6=this.translate.instant("login.Instructions to download the app 6")
                swal({
                  title: this.translate.instant("login.Request authorization in Authy app"),
                    text: this.translate.instant("login.Authorization in authy app"),
                  type: 'warning',
                  showCancelButton: true,
                  showCloseButton: true,
                  //confirmButtonColor: '#0CC27E',
                  //cancelButtonColor: '#FF586B',
                  // Ya tengo la APP
                  confirmButtonText: this.translate.instant("login.Yes, continue"),
                  confirmButtonClass: 'swal2-actions-padding',
                  // No tengo la APP ir a descargarla
                  cancelButtonText: this.translate.instant("login.No, go to instructions"),
                  cancelButtonClass: 'swal2-actions-padding',
                  showLoaderOnConfirm: true,
                  allowOutsideClick: false
                }).then((result) => {
                  // ya tengo la APP
                  if(result.value==true){
                    this.authyWaiting=true;
                    this.authService.signin2FA(this.emailForUpdatePhone,this.loginForm.value.password,this.deviceId,this.deviceInformation)
                    .subscribe((authenticated2FA)=> {
                      if(authenticated2FA==true){
                        this.authyWaiting=false;
                        this.loginForm.reset();
                        this.translate.use(this.authService.getLang());
                        let url =  this.authService.getRedirectUrl();
                        if(this.authService.getRole()=='User'){
                          //this.loadAlertsState();
                          this.subscription.add( this.patientService.getPatientId()
                          .subscribe( (res : any) => {
                            if(res==null){
                              swal(this.translate.instant("personalinfo.Welcome"), this.translate.instant("personalinfo.Fill personal info"), "info");
                              this.router.navigate(['/user/basicinfo/personalinfo']);
                            }else{
                              // Check alerts with type 6 or 12 months if showDate > X months in each case
                              // and update all userAlerts showdate, state=Not read and launch = false
                              var patientId=res.sub;
                              this.subscription.add( this.http.get(environment.api+'/api/alerts/patient/checkDateForUserAlerts/'+patientId)
                              .subscribe( (res2 : any) => {
                                this.router.navigate([ url ]);
                              }, (err) => {
                                console.log(err);
                              }));

                              }
                            this.sending = false;
                            }, (err) => {
                              console.log(err);
                              this.sending = false;
                            }));
                        }else{
                          this.sending = false;
                          this.router.navigate([ url ]);
                        }


                      }
                      else if(authenticated2FA==false){
                        this.sending = false;
                        this.authyWaiting=false;
                        this.loginForm.reset();
                        let message =  this.authService.getMessage();
                        if(message == "Login failed" || message == "Not found"){
                            this.isLoginFailed = true;
                        }else if(message == "Authy access denied"){
                          this.authyFail = true;
                        }else if(message == "Account is temporarily locked"){
                          this.isBlockedAccount = true;
                        }else if(message == "Account is unactivated"){
                          this.isActivationPending = true;
                        }else if(message == "Account is blocked"){
                          this.isBlocked = true;
                        }
                        else if(message == "Authy time out"){
                          this.authyTimeout=true
                          this.authyWaiting=false;
                          this.isAccountActivated=false;
                          this.sending = false;
                          this.loginForm.reset();
                        }
                      }
                      else if(this.authyWaiting==false){
                        this.authService.stopPetition();
                        this.sending = false;
                        this.loginForm.reset();
                      }
                    });
                  }
                  //quiero descargar la App: Ir a las instrucciones
                  else if(result.dismiss=="cancel"){
                    this.showInstructions = true;
                  }
                  // Close button
                  else{
                    this.sending = false;
                    this.authyWaiting=false;
                    this.loginForm.reset();
                  }

                }).catch(swal.noop);

              }
              else if(authenticated.reason=="Update Phone"){
                //cargar la lista mundial de ciudades
                this.subscription.add( this.http.get('assets/jsons/phone_codes.json')
                .subscribe( (res : any) => {
                  for (var i=0;i<res.length;i++){
                    var phoneCodeList=res[i].phone_code.split(/["]/g)
                    var phoneCode="+"+phoneCodeList[1]
                    var countryNameCode="";
                    var countryNameCodeList=[];
                    if(this.authService.getLang()=="es"){
                      countryNameCodeList=res[i].nombre.split(/["]/g)
                    }
                    else{
                      countryNameCodeList=res[i].name.split(/["]/g)
                    }
                    countryNameCode=countryNameCodeList[1]
                    this.phoneCodes.push({countryCode:countryNameCode,countryPhoneCode:phoneCode})
                  }
                  this.phoneCodes.sort(this.sortService.GetSortOrder("countryCode"));
                  this.requiredUpdatePhone=true;
                  this.sending = false;
                  this.modalReference = this.modalService.open(panelAddPhone);
                }));

              }
              else{
                this.sending = false;
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
          }
  	   ));
    }

    sendTerms(value){
      console.log(value);
      var info = {value:value};
      this.subscription.add( this.http.post(environment.api+'/api/user/changeterms/'+this.authService.getIdUser(), info)
        .subscribe( (res1 : any) => {
          console.log(res1);
        }, (err) => {
          console.log(err);
        }));
    }

    launchDemo(){
      this.loginForm.value.email = 'demo@duchenne.org';
      this.loginForm.value.password = 'dddddddd';
      //this.onSubmit();
    }

    // On Forgot password link click
    onForgotPassword() {
        this.router.navigate(['/forgotpassword']);
    }
    // On registration link click
    onRegister() {
        this.router.navigate(['/register']);
    }

    loadAlertsState(){


    }

    submitInvalidFormPhone() {
      if (!this.phoneForm) { return; }
      const base = this.phoneForm;
      for (const field in base.form.controls) {
        if (!base.form.controls[field].valid) {
            base.form.controls[field].markAsTouched()
        }
      }
    }

    updatePhoneInfo(seleccionado,phone){
      this.sending = true;
      var email= this.loginForm.value.email;
      var body={email:this.emailForUpdatePhone,password:this.loginForm.value.password,countryselectedPhoneCode:seleccionado,phone:phone,device:{id:this.deviceId,info:this.deviceInformation}};
      //Guardar para el usuario el numero de telefono y cuenta en authy
      this.modalReference.close();
      this.subscription.add( this.http.post(environment.api+'/api/signin/registerUserInAuthy/',body)
      .subscribe( (res : any) => {
        if(res.message=="User Registered in Authy"){
          this.loginForm.setValue({email:email,password:''})
          swal('', this.translate.instant("login.Register in authy ok"), "success");
          this.sending = false;
        }
        else{
          swal('', this.translate.instant("login.Register in authy ko"), "error");
          this.sending = false;
        }

      }, (err) => {
        console.log(err);
        this.errorAccountActivated = true;
      }));
    }

    backToLogin(){
      this.showInstructions = false;
      this.sending = false;
      this.authyWaiting=false;
      this.loginForm.reset();
    }

    goToExternalUrl(url){
      if (this.isApp) {
        cordova.InAppBrowser.open(url, "_system", { location: "yes", closebuttoncaption: "Done" });
      }else{
        window.open(url, '_blank');
      }
    }
}
