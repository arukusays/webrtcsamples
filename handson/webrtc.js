'use strict';
const localVideo = document.getElementById('local_video');
let localStream;

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