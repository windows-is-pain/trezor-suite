import { ipcMain } from 'electron';

import { IpcProxyHandlerOptions, createIpcProxyHandler } from '@trezor/ipc-proxy';
import { getFreePort } from '@trezor/node-utils';
import { BluetoothIpc, BluetoothIpcApi, BluetoothTransport } from '@trezor/transport-bluetooth';

import { BluetoothProcess } from '../libs/processes/BluetoothProcess';

import type { ModuleInit } from './index';

export const SERVICE_NAME = '@trezor/transport-bluetooth';

// Export module state and use it trezor-connect module to override init + setTransports params
// getTransport function is reassigned in onLoad, onQuit
export const bluetoothModule: {
    getTransport: () => BluetoothTransport | undefined;
} = {
    getTransport: () => undefined,
};

export const init: ModuleInit = () => {
    const { logger } = global;

    let bluetoothProcess: BluetoothProcess | undefined;

    const getBluetoothProcess = async () => {
        if (!bluetoothProcess) {
            // TODO: for debug purposes
            const port = await getFreePort().then(_p => 21327);
            bluetoothProcess = new BluetoothProcess(port);
        }

        return bluetoothProcess;
    };

    const killBluetoothProcess = () => {
        if (bluetoothProcess) {
            bluetoothProcess.stop();
            bluetoothProcess = undefined;
        }
    };

    const getBluetoothTransport = () =>
        bluetoothProcess
            ? new BluetoothTransport({
                  id: 'BluetoothTransport',
                  url: bluetoothProcess.getUrl(),
                  logger: logger as any,
                  messages: {}, // will be added later, in connect
              })
            : undefined;

    const proxyOptions: IpcProxyHandlerOptions<BluetoothIpcApi> = {
        onCreateInstance() {
            // TODO: logger type
            const api = new BluetoothIpc({
                // @ts-expect-error TODO: what if bluetoothProcess is missing
                url: bluetoothProcess?.getUrl(),
                logger: logger as any,
            });

            return {
                onRequest: (method, params) => {
                    if (method === 'init') {
                        console.warn('Init binary!!!', params);
                    }
                    if (method === 'dispose') {
                        console.warn('Dispose binary!!!');
                    }
                    logger.debug(SERVICE_NAME, `call ${method}`);

                    return (api[method] as any)(...params);
                },
                onAddListener: (eventName, listener) => {
                    logger.debug(SERVICE_NAME, `add listener ${eventName}`);

                    return api.on(eventName, listener);
                },
                onRemoveListener: (eventName: any) => {
                    logger.debug(SERVICE_NAME, `remove listener ${eventName}`);

                    return api.removeAllListeners(eventName);
                },
            };
        },
    };

    const unregisterProxy = createIpcProxyHandler(ipcMain, 'Bluetooth', proxyOptions);

    const onLoad = async () => {
        const btProcess = await getBluetoothProcess();
        await btProcess.start();

        bluetoothModule.getTransport = getBluetoothTransport;
    };

    const onQuit = () => {
        logger.info(SERVICE_NAME, 'Stopping (app quit)');
        unregisterProxy();
        killBluetoothProcess();

        bluetoothModule.getTransport = () => undefined;
    };

    return { onLoad, onQuit };
};
