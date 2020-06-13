'use strict';

import TwitchOAuth from './src/twitch-oauth';

import express from 'express';
import crypto from 'crypto';

if (module === require.main) {
	require('dotenv').config();
	

    const app = express();

    const buffer = crypto.randomBytes(16);
    const state = buffer.toString('hex');

    const twitchOAuth = new TwitchOAuth({
        client_id: process.env.CLIENT_ID || '',
        client_secret: process.env.CLIENT_SECRET || '',
        redirect_uri: process.env.REDIRECT_URI || '',
        scopes: [
            'user:edit:broadcast',
            'viewing_activity_read'
        ]
    }, state);

    app.get('/', (_req, res) => {
        res.status(200).send(`<a href="/authorize">Authorize</a>`);
    });

    app.get('/home', (_req, res) => {
        res.status(200).send(`<a href="/test">Test</a>`);
    });

    app.get('/test', (_req, res) => {
        const url: string = `https://api.twitch.tv/helix/users/extensions?user_id=${101223367}`;
        twitchOAuth.getEndpoint(url)
            .then(json => res.status(200).json(json))
            .catch(err => console.error(err));
    });

    app.get('/authorize', (_req, res) => {
        res.redirect(twitchOAuth.authorizeUrl);
    });

    app.get('/auth-callback', (req, res) => {
        const code: string = req.query.code as string;
        const state: string = req.query.state as string;

        if (twitchOAuth.confirmState(state) === true) {
            twitchOAuth.fetchToken(code).then(json => {
                if (json.refresh_token) {
                    console.log('Authenticated');
                    res.redirect('/home');
                } else {
                    res.redirect('/token-failed');
                }
            }).catch(err => console.error(err));
        } else {
            res.redirect('/state-failed');
        }
    });

    app.listen(process.env.PORT || 4000, () => {
        console.log(`App listening on port ${process.env.PORT || 4000}`);

        const open = require('open');
        open(twitchOAuth.authorizeUrl);
    });
}

export default TwitchOAuth;
