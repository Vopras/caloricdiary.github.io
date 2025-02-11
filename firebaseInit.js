// firebaseInit.js, adjusted for direct script inclusion
var firebaseConfig = {
    apiKey: "AIzaSyCpOgv2YnqzEXDg18YDU0tTo2_MYVc9J8A",
    authDomain: "caloric-3c47e.firebaseapp.com",
    projectId: "caloric-3c47e",
    storageBucket: "caloric-3c47e.appspot.com",
    messagingSenderId: "78697964271",
    appId: "1:78697964271:web:5a5fd50e62f76fa1f3711a",
    measurementId: "G-0FZCKDCL97"
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  var db = firebase.firestore();
  
  window.db = db;
