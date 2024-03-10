import { Component, ViewChild, OnInit, OnDestroy, Injector } from '@angular/core';
import { Router } from "@angular/router";
import { NgForm, FormControl } from '@angular/forms';
import { environment } from 'environments/environment';
import { globalvars } from 'app/shared/global-variables';
import { HttpClient } from "@angular/common/http";
import { AuthService } from 'app/shared/auth/auth.service';
import { DateService } from 'app/shared/services/date.service';
import { Patient, Sibling, Parent } from './patient.interface';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import { SearchFilterPipe} from 'app/shared/services/search-filter.service';
import { TranslateService } from '@ngx-translate/core';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import {DateAdapter} from '@angular/material/core';
import { Subscription } from 'rxjs/Subscription';
import { AlertsService } from 'app/shared/services/alerts.service';
import swal from 'sweetalert2';

@Component({
    selector: 'app-personalInfo',
    templateUrl: './personal-info.component.html',
    styleUrls: ['./personal-info.component.scss']
})

export class PersonalInfoComponent implements OnInit, OnDestroy{
  //Variable Declaration
  date = new FormControl(new Date());
  serializedDate = new FormControl((new Date()).toISOString());
  isSafari:boolean = navigator.vendor && navigator.vendor.indexOf('Apple') > -1 && navigator.userAgent && !navigator.userAgent.match('CriOS');
  isApp: boolean = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1 && location.hostname != "localhost" && location.hostname != "127.0.0.1";
  isIeOrEdge = (navigator.userAgent.indexOf('MSIE') !== -1 || navigator.appVersion.indexOf('Trident/') > 0) || /Edge/.test(navigator.userAgent);
  @ViewChild('f') personalInfoForm: NgForm;
  countries: any;
  provincesbirth: any = null;
  citiesTotal: any;
  citiesBirth:any;
  cities:any;
  provinces: any = null;
  patient: any;
  patientCopy: any;
  private msgDataSavedOk: string;
  private msgDataSavedFail: string;
  loading: boolean = false;
  sending: boolean = false;
  group: string;
  subgroup: string;
  nameduchenneInter: string = globalvars.duchenneinternational;
  private subscription: Subscription = new Subscription();

  constructor(private router: Router, private http: HttpClient, private authService: AuthService,private inj: Injector, private dateService: DateService, public toastr: ToastsManager, public searchFilterPipe: SearchFilterPipe, public translate: TranslateService, private authGuard: AuthGuard, private adapter: DateAdapter<any>) {
    this.group = this.authService.getGroup();
    this.subgroup = this.authService.getSubgroup();
    console.log(this.subgroup);
    this.loading = true;
    this.adapter.setLocale(this.authService.getLang());

    if(this.isSafari){
      if (this.isApp) {
        // only for descktop, not for mobile browser. for that, if is device, set safari false
        this.isSafari=false;
      }
    }

    //cargar la lista mundial de ciudades
    this.subscription.add( this.http.get('assets/jsons/cities.json')
      .subscribe( (res : any) => {
        this.citiesTotal=res;

        //cargar la lista de paises
        if(this.authService.getLang()=='nl'){
          this.subscription.add( this.http.get('assets/jsons/countries_nl.json')
          .subscribe( (res : any) => {
            this.countries=res;
            this.loadData();
          }, (err) => {
            console.log(err);
          }));
        }else{
          this.subscription.add( this.http.get('assets/jsons/countries.json')
          .subscribe( (res : any) => {
            this.countries=res;
            this.loadData();
          }, (err) => {
            console.log(err);
          }));
        }

      }, (err) => {
        console.log(err);
      }));
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  ngOnInit() {
    this.patient = {
      patientName: '',
      surname: '',
      street: '',
      postalCode: '',
      citybirth: '',
      provincebirth: '',
      countrybirth: null,
      city: '',
      province: '',
      country: null,
      phone1: '',
      phone2: '',
      birthDate: null,
      gender: null,
      siblings: [],
      parents: []
    };

     this.loadTranslations();
     this.adapter.setLocale(this.authService.getLang());

  }

  loadData(){
    //cargar los datos del usuario
    this.loading = true;
    this.subscription.add( this.http.get(environment.api+'/api/patients-all/'+this.authService.getIdUser())
    .subscribe( (res : any) => {
      if(res.listpatients.length>0){
        this.authService.setPatientList(res.listpatients);
        this.authService.setCurrentPatient(res.listpatients[0]);
        this.subscription.add( this.http.get(environment.api+'/api/patients/'+res.listpatients[0].sub)
        .subscribe( (res : any) => {
          this.patient = res.patient;
          this.patient.birthDate=this.dateService.transformDate(res.patient.birthDate);

            //obtengo el nombre del fichero json de las provincias que le corresponde al codigo del pais nacimiento
            if(this.patient.countrybirth){

              var provincebirth=this.searchFilterPipe.transform(this.countries, 'code', this.patient.countrybirth);
              if(provincebirth[0].filename){
                this.loadProvincesbirth(provincebirth[0].filename);
                //this.loadCitiesBirth();
              }else{
                this.provincesbirth=null;
                //this.citiesBirth=null;
              }
              if(this.citiesTotal!= undefined && this.citiesTotal.length>0){
                this.loadCitiesBirth();
              }
              else{
                this.citiesBirth=[];
              }
            }

            //obtengo el nombre del fichero json de las provincias que le corresponde al codigo del pais
            if(this.patient.country){

              var province=this.searchFilterPipe.transform(this.countries, 'code', this.patient.country);
              if(province[0].filename){
                this.loadProvinces(province[0].filename);
                //this.loadCities();
              }else{
                this.provinces=null;
                //this.cities=null;
              }
              if(this.citiesTotal!= undefined && this.citiesTotal.length>0){
                this.loadCities();
              }
              else{
                this.cities=[];
              }

            }

          this.patientCopy = JSON.parse(JSON.stringify(res.patient));
          this.loading = false;


         }, (err) => {
           console.log(err);
           this.loading = false;
           this.toastr.error('', this.translate.instant("generics.error try again"), { showCloseButton: true });
         }));


      }else{
          this.loading = false;
      }
      if(this.patient.siblings.length==0){
        let sibling: Sibling = {gender: '', affected: null};
        this.patient.siblings.push(sibling);
      }
      if(this.patient.parents.length==0){
        let parent: Parent = {highEducation: '', profession: '', relationship: '', nameCaregiver: ''};
        this.patient.parents.push(parent);
      }
     }, (err) => {
       console.log(err);
       this.loading = false;
       this.toastr.error('', this.translate.instant("generics.error try again"), { showCloseButton: true });
     }));
  }

  //traducir cosas
  loadTranslations(){
    this.translate.get('generics.Data saved successfully').subscribe((res: string) => {
      this.msgDataSavedOk=res;
    });
    this.translate.get('generics.Data saved fail').subscribe((res: string) => {
      this.msgDataSavedFail=res;
    });
  }

  resetForm() {
    this.patient= JSON.parse(JSON.stringify(this.patientCopy));
    this.toastr.warning('', this.translate.instant("generics.Restored data"), { showCloseButton: true });
  }


  addSibling() {
    let sibling: Sibling = {gender: null, affected: null};
    this.patient.siblings.push(sibling);
  }

  deleteSibling(index){
    this.patient.siblings.splice(index, 1);
  }

  addParentCaregiver() {
    let parent: Parent = {highEducation: '', profession: '', relationship: '', nameCaregiver: ''};
    this.patient.parents.push(parent);
  }

  deleteParentCaregiver(index){
    this.patient.parents.splice(index, 1);
  }

  onChangeCountryBirth(newValue, index) {
    var res = index.split(":");
    var countryselectedBirth = this.countries[res[0]];
    if(countryselectedBirth.filename){
      this.loadProvincesbirth(countryselectedBirth.filename)
    }else{
      this.provincesbirth=null;
      this.patient.provincebirth=null;
    }
    if(this.citiesTotal!= undefined && this.citiesTotal.length>0){
      this.loadCitiesBirth();
      $("#citybirth").val("");
    }
    else{
      this.citiesBirth=[];
    }
  }

  onChangeCountry(newValue, index) {
    var res = index.split(":");
    var countrySelected = this.countries[res[0]];
    if(countrySelected.filename){
      this.loadProvinces(countrySelected.filename)
    }else{
      this.provinces=null;
      this.patient.province=null;
    }
    if(this.citiesTotal!= undefined && this.citiesTotal.length>0){
      this.loadCities();
      $("#city").val("");
    }
    else{
      this.cities=[];
    }
  }

  loadProvincesbirth(countryname){
    this.subscription.add( this.http.get('assets/jsons/countries/'+countryname+'.json')
    .subscribe( (res : any) => {
      this.provincesbirth=res;
      if(this.patient.provincebirth =='' || this.patient.provincebirth == null){
        this.patient.provincebirth = res[0].code;
      }
     }, (err) => {
       console.log(err);
     }));
  }

  loadProvinces(countryname){
    this.subscription.add( this.http.get('assets/jsons/countries/'+countryname+'.json')
    .subscribe( (res : any) => {
      this.provinces=res;
      if(this.patient.province =='' || this.patient.province == null){
        this.patient.province = res[0].code;
      }
     }, (err) => {
       console.log(err);
     }));
  }

  loadCitiesBirth(){
    this.citiesBirth=[""];
    var citiesBirth = [];
    for (var i = 0;i<this.citiesTotal.length;i++){
      if(this.citiesTotal[i].country==this.patient.countrybirth){
        citiesBirth.push(this.citiesTotal[i].name);
      }
    }
    this.citiesBirth=citiesBirth.sort(function (a, b) {
      return a.toLowerCase().localeCompare(b.toLowerCase());
    });
    //return citiesBirth;
  }

  loadCities(){
    this.cities=[""];
    var citiesActual = [];
    for (var i = 0;i<this.citiesTotal.length;i++){
      if(this.citiesTotal[i].country==this.patient.country){
        citiesActual.push(this.citiesTotal[i].name);
      }
    }
    this.cities=citiesActual.sort(function (a, b) {
      return a.toLowerCase().localeCompare(b.toLowerCase());
    });
    //return citiesBirth;
  }

  submitInvalidForm() {
    if (!this.personalInfoForm) { return; }
    const base = this.personalInfoForm;
    for (const field in base.form.controls) {
      if (!base.form.controls[field].valid) {
          base.form.controls[field].markAsTouched()
      }
    }
  }

  onSubmit() {
    if(this.authGuard.testtoken()){
      this.sending = true;
      if(this.authService.getCurrentPatient()==null){
        this.subscription.add( this.http.post(environment.api+'/api/patients/'+this.authService.getIdUser(), this.patient)
        .subscribe( (patient : any) => {
          if(patient.patientInfo != undefined){
            this.authService.setCurrentPatient(patient.patientInfo);
          }
          this.subscription.add( this.http.get(environment.api+'/api/groups/')
            .subscribe( (group : any) => {
              var currentGroupId
              group.forEach(element => {
                if(element.name == this.authService.getGroup()){
                  currentGroupId = element._id
                }
              })

              var params = currentGroupId +'-code-'+patient.patientInfo.sub
              this.subscription.add( this.http.get(environment.api+'/api/alerts/createUserAlertsForPatient/'+params)
              .subscribe( (res2 : any) => {
                if(res2){

                  swal({
                    title: this.translate.instant("personalinfo.Fill personal info ok tittle"),
                    html: this.translate.instant("personalinfo.Fill personal info ok text"),
                    type: 'info'
                    }).then((result) => {
                      if (result.value) {
                        this.loadData();
                        //location.reload();
                        //aqui ha habido un fallo creo
                        //this.router.navigateByUrl('/', {skipLocationChange: true}).then(() =>
                        //this.router.navigate([this.router.url]));
                      }
                    }).catch(swal.noop);

                }

              }, (err) => {
                console.log(err);
                //location.reload();
                this.router.navigateByUrl('/', {skipLocationChange: true}).then(() =>
                this.router.navigate([this.router.url]));
              }));

            }, (err) => {
              console.log(err);
              //location.reload();
              this.router.navigateByUrl('/', {skipLocationChange: true}).then(() =>
              this.router.navigate([this.router.url]));
            }));



          this.sending = false;
          this.toastr.success('', this.msgDataSavedOk, { showCloseButton: true });
         }, (err) => {
           console.log(err);
           this.sending = false;
           if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
             this.authGuard.testtoken();
           }else{
             this.toastr.error('', this.msgDataSavedFail, { showCloseButton: true });
           }
         }));
      }else{
        this.subscription.add( this.http.put(environment.api+'/api/patients/'+this.authService.getCurrentPatient().sub, this.patient)
        .subscribe( (res : any) => {
          this.authService.setCurrentPatient(res.patientInfo);
          this.sending = false;
          this.toastr.success('', this.msgDataSavedOk, { showCloseButton: true });
         }, (err) => {
           console.log(err);
           this.sending = false;
           if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
             this.authGuard.testtoken();
           }else{
             this.toastr.error('', this.msgDataSavedFail, { showCloseButton: true });
           }
         }));
      }
    }
  }





}
