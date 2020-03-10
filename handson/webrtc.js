'use strict';
const localVideo = document.getElementById('local_video');
const remoteVideo = document.getElementById('remote_video');
const textForSendSdp = document.getElementById('text_for_send_sdp');
const textForReceiveSdp = document.getElementById('text_for_receive_sdp');
let localStream;
let peerConnection;
let negotiationneededCounter=0;

async function startVideo(){
    try {
        localStream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
        playVideo(localVideo, localStream);
    } catch (error){
        console.log('error on getUserMedia.', error);
    }
}

async function playVideo(element, stream){
    element.srcObject = stream;
    try {
        await element.play();
    } catch (error){
        console.log('error auto play. ', error);
    }
}

// Connectボタンが押されたらWebRTCのOffer処理を開始
function connect() {
    if (!peerConnection) {
        console.log('make Offer');
        peerConnection = prepareNewConnection(true);
    } else {
        console.warn('peer already exist.');
    }
}

function prepareNewConnection(isOffer) {
    const pc_config = {"iceServers":[ {"urls":"stun:stun.webrtc.ecl.ntt.com:3478"} ]};
    const peer = new RTCPeerConnection(pc_config);

    // リモートのMediaStreamTrackを受信した時
    peer.ontrack = event => {
        console.log('-- peer.ontrack() --');
        playVideo(remoteVideo, event.streams[0]);
    };

    // ICE Candidateを収集した時のイベント
    peer.onicecandidate = event => {
        if (event.candidate) {
            console.log()
        } else {
            console.log('empty ice event.');
            sendSdp(peer.localDescription);
        }
    };

    // Offer側でネゴシエーションが必要になった時の処理
    peer.onnegotiationneeded = async () => {
        try {
            if(isOffer){
                if(negotiationneededCounter === 0){
                    let offer = await peer.createOffer();
                    console.log('createOffer() success in promise.');
                    await peer.setLocalDescription(offer);
                    console.log('setLocalDescription success in promise.');
                    sendSdp(peer.localDescription);
                    negotiationneededCounter++;
                }
            }
        } catch(err){
            console.error('setLocalDescription(offer) ERROR: ', err);
        }
    };

    peer.oniceconnectionstatechange = function() {
        console.log('ICE connection Status has changed to ' + peer.iceConnectionState);
        switch(peer.iceConnectionState) {
            case 'closed':
            case 'failed':
                if(peerConnection){
                    hangUp();
                }
                break;
            case 'disconnected':
                break;
        }
    };

    // ローカルのMediaStreamを利用できるようにする
    if (localStream) {
        console.log('Adding local stream...');
        localStream.getTracks().forEach(track => peer.addTrack(track, localStream));
    } else {
        console.warn('no local stream, but continue.');
    }

    return peer;

}

// 手動シグナリングのための処理を追加する
function sendSdp(sessionDescription){
    console.log('--- sending sdp ---');
    textForSendSdp.value = sessionDescription.sdp;
    textForSendSdp.focus();
    textForSendSdp.select();
}

// Answer SDPを生成する
async function makeAnswer() {
    console.log('sending Answer. Creating remote session description...');
    if(!peerConnection){
        console.error('peerConnection NOT exist!!');
        return;
    }
    try {
        let answer = await peerConnection.createAnswer();
        console.log('createAnswer() success in promise.');
        await peerConnection.setLocalDescription(answer);
        console.log('setLocalDescription() success in promise.');
        sendSdp(peerConnection.localDescription);
    } catch(err) {
        console.error(err);
    }
}

// Receive remote SDPボタンが押されたらOffer側とAnswer側で処理を分岐
function onSdpText() {
    const text = textForReceiveSdp.value;
    if (peerConnection){
        console.log('Received answer text...');
        const answer = new RTCSessionDescription({
            type: 'answer',
            sdp: text,
        });
        setAnswer(answer);
    } else {
        console.log('Received offer text...');
        const offer = new RTCSessionDescription({
            type: 'offer',
            sdp: text,
        });
        setOffer(offer);
    }
    textForReceiveSdp.value='';
}

// Offer側のSDPをセットする処理
async function setOffer(sessionDescription){
    if(peerConnection){
        console.error('peerConnection already exist!!');
        // FIXME returnする？
    }
    peerConnection = prepareNewConnection(false);
    try {
        await peerConnection.setRemoteDescription(sessionDescription);
        console.log('setRemoteDescription(answer) success in promise.');
        makeAnswer();
    } catch(err) {
        console.error('setRemoteDescription(offer) ERROR: ', err);
    }
}

// Answer側のSDPをセットする処理
async function setAnswer(sessionDescription){
    if(!peerConnection){
        console.error('peerConnection NOT exist!!');
        return;
    }
    try {
        await peerConnection.setRemoteDescription(sessionDescription);
        console.log('setRemoteDescription(answer) success in promise.');
    } catch(err) {
        console.error('setRemoteDescription(answer) ERROR: ', err);
    }

}

// P2P通信を切断する
function hangUp() {
    if (peerConnection) {
        if(peerConnection.iceConnectionState !== 'closed') {
            peerConnection.close();
            peerConnection = null;
            negotiationneededCounter = 0;
            cleanupVideoElement(remoteVideo);
            textForSendSdp = '';
            return;
        }
    }
    console.log('peerConnection is closed.');
}

// ビデオエレメントを初期化する
function cleanupVideoElement(element){
    element.pause();
    element.srcObject = null;
}