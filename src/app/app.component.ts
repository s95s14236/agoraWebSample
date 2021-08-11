import { Component, OnInit } from '@angular/core';
import AgoraRTC from 'agora-rtc-sdk-ng';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'mabowClubStudent';

  uid: string;

  rtc = {
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
    const uid = await this.rtc.client.join(this.options.appId, this.options.channel, this.options.token, this.uid);

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
        playerContainer.style.width = '640px';
        playerContainer.style.height = '480px';
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
  }

  publishVideo() {
    this.rtc.client.publish(this.rtc.localVideoTrack);
  }

  unpublishVideo() {
    this.rtc.client.unpublish(this.rtc.localVideoTrack);
  }



  leaveChannel() {
    this.rtc.client.leave();
  }
}
