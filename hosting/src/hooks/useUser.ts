import {useContext, useEffect, useRef, useState} from 'react';
import firebase from 'firebase/app';
import liff from '@line/liff';
import axios from 'axios';
import { auth } from '../configs/firebaseApp';

const liffId = 'XXXXX';

export const useUser = () => {
  const [user, setUser] = useState<firebase.User | null>(null);

  useEffect(() => {
    let unmount = false;

    const unSub = auth.onAuthStateChanged(async authUser => {
      await liff.init({ liffId });
      if (!liff.isLoggedIn()) {
        await liff.login()
        return
      }

      if (authUser && !unmount) {
        setUser(authUser)
        return
      }

      const accessToken = liff.getAccessToken();
      if (!accessToken) return;

      const result = await axios.post('/login', { accessToken });
      if (result.data.error) {
        console.error('functions error', result.data.error);
        return
      }

      const res = await auth!.signInWithCustomToken(result.data.token);
      if (!unmount) setUser(res.user);
    })

    return () => {
      unmount = true;
      unSub();
    }
  }, []);

  return [user] as const;
}
