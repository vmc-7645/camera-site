import { Component, EventEmitter, OnInit, Output, ViewChild, ElementRef, HostListener } from '@angular/core';
import { WebcamImage, WebcamInitError, WebcamUtil } from 'ngx-webcam';
import { interval, Observable, Subject } from 'rxjs';

import { FullscreenService } from '../fullscreen-service.service';

import { CookieService } from 'ngx-cookie';

import * as FileSaver from 'file-saver';


@Component({
  selector: 'app-camera',
  templateUrl: './camera.component.html',
  styleUrls: ['./camera.component.css']
})
export class CameraComponent implements OnInit {

  // //ADDED
  // @ViewChild('videoCamera', {static: true}) videoCamera: ElementRef;
  // @ViewChild('canvas', {static: true}) canvas: ElementRef;
  
  @Output() getPicture = new EventEmitter<WebcamImage>();
  showWebcam = true;
  isCameraExist = true;

  errors: WebcamInitError[] = [];

  public showOverlay: boolean = false;

  // window width and height
  public windowWidth: any;
  public windowHeight: any;

  //Webcam image(s)
  webcamImage: WebcamImage | undefined;
  webcamImages: Array<WebcamImage> = [];

  // webcam snapshot trigger
  private trigger: Subject<void> = new Subject<void>();
  private nextWebcam: Subject<boolean | string> = new Subject<boolean | string>();

  // webcam options
  public imageQuality: number = this.cookieService.hasKey("cameraDetail")?Number(this.getCookie("cameraDetail")):1 // 0 to 1 in 0.01 multiples
  public mirrorImage: string = this.cookieService.hasKey("mirrorImage")?(this.getCookie("mirrorImage")=='true'?"always":"never"):"always" //"always" //always or never
  public imageType: string = 'image/jpeg' //'image/jpeg' or 'image/png'
  public autoDownload: boolean = this.cookieService.hasKey("autoDownload")?this.getCookie("autoDownload")=='true':false;



  // constructor() { }
  constructor(private fullscreenService: FullscreenService, private cookieService: CookieService){}


  async ngOnInit() {
    WebcamUtil.getAvailableVideoInputs()
      .then((mediaDevices: MediaDeviceInfo[]) => {
        this.isCameraExist = mediaDevices && mediaDevices.length > 0;
      });
    //
    this.windowWidth = window.innerWidth;
    this.windowHeight = window.innerHeight;

  }


  @HostListener('window:resize', ['$event'])

  resizeWindow() {
    this.windowWidth = window.innerWidth;
    this.windowHeight = window.innerHeight;
  }

  // constructor(){
  //   interval(1000){
  //     this.getPicture.emit(webcamImage);
  //   }
  // }







  // Take picture stuffs

  takeSnapshot(): void {
    this.trigger.next();
  }

  onOffWebCame() {
    this.showWebcam = !this.showWebcam;
  }

  handleInitError(error: WebcamInitError) {
    this.errors.push(error);
  }

  changeWebCame(directionOrDeviceId: boolean | string) {
    this.nextWebcam.next(directionOrDeviceId);
  }

  handleImage(webcamImage: WebcamImage) {
    this.getPicture.emit(webcamImage);
    // let timer = setInterval(() => this.getPicture.emit(webcamImage), 1000);
    // setTimeout(() => { clearInterval(timer); alert('stop'); }, 10000);
    this.webcamImage = webcamImage;
    this.webcamImages.push(webcamImage)

    this.showWebcam = false;

    this.showOverlay = !this.showOverlay;
    setTimeout(() => {
      this.showOverlay = !this.showOverlay;
    }, 220);
    

    if (this.autoDownload == true) {
      this.ImageClick(webcamImage)
    }
  }

  flashOff(){
    return true
  }
  
  onKeydown(event: any) {
    if (event.key === "Enter") {
      console.log(event);
    }
  }
  

  get triggerObservable(): Observable<void> {
    return this.trigger.asObservable();
  }

  get nextWebcamObservable(): Observable<boolean | string> {
    return this.nextWebcam.asObservable();
  }

  facingMode: string = 'user';  //Set front camera
  allowCameraSwitch = false;
  
  public get videoOptions(): MediaTrackConstraints {
    // https://www.npmjs.com/package/ngx-webcam
    // From above

    //getSettings()

    //you can set ideal,min,max for width and height
    const result: MediaTrackConstraints = {
      width:{min:640,ideal:900,max:this.windowWidth},
      height:{min:480,ideal:1200,max:(this.windowWidth*2/3)},
    };
    
    if (this.facingMode && this.facingMode !== '') {
      result.facingMode = { ideal: this.facingMode };
    }
    return result;
  }



  onToggleFullscreen() {
    this.fullscreenService.toggle();
  }

  is_fullscreen(){
    return document.fullscreenElement != null;
  }

  ImageClick(img: WebcamImage) {
    FileSaver.saveAs(img.imageAsDataUrl, "image.jpg");
  }

  // Cookie utilities

  //https://github.com/salemdar/ngx-cookie#get
  getCookie(key: string){
    return this.cookieService.get(key);
  }

  //https://github.com/salemdar/ngx-cookie#put
  setCookie(key: string, value: Object){
    if (typeof(value)=="boolean"){
      return this.cookieService.put(key,value?'true':'false');
    }
    return this.cookieService.put(key,String(value));
  }

  @HostListener('document:keypress', ['$event'])
  keypress(e: KeyboardEvent) {
      console.log("Key Up! " + e.key);
      if(e.key=='s' || e.key=='S'){
        this.takeSnapshot()
      }else if(e.key=='a' || e.key=='A'){
        this.changeWebCame(true)
      }else if(e.key=='d' || e.key=='D'){
        this.onToggleFullscreen()
      }
  }
}
