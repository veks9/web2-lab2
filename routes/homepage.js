import express, { Router } from 'express';
import libxmljs from 'libxmljs';
import xml2js from 'xml2js'
import User from '../models/user.js';
import bcrypt from 'bcrypt'

var parseString = xml2js.parseString;

const router = express.Router();

router.get("/", (req, res) => {
    res.render("index")
})

var user = null
router.post("/dataExposure", async function(req, res) {
    user = null
    try {
        user = { 
            username: req.body.username,
            password: req.body.password,
            passwordHash: bcrypt.hashSync(req.body.password, 10)
        }

        const existingUser = await User.findOne({ email: user.email });
        if(!existingUser) {
            await User.create(user, function(err) {
                if(err) {
                    console.log(err);
                    res.status(500).send();
                }
            });
        } else {
            await User.replaceOne({email: user.email}, user)
        }
    } catch (error) {
        console.log(error)
    }

    if(req.body.security) {
        const fetchedUser = await User.findOne({username: req.body.username})
        user = {
            username: fetchedUser.username,
            password: fetchedUser.passwordHash
        }
    } else {
        const fetchedUser = await User.findOne({username: req.body.username})
        user = {
            username: fetchedUser.username,
            password: fetchedUser.password
        }
    }
    res.render("sde", {user: JSON.stringify(user)});
})

router.get("/dataExposure", (req, res) => {
    res.render("sde", {user: null});

})

var text = null;
router.post('/load_xml', async function (req, res) {
    text = null;
    try {
        const xml = req.body.xml;
        const security = req.body.security ? false : true
        const doc = libxmljs.parseXml(xml, {noent: security});
        text = `<script>${doc.get('//script').text()}</script>`
        res.redirect('/load_xml');
    } catch (err) {
        res.status(200).send("Attack is prevented, node with external entity is deleted");
    }
});

router.get('/load_xml', async function (req, res) {
   res.render("xxe", { text: text });
});

router.get("/deser", (req, res) => {
    res.render("deser");
});

export default router;