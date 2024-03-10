import { Component, ViewChild, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from "@angular/router";
import { NgForm } from '@angular/forms';
import { globalvars } from 'app/shared/global-variables';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient } from "@angular/common/http";
import { AuthService } from 'app/shared/auth/auth.service';
import { environment } from 'environments/environment';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { PatientService } from 'app/shared/services/patient.service';
import swal from 'sweetalert2';
import { Subscription } from 'rxjs/Subscription';
declare let cordova: any;

@Component({
    selector: 'app-terms-conditions-page',
    templateUrl: './terms-conditions-page.component.html',
    styleUrls: ['./terms-conditions-page.component.scss'],
    providers: [PatientService]
})

export class TermsConditionsPageComponent implements OnInit{
  showSecurity: boolean = false;
  role: string = '';
  group: string = '';
  state: string = '';
  duchenneinternational: string = globalvars.duchenneinternational;
  private subscription: Subscription = new Subscription();
  isApp: boolean = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1 && location.hostname != "localhost" && location.hostname != "127.0.0.1";
  @ViewChild('f') termsForm: NgForm;

  constructor(public activeModal: NgbActiveModal, public translate: TranslateService, private modalService: NgbModal, private http: HttpClient, private authService: AuthService, private patientService: PatientService, private router: Router) {
    setTimeout(function () {
        this.goTo('initpos');
    }.bind(this), 500);

  }

  ngOnInit() {
    if(this.state=='showPopup'){
      this.translate.use(this.authService.getLang());
      setTimeout(function () {
        var htmlcode = '<div class="col-md-12 mt-2 text-left"> <p> ' + this.translate.instant("login.consent") + '</p> <p class="mt-4"> ' + this.translate.instant("login.consent4") + '</p> <p> ' + this.translate.instant("login.consent5") + '</p> <p class="mt-4"> ' + this.translate.instant("login.consent6") + '</p><p> ' + this.translate.instant("login.consent7") + '</p></div>';
        swal({
          html: htmlcode,
          type: undefined,
          showCancelButton: false,
          confirmButtonColor: '#0CC27E',
          cancelButtonColor: '#d71920',
          confirmButtonText: this.translate.instant("generics.Close"),
          showLoaderOnConfirm: true,
          allowOutsideClick: false
        }).then((result) => {
          console.log(result)
          if (result.value) {
            //this.sendTerms(true);
          }else{
            //this.sendTerms(false);
          }
        }).catch(swal.noop);
      }.bind(this), 500);
    }
  }

  goTo(url){
    document.getElementById(url).scrollIntoView(true);
  }

  openSecurity() {
    this.showSecurity = true;
    setTimeout(function () {
        this.goTo('initposSecurity');
    }.bind(this), 200);
  }

  back(){
    this.showSecurity = false;
    setTimeout(function () {
        this.goTo('stepback');
    }.bind(this), 500);

  }

  goToExternalUrl(url){
    if (this.isApp) {
      cordova.InAppBrowser.open(url, "_system", { location: "yes", closebuttoncaption: "Done" });
    }else{
      window.open(url, '_blank');
    }
  }

  submitInvalidForm() {
    if (!this.termsForm) { return; }
    const base = this.termsForm;
    for (const field in base.form.controls) {
      if (!base.form.controls[field].valid) {
          base.form.controls[field].markAsTouched()
      }
    }
  }

  onSubmit() {
      var info = {value:true};
      this.subscription.add( this.http.post(environment.api+'/api/user/changeterms/'+this.authService.getIdUser(), info)
        .subscribe( (res1 : any) => {
          console.log(res1);
          this.authService.setMessage('You have successfully logged in');
          this.continueProcess();
        }, (err) => {
          console.log(err);
        }));
  }

  continueProcess(){
    let url =  this.authService.getRedirectUrl();
    this.subscription.add( this.patientService.getPatientId()
                  .subscribe( (res : any) => {
                      if(res==null){
                        swal(this.translate.instant("personalinfo.Welcome"), this.translate.instant("personalinfo.Fill personal info"), "info");
                        this.router.navigate(['/user/basicinfo/personalinfo']);
                      }
                      else{
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
                  }, (err) => {
                    console.log(err);
                  }));
  }
}
