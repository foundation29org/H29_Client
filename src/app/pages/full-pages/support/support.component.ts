import { Component, ViewChild,  OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { HttpClient } from "@angular/common/http";
import { Object } from 'core-js/library/web/timers';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'app/shared/auth/auth.service';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import { environment } from 'environments/environment';
import { Subscription } from 'rxjs/Subscription';
import { ApiDx29ServerService } from 'app/shared/services/api-dx29-server.service';
import { BlobStorageSupportService, IBlobAccessToken } from 'app/shared/services/blob-storage-support.service';
import swal from 'sweetalert2';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'app-support',
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.scss'],
  providers: [ApiDx29ServerService]
})
export class SupportComponent implements OnDestroy{
  @ViewChild('f') supportForm: NgForm;

  private subscription: Subscription = new Subscription();

  accessToken: IBlobAccessToken = {
    // tslint:disable-next-line:max-line-length
    sasToken: environment.blobAccessToken.sasToken,
    blobAccountUrl: environment.blobAccessToken.blobAccountUrl,
    containerName: 'filessupport'
  };
  uploadProgress: Observable<number>;
  totalSize: number = 0;
  uploadingFile: boolean = false;
  supportInfo: any = {};
  msgList: any = [];
  sending: boolean = false;
  groupId: any;

  constructor(private http: HttpClient, private translate : TranslateService, private authService: AuthService, private authGuard: AuthGuard, private blob: BlobStorageSupportService, public toastr: ToastsManager, private apiDx29ServerService: ApiDx29ServerService) {

    this.initVars();

    this.subscription.add(this.blob.change.subscribe(params => {
       this.uploadingFile = !(params.uploaded);
       this.supportInfo.files.push(params.filename);
       //swal('Done', '', "success");
     }));

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
    this.loadGroupId();
    this.supportInfo = {
      type: null,
      subject: '',
      description: '',
      files: [],
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

  deleteDataAndFile(index){
    //eliminar del blob
    this.blob.deleteBlob(this.accessToken.containerName , this.supportInfo.files[index]);

    var datadetcopy = [];
    delete this.supportInfo.files[index];
    for (var i = 0; i < this.supportInfo.length; i++) {
      if(this.supportInfo[i]!=undefined){
        datadetcopy.push(this.supportInfo[i]);
      }

    }
    this.supportInfo.files= datadetcopy;

  }

  onFileChange(event: any): void {
    if((event.target.files[0].size /1024/1024) + this.totalSize > 4000){
      swal('Space limit exceeded. Delete some file or hire more space.', '', "error");
    }else{
      var filename = event.target.files[0].name;
      var extension = filename.substr(filename.lastIndexOf('.'));
      filename = filename.split(extension)[0];
      filename = filename + '-support' + '-' + Date.now()+extension;
      this.uploadingFile = true;
      this.uploadProgress = this.blob
        .uploadToBlobStorage(this.accessToken, event.target.files[0], filename);
    }

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
