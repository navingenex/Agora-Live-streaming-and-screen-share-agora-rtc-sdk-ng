import React from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';

var rtc = {
  client: null,
  joined: false,
  published: false,
  localStream: null,
  remoteStreams: [],
  params: {},
};

// Options for joining a channel
var option = {
  appId: '1d8d22987b394e23a9938498b6f28c04',
  channel: 'zainahmed',
  uid: null,
  token: null,
  key: '',
  secret: '',
};
rtc.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'h264' });
async function joinChannel(role) {
  if (rtc.localScreenTrack) leaveScreenShare();
  // Create a client
  const uid = await rtc.client.join(
    option.appId,
    option.channel,
    option.token,
    null
  );
  // Initialize the client
  // Create an audio track from the audio sampled by a microphone.

  console.log('publish success!');
  if (role === 'host') {
    rtc.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    // Create a video track from the video captured by a camera.
    rtc.localVideoTrack = await AgoraRTC.createCameraVideoTrack();

    // Publish the local audio and video tracks to the channel.
    // Dynamically create a container in the form of a DIV element for playing the remote video track.

    // Specify the ID of the DIV container. You can use the `uid` of the remote user.
    await rtc.client.publish([rtc.localAudioTrack, rtc.localVideoTrack]);
    // const playerContainer = document.getElementById('local_stream');
    const el = document.createElement('div');
    el.id = 'local_stream';
    el.style.width = '400px';
    el.style.height = '400px';
    document.body.append(el);
    // Play the remote video track.
    // Pass the DIV container and the SDK dynamically creates a player in the container for playing the remote video track.
    rtc.localVideoTrack.play(el);
  }
  if (role === 'audience') {
    rtc.client.on('connection-state-change', function (evt) {
      console.log('audience', evt);
    });

    rtc.client.on('stream-added', function (evt) {
      var remoteStream = evt.stream;
      var id = remoteStream.getId();
      if (id !== rtc.params.uid) {
        rtc.client.subscribe(remoteStream, function (err) {
          console.log('stream subscribe failed', err);
        });
      }
      console.log('stream-added remote-uid: ', id);
    });

    rtc.client.on('stream-removed', function (evt) {
      var remoteStream = evt.stream;
      var id = remoteStream.getId();
      console.log('stream-removed remote-uid: ', id);
    });

    rtc.client.on('stream-subscribed', function (evt) {
      var remoteStream = evt.stream;
      var id = remoteStream.getId();
      remoteStream.play('remote_video_');
      console.log('stream-subscribed remote-uid: ', id);
    });

    rtc.client.on('stream-unsubscribed', function (evt) {
      var remoteStream = evt.stream;
      var id = remoteStream.getId();
      remoteStream.pause('remote_video_');
      console.log('stream-unsubscribed remote-uid: ', id);
    });
  }
  rtc.client.on('user-published', async (user, mediaType) => {
    // Subscribe to a remote user.
    await rtc.client.subscribe(user, mediaType);
    console.log('subscribe success');

    // If the subscribed track is video.
    if (mediaType === 'video') {
      // Get `RemoteVideoTrack` in the `user` object.
      const remoteVideoTrack = user.videoTrack;
      // Dynamically create a container in the form of a DIV element for playing the remote video track.

      // Specify the ID of the DIV container. You can use the `uid` of the remote user.
      // const playerContainer = document.getElementById('remote_video_');
      const el = document.createElement('div');
      el.id = 'remote_video_';
      el.style.width = '400px';
      el.style.height = '400px';
      document.body.append(el);
      // Play the remote video track.
      // Pass the DIV container and the SDK dynamically creates a player in the container for playing the remote video track.
      remoteVideoTrack.play(el);

      // Or just pass the ID of the DIV container.
      // remoteVideoTrack.play(playerContainer.id);
    }

    // If the subscribed track is audio.
    if (mediaType === 'audio') {
      // Get `RemoteAudioTrack` in the `user` object.
      const remoteAudioTrack = user.audioTrack;
      // Play the audio track. No need to pass any DOM element.
      remoteAudioTrack.play();
    }
  });
  rtc.client.on('user-unpublished', (user) => {
    // Get the dynamically created DIV container.
    const playerContainer = document.getElementById('remote_video_');
    if (playerContainer) playerContainer.remove();
    // location.reload();
    // Destroy the container.
  });
}

async function shareScreen() {
  if (rtc.localAudioTrack) leaveEventHost('host');
  const uid = await rtc.client.join(
    option.appId,
    option.channel,
    option.token,
    null
  );
  rtc.localScreenTrack = await AgoraRTC.createScreenVideoTrack({
    // Set the encoder configurations. For details, see the API description.
    encoderConfig: '1080p_1',
  });
  await rtc.client.publish([rtc.localScreenTrack]);

  const el = document.createElement('div');
  el.id = 'local_stream';
  el.style.width = '400px';
  el.style.height = '400px';
  document.body.append(el);
  rtc.localScreenTrack.play(el);
}

function mute() {
  if (rtc.localAudioTrack.enabled) rtc.localAudioTrack.setEnabled(false);
  else rtc.localAudioTrack.setEnabled(true);
}
function unmute() {
  if (rtc.localVideoTrack.enabled) rtc.localVideoTrack.setEnabled(false);
  else rtc.localVideoTrack.setEnabled(true);
}
function leaveScreenShare(params) {
  rtc.localScreenTrack.close();
  rtc.client.unpublish(rtc.localScreenTrack, function (err) {
    console.log('publish failed');
    console.error(err);
  });

  rtc.client.leave(function (ev) {
    console.log(ev);
  });
  const playerContainer = document.getElementById('local_stream');
  if (playerContainer) playerContainer.remove();
}
function leaveEventHost(params) {
  rtc.localAudioTrack.close();
  rtc.localVideoTrack.close();
  rtc.client.unpublish(rtc.localAudioTrack, function (err) {
    console.log('publish failed');
    console.error(err);
  });

  rtc.client.leave(function (ev) {
    console.log(ev);
  });
  const playerContainer = document.getElementById('local_stream');
  if (playerContainer) playerContainer.remove();
}

function leaveEventAudience(params) {
  rtc.client.leave(
    function () {
      console.log('client leaves channel');
      //……
    },
    function (err) {
      console.log('client leave failed ', err);
      //error handling
    }
  );
}

function LiveVideoStreaming(props) {
  return (
    <div>
      <button onClick={() => joinChannel('host')}>Join Channel as Host</button>
      <button onClick={() => joinChannel('audience')}>
        Join Channel as Audience
      </button>
      <button onClick={() => leaveEventHost('host')}>Leave Event Host</button>
      <button onClick={() => leaveEventAudience('audience')}>
        Leave Event Audience
      </button>
      <button onClick={() => shareScreen()}>Share screen</button>
      <button onClick={() => leaveScreenShare()}>Stop screen share</button>

      <button onClick={() => mute()}>mute</button>
      <button onClick={() => unmute()}>unmute</button>
      {/* <div
        id="local_stream"
        className="local_stream"
        style={{ width: '400px', height: '400px' }}
      ></div> */}
      {/* <div id="remote_video_" style={{ width: '400px', height: '400px' }} /> */}
    </div>
  );
}

export default LiveVideoStreaming;
