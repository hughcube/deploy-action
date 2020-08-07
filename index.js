const tc = require('@actions/tool-cache');
const core = require('@actions/core');
const exec = require('@actions/exec');
const os = require('os');
const fs = require('fs');
const path = require('path');

const PLATFORM = os.platform();

const RSYNC_NAME = "cwrsync";
const RSYNC_VERSION = "5.5.0";
const RSYNC_ARCH = "x86_free";

/**
 * 获取当前用户
 *
 * @returns {string}
 */
const getOsUser = () => {
    const userInfo = os.userInfo();

    if (!userInfo.username) {
        throw new Error("Unable to obtain os user");
    }

    return userInfo.username;
};

/**
 * 获取当前用户的home目录
 * @returns string
 */
const getUserHomeDir = () => {
    let homeDir = process.env.HOME || process.env.USERPROFILE

    if ('win32' === PLATFORM) {
        //const userName = getOsUser();
        //homeDir = `/home/${userName}`;
    }

    return path.normalize(homeDir);
};

/**
 * 获取用户ssh的目录
 * @returns string
 */
const getUserSshDir = () => {
    const homeDir = getUserHomeDir();

    return path.normalize(`${homeDir}/.ssh`);
};

/**
 * 创建目录
 * @param dir string
 */
const mkdirSync = (dir) => {
    const tmpDir = path.dirname(dir);
    if (!fs.existsSync(tmpDir)) {
        mkdirSync(tmpDir);
    }

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }

    if (!fs.existsSync(dir)) {
        throw new Error(`Directory ${dir} creation failed`);
    }
};

/**
 * 写入ssh文件
 *
 * @returns {Promise<void>}
 */
const writeSshFiles = async () => {
    const sshPath = getUserSshDir();
    const knownHostFile = path.normalize(`${sshPath}/known_hosts`);
    const privateKeyFile = path.normalize(`${sshPath}/id_rsa`);
    const publicKeyFile = path.normalize(`${privateKeyFile}.pub`);
    const configFile = path.normalize(`${sshPath}/config`);

    console.log(`write ssh file ${sshPath}`)

    mkdirSync(sshPath);
    fs.writeFileSync(knownHostFile, "");
    fs.writeFileSync(privateKeyFile, "");
    fs.writeFileSync(publicKeyFile, "");
    fs.writeFileSync(configFile, "Host *\n    StrictHostKeyChecking no");

    fs.chmodSync(sshPath, 0o700);
    fs.chmodSync(knownHostFile, 0o600);
    fs.chmodSync(privateKeyFile, 0o600);
    fs.chmodSync(publicKeyFile, 0o600);

    const privateKey = core.getInput("ssh_private_key");
    if (privateKey && 0 < privateKey.length) {
        fs.writeFileSync(privateKeyFile, privateKey + "\n");

        // let publicKey = ''
        // const options = {};
        // options.listeners = {
        //     stdout: (data) => {
        //         publicKey += data.toString();
        //     },
        //     stderr: (data) => {
        //         console.log(data.toString());
        //     }
        // };
        // await exec.exec(`ssh-keygen -f ${privateKeyFile} -y >> ${publicKeyFile}`, [], options);
    }
}

const winInstall = async () => {
    const url = `https://itefix.net/dl/free-software/${RSYNC_NAME}_${RSYNC_VERSION}_${RSYNC_ARCH}.zip`;

    console.log(url);

    const downloadPath = await tc.downloadTool(url);
    const extractPath = await tc.extractZip(downloadPath)

    const binPath = path.normalize(`${extractPath}/${RSYNC_NAME}_${RSYNC_VERSION}_${RSYNC_ARCH}/bin`);

    for (const name of ["rsync", "ssh-keygen", "ssh"]) {
        fs.copyFileSync(path.normalize(`${binPath}/${name}.exe`), path.normalize(`${binPath}/${name}`))
    }

    const cachedPath = await tc.cacheDir(binPath, RSYNC_NAME, RSYNC_VERSION);
    await core.addPath(cachedPath);
}

const macOSInstall = async () => {
    await exec.exec("brew", ["install", "rsync"]);
}

const linuxInstall = async () => {
    await exec.exec("sudo", ["apt-get", "install", "-y", "rsync"]);
}

const run = async () => {
    if ('linux' === PLATFORM) {
        linuxInstall();
    } else if ('darwin' === PLATFORM) {
        macOSInstall();
    } else if ('win32' === PLATFORM) {
        winInstall();
    } else {
        throw new Error(`Unexpected OS ${PLATFORM}`);
    }

    writeSshFiles();
}

run().catch(function (e) {
    core.setFailed(`Action failed with error: ${e}`);
});
