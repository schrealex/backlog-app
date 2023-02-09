import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore/lite';

const firebaseConfig = {
  apiKey: 'AIzaSyD_TboWkx93rRsm3A017C3yeaPBlS-1CD8',
  authDomain: 'backlog-app-795c4.firebaseapp.com',
  projectId: 'backlog-app-795c4',
  storageBucket: 'backlog-app-795c4.appspot.com',
  messagingSenderId: '508976850707',
  appId: '1:508976850707:web:bb239c9a2387ebc4159ce6',
  measurementId: 'G-68YQ9JLL95'
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

export { firestore };
// For more information on how to access Firebase in your project,
// see the Firebase documentation: https://firebase.google.com/docs/web/setup#access-firebase
