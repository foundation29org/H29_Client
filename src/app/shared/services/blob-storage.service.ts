import { Injectable, EventEmitter, Output } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

declare var AzureStorage: any;

export interface IBlobAccessToken {
  blobAccountUrl: string;
  sasToken: string;
  containerName: string;
  patientId: string;
}

@Injectable()
export class BlobStorageService {
  @Output() change: EventEmitter<boolean> = new EventEmitter();
  @Output() changeFilesBlob: EventEmitter<any> = new EventEmitter();
  @Output() changeFilesExomizerBlob: EventEmitter<any> = new EventEmitter();
  @Output() changeFilesExomizerBlobVcf: EventEmitter<any> = new EventEmitter();
  @Output() changeFilesPhenolyzerBlob: EventEmitter<any> = new EventEmitter();
  private finishedOrError = false;
  uploaded = false;
  filesOnBlob: any = [];
  vcfFilesOnBlob: any = [];
  filesPhenolyzerOnBlob: any = [];

  blobService: any;

  init(accessToken: IBlobAccessToken){
    const blobUri = accessToken.blobAccountUrl;
    this.blobService = AzureStorage
      .createBlobServiceWithSas(blobUri, accessToken.sasToken)
      .withFilter(new AzureStorage.ExponentialRetryPolicyFilter());
  }

  uploadToBlobStorage(accessToken: IBlobAccessToken, file: File): Observable<number> {
    const progress$ = new Subject<number>();
    const speedSummary = this.uploadFile(accessToken, file, progress$);

    this.refreshProgress(speedSummary, progress$);

    return progress$.asObservable();
  }

  createContainerIfNotExists(accessToken: IBlobAccessToken){
    const blobUri = accessToken.blobAccountUrl;
    this.blobService = AzureStorage
      .createBlobServiceWithSas(blobUri, accessToken.sasToken)
      .withFilter(new AzureStorage.ExponentialRetryPolicyFilter());
      this.blobService.createContainerIfNotExists(accessToken.containerName, {
        publicAccessLevel: 'blob'
      }, function(error, result, response) {
        if (!error) {
          /*this.blobService.createDirectoryIfNotExists(accessToken.containerName, 'epa folder', function(error, result, response) {
            if (!error) {
              this.loadFilesOnBlob(accessToken.containerName);
            }
          }.bind(this));*/

          this.loadFilesOnBlob(accessToken.containerName);
          // if result = true, container was created.
          // if result = false, container already existed.
        }
      }.bind(this));
  }


  private uploadFile(accessToken: IBlobAccessToken, file: File, progress$: Subject<number>): any {
    this.uploaded = false;
    const customBlockSize = file.size > 1024 * 1024 * 32 ? 1024 * 1024 * 4 : 1024 * 512;
    const blobUri = accessToken.blobAccountUrl;
    this.blobService = AzureStorage
      .createBlobServiceWithSas(blobUri, accessToken.sasToken)
      .withFilter(new AzureStorage.ExponentialRetryPolicyFilter());

    this.blobService.singleBlobPutThresholdInBytes = customBlockSize;

    return this.blobService.createBlockBlobFromBrowserFile(
      accessToken.containerName,
      file.name,
      file,
      { blockSize: customBlockSize },
      this.callback(progress$, accessToken)
    );
  }

  private refreshProgress(speedSummary: any, progress$: Subject<number>): void {
    setTimeout(() => {
      if (!this.uploaded) {
        const progress = speedSummary.getCompletePercent();
        progress$.next(progress);
        this.refreshProgress(speedSummary, progress$);
      }
    }, 200);
  }

  private callback(progress$: Subject<number>, accessToken: IBlobAccessToken): (error, result, response) => void {
    return (error, result, response) => {
      this.finishedOrError = true;
      if (error) {
        progress$.error('Error uploading to blob storage: ' + JSON.stringify(accessToken));
        this.uploaded = false;
      } else {
        progress$.next(100);
        progress$.complete();
        //call to nodejs for call microsoft genomics
        this.uploaded = true;
        this.change.emit(this.uploaded);
        this.loadFilesOnBlob(accessToken.containerName);
      }
    };
  }

  loadFilesOnBlob(containerName){
   this.filesOnBlob = [];
    this.blobService.listBlobsSegmented(containerName, null, {
      publicAccessLevel: 'blob'
    }, function(error, result, response) {
      if (!error) {
        var filesgeno = [];
        for (var i = 0; i < result.entries.length; i++) {
          if((result.entries[i].name).indexOf('medicalcare')==-1){
            filesgeno.push(result.entries[i]);
          }
        }
        this.filesOnBlob = filesgeno;
        this.changeFilesBlob.emit(this.filesOnBlob);
        // if result = true, container was created.
        // if result = false, container already existed.
      }
    }.bind(this));
  }

  loadFilesOnBlobExomizer(containerName){
   this.filesOnBlob = [];
   this.vcfFilesOnBlob = [];
    this.blobService.listBlobsSegmented(containerName, null, {
      publicAccessLevel: 'blob'
    }, function(error, result, response) {
      if (!error) {
        var filesgeno = [];
        var filesgenovcf = [];
        for (var i = 0; i < result.entries.length; i++) {
          if((result.entries[i].name).indexOf('exomizer')!=-1 && (result.entries[i].name).indexOf('.json')!=-1){
            filesgeno.push(result.entries[i]);
          }
          if((result.entries[i].name).indexOf('.vcf')!=-1){
            filesgenovcf.push(result.entries[i]);
          }

        }
        this.filesOnBlob = filesgeno;
        this.changeFilesExomizerBlob.emit(this.filesOnBlob);
        this.vcfFilesOnBlob = filesgenovcf;
        this.changeFilesExomizerBlobVcf.emit(this.vcfFilesOnBlob);
        // if result = true, container was created.
        // if result = false, container already existed.
      }
    }.bind(this));
  }

  loadFilesOnBlobPhenolyzer(containerName){
   this.filesPhenolyzerOnBlob = [];
    this.blobService.listBlobsSegmented(containerName, null, {
      publicAccessLevel: 'blob'
    }, function(error, result, response) {
      if (!error) {
        var filesPhenolyzer = [];
        for (var i = 0; i < result.entries.length; i++) {
          if((result.entries[i].name).indexOf('phenolyzer')!=-1 && (result.entries[i].name).indexOf('.json')!=-1){
            filesPhenolyzer.push(result.entries[i]);
          }

        }
        this.filesPhenolyzerOnBlob = filesPhenolyzer;
        this.changeFilesPhenolyzerBlob.emit(this.filesPhenolyzerOnBlob);
        // if result = true, container was created.
        // if result = false, container already existed.
      }
    }.bind(this));
  }

  deleteBlob(containerName, blobName){


    this.blobService.deleteBlob(containerName, blobName, {
      publicAccessLevel: 'blob'
    }, function(error, result, response) {
      if (!error) {
        this.loadFilesOnBlob(containerName);
        // if result = true, container was created.
        // if result = false, container already existed.
      }
    }.bind(this));
  }

  deleteContainerIfExists(accessToken: IBlobAccessToken){
    const blobUri = accessToken.blobAccountUrl;
    this.blobService = AzureStorage
      .createBlobServiceWithSas(blobUri, accessToken.sasToken)
      .withFilter(new AzureStorage.ExponentialRetryPolicyFilter());
      this.blobService.deleteContainerIfExists(accessToken.containerName, {
        publicAccessLevel: 'blob'
      }, function(error, result, response) {
        if (!error) {
        }
      }.bind(this));
  }

}
