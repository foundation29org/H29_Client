import { Component, ViewChild,  OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { HttpClient } from "@angular/common/http";
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'app/shared/auth/auth.service';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import { environment } from 'environments/environment';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'app-support',
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.scss']
})
export class SupportComponent implements OnDestroy{
  @ViewChild('f') supportForm: NgForm;

  private subscription: Subscription = new Subscription();
  supportInfo: any = {};
  msgList: any = [];
  sending: boolean = false;
  groupId: any;

  constructor(private http: HttpClient, private translate : TranslateService, private authService: AuthService, private authGuard: AuthGuard, public toastr: ToastsManager) {
    this.initVars();
  }

  initVars(){
    this.loadGroupId();
    this.supportInfo = {
      type: null,
      subject: '',
      description: '',
      userId: this.authService.getIdUser()
    };
  }

  loadGroupId(){
    this.subscription.add( this.http.get(environment.api+'/api/group/'+this.authService.getGroup())
      .subscribe( (resGroup : any) => {
        this.groupId = resGroup._id;
        this.loadMsg();
      }, (err) => {
        console.log(err);
    }));
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }


  submitInvalidForm() {
    if (!this.supportForm) { return; }
    const base = this.supportForm;
    for (const field in base.form.controls) {
      if (!base.form.controls[field].valid) {
          base.form.controls[field].markAsTouched()
      }
    }
  }

  sendMsg(){
    if(this.authGuard.testtoken()){
      this.sending = true;
      this.supportInfo.groupId = this.groupId;
      this.subscription.add( this.http.post(environment.api+'/api/support/', this.supportInfo)
      .subscribe( (res : any) => {
        this.toastr.success('', this.translate.instant("generics.Data saved successfully"), { showCloseButton: true });
        this.supportForm.reset();
        this.sending = false;
        this.initVars();
       }, (err) => {
         this.sending = false;
         console.log(err);
         this.toastr.error('', this.translate.instant("generics.error try again"), { showCloseButton: true });
       }));

    }
  }

  loadMsg(){
    if(this.authGuard.testtoken()){

      this.subscription.add( this.http.get(environment.api+'/api/support/'+this.authService.getIdUser())
      .subscribe( (res : any) => {
        this.msgList = res.listmsgs;
       }, (err) => {
         console.log(err);
         this.toastr.error('', this.translate.instant("generics.error try again"), { showCloseButton: true });
       }));

    }
  }

  resizeTextArea(){

    setTimeout(() =>
    {
      $('.autoajustable').each(function () {
        document.getElementById("textarea1").setAttribute( "style", "height:" + (this.scrollHeight) + "px;overflow-y:hidden; width: 100%;");

     }).on('input', function () {
         this.style.height = 'auto';
         this.style.height = (this.scrollHeight) + 'px';
     });

    },
    100);
  }


}
