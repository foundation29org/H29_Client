import { Component, ViewChild, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from "@angular/router";
import { environment } from 'environments/environment';
import { globalvars } from 'app/shared/global-variables';
import { HttpClient } from "@angular/common/http";
import { TranslateService } from '@ngx-translate/core';
import { SortService} from 'app/shared/services/sort.service';
import { sha512 } from "js-sha512";
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';
import { catchError, debounceTime, distinctUntilChanged, map, tap, switchMap, merge } from 'rxjs/operators'
import { AuthService } from 'app/shared/auth/auth.service';

import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { TermsConditionsPageComponent } from "../terms-conditions/terms-conditions-page.component";
import swal from 'sweetalert2';
import { Subscription } from 'rxjs/Subscription';

@Component({
    selector: 'app-register-page',
    templateUrl: './register-page.component.html',
    styleUrls: ['./register-page.component.scss'],
})

export class RegisterPageComponent implements OnDestroy{

    @ViewChild('f') registerForm: NgForm;
    sending: boolean = false;

    isVerifyemail: boolean = false;
    isEmailBusy: boolean = false;
    isFailEmail: boolean = false;

    groups: Array<any> = [];
    group: string = null;
    subgroups: any = [];
    subgroup: string = null;
    termso: boolean = false;
    openedTerms: boolean = false;
    isApp: boolean = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1 && location.hostname != "localhost" && location.hostname != "127.0.0.1";
    role: string = 'User';
    @ViewChild('input') inputEl;
    foundlab: boolean = false;
    searchinglab: boolean = false;
    phoneCodes:any=[];
    phoneCodeSelected:String="";

    modelTemp: any;
    formatter1 = (x: { name: string }) => x.name;

    seleccionado: string = null;
    duchennenetherlands: string = globalvars.duchennenetherlands;
    duchenneinternational: string = globalvars.duchenneinternational;

    private subscription: Subscription = new Subscription();

    constructor(private router: Router, private http: HttpClient, public translate: TranslateService, private modalService: NgbModal, private sortService: SortService,private authService: AuthService) {
      this.loadGroups();
      this.loadPhoneCodes();
      this.loadSubgroups();
    }

    ngOnDestroy() {
      this.subscription.unsubscribe();
    }

    onSearchChange(){
      this.searchinglab = true;
    }

    loadGroups() {
      //cargar los grupos actuales
      this.subscription.add( this.http.get(environment.api+'/api/groupsnames/')
      .subscribe( (res : any) => {
        this.groups = res;
        this.groups.sort(this.sortService.GetSortOrder("name"));
       }, (err) => {
         console.log(err);
       }));
    }

    loadSubgroups(){
      this.subscription.add( this.http.get('assets/jsons/subgroups.json')
      .subscribe( (res : any) => {
        this.subgroups = res;
      }));
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

    codePhoneChange(event, value){
      var phoneCode=value.split(" ")
      this.phoneCodeSelected=phoneCode;
    }

    // Open content Privacy Policy
    openTerms() {
      this.openedTerms = true;
      let ngbModalOptions: NgbModalOptions = {
            backdrop : 'static',
            keyboard : false
      };
      const modalRef = this.modalService.open(TermsConditionsPageComponent, ngbModalOptions);
      modalRef.componentInstance.role = this.role;
      modalRef.componentInstance.group = this.group;
    }

    submitInvalidForm() {
      if (!this.registerForm) { return; }
      const base = this.registerForm;
      for (const field in base.form.controls) {
        if (!base.form.controls[field].valid) {
            base.form.controls[field].markAsTouched()
        }
      }
    }

    //  On submit click, reset field value
    onSubmit() {
      this.sending = true;
      this.isVerifyemail = false;
      this.isEmailBusy = false;
      this.isFailEmail = false;
      //codificar el password
      this.registerForm.value.password = sha512(this.registerForm.value.password);
      this.registerForm.value.password2 = sha512(this.registerForm.value.password2);
      this.registerForm.value.email = (this.registerForm.value.email).toLowerCase();
      this.registerForm.value.lang=this.translate.store.currentLang;
      this.registerForm.value.countryCode=this.phoneCodeSelected[1]
      var params = this.registerForm.value;
      params.role = this.role;
      params.permissions = {};
      if(params.role!='User'){
        params.group = 'None';
      }

      this.subscription.add( this.http.post(environment.api+'/api/signup',params)
        .subscribe( (res : any) => {
          if(res.message == 'Account created'){
            this.isVerifyemail = true;
            swal('', this.translate.instant("registration.Check the email"), "success");
          }else if(res.message == 'Fail sending email'){
            this.isFailEmail = true;
            swal(this.translate.instant("generics.Warning"), this.translate.instant("registration.could not be sent to activate"), "error");
          }else if(res.message == 'user exists'){
            this.isEmailBusy = true;
            swal(this.translate.instant("generics.Warning"), this.translate.instant("registration.email already exists"), "error");
          }
          this.resetForm()

          this.sending = false;
         }, (err) => {
           console.log(err);
           swal(this.translate.instant("generics.Warning"), this.translate.instant("generics.error try again"), "error");
           this.resetForm();
           this.sending = false;
         }));

    }

    resetForm(){
      this.registerForm.reset();
      this.role = 'User';
    }

    goToLogin(){
      this.router.navigate(['/login']);
    }

    roleChange(role){
      if(role!='User'){
        this.group = null;
      }
    }

}
