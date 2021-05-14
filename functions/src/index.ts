import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import axios from 'axios';

// サービス アカウント JSON ファイル
import serviceAccount from './config/serviceAccountKey.json';

const channelId = 'XXXX';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

const axiosInstance = axios.create({
  baseURL: 'https://api.line.me',
  responseType: 'json',
});

const verifyToken = async (accessToken: string) => {
  const response = await axiosInstance.get('/oauth2/v2.1/verify', {
    params: { access_token: accessToken },
  });

  if (response.status !== 200) {
    console.error(response.data.error_description);
    throw new Error(response.data.error);
  }

  if (response.data.client_id !== channelId) {
    throw new Error('client_id does not match.');
  }

  if (response.data.expires_in < 0) {
    throw new Error('access token is expired.');
  }
};

const getProfile = async (accessToken: string) => {
  const response = await axiosInstance.get('/v2/profile', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    data: {},
  });

  if (response.status !== 200) {
    console.error(response.data.error_description);
    throw new Error(response.data.error);
  }

  return response.data;
};

exports.loginUsCentral = functions
  .region('us-central1')
  .https.onRequest(async (req, res) => {
    const { accessToken } = req.body;

    if (!accessToken) {
        res.status(500).send({ error: 'invalid access' });
        return;
    }

    try {
      await verifyToken(accessToken);
      const profile = await getProfile(accessToken);
      const token = await admin.auth().createCustomToken(profile.userId);

      res.send({ token });
    } catch (e) {
      console.error(JSON.stringify(e, null, '  '));

      res.status(500).send({ error: e.message });
    }
  });
