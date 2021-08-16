import { Component, OnInit } from '@angular/core';
import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'mabowClubStudent';

  channel: string;
  uid: string;

  rtc: { client: IAgoraRTCClient, localAudioTrack: IMicrophoneAudioTrack, localVideoTrack: ICameraVideoTrack } = {
    // 用来放置本地客户端。
    client: null,
    // 用来放置本地音视频频轨道对象。
    localAudioTrack: null,
    localVideoTrack: null,
  };

  options = {
    // 替换成你自己项目的 App ID。
    appId: '6c56c8e6e5bc4dc88ebe943602bb0aef',
    // 传入目标频道名。
    channel: 'testJames',
    // 如果你的项目开启了 App 证书进行 Token 鉴权，这里填写生成的 Token 值。
    token: null,
  };

  ngOnInit(): void {

  }

  async startBasicCall() {
    this.rtc.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    console.log(this.channel, this.uid);

    const uid = await this.rtc.client.join(this.options.appId, this.channel || this.options.channel, this.options.token, this.uid);

    // 通过麦克风采集的音频创建本地音频轨道对象。
    this.rtc.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    // 通过摄像头采集的视频创建本地视频轨道对象。
    this.rtc.localVideoTrack = await AgoraRTC.createCameraVideoTrack();
    // 将这些音视频轨道对象发布到频道中。
    await this.rtc.client.publish([this.rtc.localAudioTrack, this.rtc.localVideoTrack]);

    console.log('publish success!');

    this.rtc.client.on('user-published', async (user, mediaType) => {
      // 开始订阅远端用户。
      await this.rtc.client.subscribe(user, mediaType);
      console.log('subscribe success');

      // 表示本次订阅的是视频。
      if (mediaType === 'video') {
        // 订阅完成后，从 `user` 中获取远端视频轨道对象。
        const remoteVideoTrack = user.videoTrack;
        // 动态插入一个 DIV 节点作为播放远端视频轨道的容器。
        const playerContainer = document.createElement('div');
        // 给这个 DIV 节点指定一个 ID，这里指定的是远端用户的 UID。
        playerContainer.id = user.uid.toString();
        playerContainer.style.width = '133px';
        playerContainer.style.height = '100px';
        document.body.append(playerContainer);

        // 订阅完成，播放远端音视频。
        // 传入 DIV 节点，让 SDK 在这个节点下创建相应的播放器播放远端视频。
        remoteVideoTrack.play(playerContainer);

        // 也可以只传入该 DIV 节点的 ID。
        // remoteVideoTrack.play(playerContainer.id);
      }

      // 表示本次订阅的是音频。
      if (mediaType === 'audio') {
        // 订阅完成后，从 `user` 中获取远端音频轨道对象。
        const remoteAudioTrack = user.audioTrack;
        // 播放音频因为不会有画面，不需要提供 DOM 元素的信息。
        remoteAudioTrack.play();
      }
    });
    this.rtc.client.on('user-unpublished', (user, mediaType) => {
      if (mediaType === 'video') {
        // 获取刚刚动态创建的 DIV 节点。
        const playerContainer = document.getElementById(user.uid.toString());
        // 销毁这个节点。
        playerContainer.remove();
      }
    });
  }

  async publishVideo() {
    await this.rtc.client.publish(this.rtc.localVideoTrack);
  }

  async unpublishVideo() {
    await this.rtc.client.unpublish(this.rtc.localVideoTrack);
  }

  async publishAudio() {
    await this.rtc.client.publish(this.rtc.localAudioTrack);
  }

  async unpublishAudio() {
    await this.rtc.client.unpublish(this.rtc.localAudioTrack);
  }



  async leaveChannel() {
    // 销毁本地音视频轨道。
    this.rtc.localAudioTrack.close();
    this.rtc.localVideoTrack.close();

    // 遍历远端用户。
    this.rtc.client.remoteUsers.forEach(user => {
      // 销毁动态创建的 DIV 节点。
      const playerContainer = document.getElementById(user.uid + '');
      playerContainer && playerContainer.remove();


    });

    await this.rtc.client.leave();
  }
}
