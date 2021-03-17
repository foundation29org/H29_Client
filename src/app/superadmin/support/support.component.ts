import { Component, OnDestroy } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Object } from 'core-js/library/web/timers';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'app/shared/auth/auth.service';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { SortService} from 'app/shared/services/sort.service';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import { environment } from 'environments/environment';
import { Subscription } from 'rxjs/Subscription';
import { ApiDx29ServerService } from 'app/shared/services/api-dx29-server.service';
import { BlobStorageSupportService, IBlobAccessToken } from 'app/shared/services/blob-storage-support.service';
import swal from 'sweetalert2';
import { Observable } from 'rxjs/Observable';
import {DateAdapter} from '@angular/material/core';


@Component({
  selector: 'app-support',
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.scss'],
  providers: [ApiDx29ServerService]
})
export class SupportComponent implements OnDestroy{

  private subscription: Subscription = new Subscription();

  accessToken: IBlobAccessToken = {
    // tslint:disable-next-line:max-line-length
    sasToken: environment.blobAccessToken.sasToken,
    blobAccountUrl: environment.blobAccessToken.blobAccountUrl,
    containerName: 'filessupport'
  };
  uploadProgress: Observable<number>;
  totalSize: number = 0;
  msgList: any = [];
  timeformat="";


  constructor(private http: HttpClient, private translate : TranslateService, private authService: AuthService, private authGuard: AuthGuard, private blob: BlobStorageSupportService, public toastr: ToastsManager, private sortService: SortService, private adapter: DateAdapter<any>, private apiDx29ServerService: ApiDx29ServerService) {

    this.initVars();
    this.adapter.setLocale(this.authService.getLang());
    switch(this.authService.getLang()){
      case 'en':
        this.timeformat="M/d/yy";
        break;
      case 'es':
          this.timeformat="d/M/yy";
          break;
      case 'nl':
          this.timeformat="d-M-yy";
          break;
      default:
          this.timeformat="M/d/yy";
          break;

    }
    this.getAzureBlobSasToken();
  }

  getAzureBlobSasToken(){
    this.subscription.add( this.apiDx29ServerService.getAzureBlobSasToken('filessupport')
    .subscribe( (res : any) => {
      this.accessToken.sasToken = '?'+res;
      this.blob.init(this.accessToken);
    }, (err) => {
      console.log(err);
    }));
  }

  initVars(){
    this.loadMsg();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  loadMsg(){
    if(this.authGuard.testtoken()){
    var data = {groupId: null}
    this.subscription.add( this.http.post(environment.api+'/api/support/all/'+this.authService.getIdUser(), data)
      .subscribe( (res : any) => {
        res.listmsgs.sort(this.sortService.DateSort("date"));
        this.msgList = res.listmsgs;
       }, (err) => {
         console.log(err);
         this.toastr.error('', this.translate.instant("generics.error try again"), { showCloseButton: true });
       }));

    }
  }

  fieldStatusChanged(msg){
    msg.statusDate = Date.now();
    this.subscription.add( this.http.put(environment.api+'/api/support/'+msg._id, msg)
    .subscribe( (res : any) => {
      //this.loadMsg();
      this.toastr.success('', this.translate.instant("generics.Data saved successfully"), { showCloseButton: true });
     }, (err) => {
       console.log(err.error);
       if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
         this.authGuard.testtoken();
       }else{
         this.toastr.error('', this.translate.instant("generics.error try again"), { showCloseButton: true });
       }
     }));
  }

}
