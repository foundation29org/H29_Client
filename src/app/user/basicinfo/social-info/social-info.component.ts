import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from "@angular/router";
import { NgForm, FormControl } from '@angular/forms';
import { environment } from 'environments/environment';
import { globalvars } from 'app/shared/global-variables';
import { HttpClient } from "@angular/common/http";
import { AuthService } from 'app/shared/auth/auth.service';
import { SocialInfo } from './social-info.interface';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import { TranslateService } from '@ngx-translate/core';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import swal from 'sweetalert2';
import { Subscription } from 'rxjs/Subscription';

@Component({
    selector: 'app-socialInfo',
    templateUrl: './social-info.component.html',
    styleUrls: ['./social-info.component.scss']
})

export class SocialInfoComponent implements OnInit, OnDestroy{
  //Variable Declaration
  @ViewChild('f') socialInfoForm: NgForm;
  livingSituation = new FormControl();
  support = new FormControl();
  sports = new FormControl();
  interests = new FormControl();
  socialInfo: any;
  socialInfoCopy: any;
  private msgDataSavedOk: string;
  private msgDataSavedFail: string;
  loading: boolean = false;
  sending: boolean = false;
  showfieldOtherSports: boolean = false;
  showfieldOtherInterests: boolean = false;
  group: string;
  nameduchenne: string = globalvars.duchennenetherlands;
  nameduchenneInter: string = globalvars.duchenneinternational;
  private subscription: Subscription = new Subscription();

  //idSocialInfo: string = null;
  constructor(private router: Router, private route: ActivatedRoute, private http: HttpClient, private authService: AuthService, public toastr: ToastsManager, public translate: TranslateService, private authGuard: AuthGuard) {
    this.group = this.authService.getGroup();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

    ngOnInit() {
      this.loadTranslations();

      this.socialInfo = {
        education: '',
        completedEducation: '',
        currentEducation: '',
        work: '',
        hoursWork: '',
        profession: '',
        livingSituation: '',
        support: [],
        sports: [],
        othersport: '',
        interests: [],
        otherinterest: '',
        moreInterests: '',
        _id: null
      };

      //cargar los datos del usuario
      this.loading = true;
      this.subscription.add( this.http.get(environment.api+'/api/patients-all/'+this.authService.getIdUser())
      .subscribe( (res : any) => {
        if(res.listpatients.length>0){
          this.authService.setPatientList(res.listpatients);
          this.authService.setCurrentPatient(res.listpatients[0]);
          this.subscription.add( this.http.get(environment.api+'/api/socialinfos/'+res.listpatients[0].sub)
          .subscribe( (res : any) => {
            if(res.message){
              //no tiene información social
            }else{
              this.socialInfo = res.socialInfo;
              this.socialInfoCopy = JSON.parse(JSON.stringify(res.socialInfo));
              this.sportschanged();
              this.interestschanged();
              //this.idSocialInfo = res.socialInfo._id;
            }
            this.loading = false;
           }, (err) => {
             console.log(err);
             this.loading = false;
           }));
        }else{
          swal(this.translate.instant("generics.Warning"), this.translate.instant("personalinfo.Fill personal info"), "warning");
          this.router.navigate(['/user/basicinfo/personalinfo']);
        }
       }, (err) => {
         console.log(err);
         this.loading = false;
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
      this.socialInfo= JSON.parse(JSON.stringify(this.socialInfoCopy));
      this.toastr.warning('', this.translate.instant("generics.Restored data"), { showCloseButton: true });
    }

    onSubmit() {
      if(this.authGuard.testtoken()){
        this.sending = true;
        if(this.socialInfo._id==null){
          this.subscription.add( this.http.post(environment.api+'/api/socialinfos/'+this.authService.getCurrentPatient().sub, this.socialInfo)
          .subscribe( (res : any) => {
            //this.idSocialInfo = res.socialInfo._id;
            this.socialInfo = res.socialInfo;
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
          this.subscription.add( this.http.put(environment.api+'/api/socialinfos/'+this.socialInfo._id, this.socialInfo)
          .subscribe( (res : any) => {
            //this.idSocialInfo = res.socialInfo._id;
            this.socialInfo = res.socialInfo;
            this.sending = false;
            this.toastr.success('', this.msgDataSavedOk, { showCloseButton: true });
           }, (err) => {
             console.log(err.error);
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

  sportschanged(){
    this.showfieldOtherSports = false;
    console.log(this.socialInfo.sports);
    this.socialInfo.sports.forEach(function(item){
      if (item === 'other') {
          console.log('other');
          this.showfieldOtherSports = true;
      }
   }.bind(this));
    
  }

  interestschanged(){
    console.log(this.socialInfo.interests);
    this.socialInfo.interests.forEach(function(item){
      if (item === 'other') {
          console.log('other');
          this.showfieldOtherInterests = true;
      }
   }.bind(this));
    
  }

  }
