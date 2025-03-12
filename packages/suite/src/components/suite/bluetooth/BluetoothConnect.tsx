import { useCallback, useEffect, useState } from 'react';

import {
    bluetoothActions,
    prepareSelectAllDevices,
    selectAdapterStatus,
    selectKnownDevices,
    selectScanStatus,
} from '@suite-common/bluetooth';
import { Card, Column, ElevationUp } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { BluetoothDevice } from '@trezor/transport-bluetooth';
import { TimerId } from '@trezor/type-utils';

import { BluetoothDeviceList } from './BluetoothDeviceList';
import { BluetoothPairingPin } from './BluetoothPairingPin';
import { BluetoothScanFooter } from './BluetoothScanFooter';
import { BluetoothScanHeader } from './BluetoothScanHeader';
import { BluetoothSelectedDevice } from './BluetoothSelectedDevice';
import { BluetoothTips } from './BluetoothTips';
import { BluetoothNotEnabled } from './errors/BluetoothNotEnabled';
import { BluetoothVersionNotCompatible } from './errors/BluetoothVersionNotCompatible';
import { bluetoothConnectDeviceThunk } from '../../../actions/bluetooth/bluetoothConnectDeviceThunk';
import { bluetoothDisconnectDeviceThunk } from '../../../actions/bluetooth/bluetoothDisconnectDeviceThunk';
import { bluetoothStartScanningThunk } from '../../../actions/bluetooth/bluetoothStartScanningThunk';
import { bluetoothStopScanningThunk } from '../../../actions/bluetooth/bluetoothStopScanningThunk';
import { closeModalApp } from '../../../actions/suite/routerActions';
import { useDispatch, useSelector } from '../../../hooks/suite';

const SCAN_TIMEOUT = 30_000;
const UNPAIRED_DEVICES_LAST_UPDATED_LIMIT_SECONDS = 30;

type BluetoothConnectProps = {
    onClose: () => void;
    uiMode: 'spatial' | 'card';
};

const selectAllDevices = prepareSelectAllDevices<BluetoothDevice>();

export const BluetoothConnect = ({ onClose, uiMode }: BluetoothConnectProps) => {
    const dispatch = useDispatch();

    const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
    const [scannerTimerId, setScannerTimerId] = useState<TimerId | null>(null);

    const bluetoothAdapterStatus = useSelector(selectAdapterStatus);
    const scanStatus = useSelector(selectScanStatus);
    const allDevices = useSelector(selectAllDevices);
    const knownDevices = useSelector(selectKnownDevices);

    const lasUpdatedBoundaryTimestamp =
        Date.now() / 1000 - UNPAIRED_DEVICES_LAST_UPDATED_LIMIT_SECONDS;

    console.log('allDevices', allDevices);
    console.log('selectedDeviceId', selectedDeviceId);

    const devices = allDevices.filter(it => {
        const isDeviceUnresponsiveForTooLong =
            it.lastUpdatedTimestamp < lasUpdatedBoundaryTimestamp;

        if (isDeviceUnresponsiveForTooLong) {
            // If device is connected or paired (it may have been paired in the OS system directly)
            // => do not filter it based isDeviceUnresponsiveForTooLong

            return (
                it.connected ||
                it.paired ||
                knownDevices.find(knownDevice => knownDevice.id === it.id) !== undefined
            );
        }

        return true;
    });

    const selectedDevice =
        selectedDeviceId !== null
            ? devices.find(device => device.id === selectedDeviceId)
            : undefined;

    useEffect(() => {
        dispatch(bluetoothStartScanningThunk());

        return () => {
            dispatch(bluetoothStopScanningThunk());
        };
    }, [dispatch]);

    const clearScamTimer = useCallback(() => {
        if (scannerTimerId !== null) {
            clearTimeout(scannerTimerId);
        }
    }, [scannerTimerId]);

    useEffect(() => {
        // Intentionally no `clearScamTimer`, this is first run and if we use this we would create infinite re-render
        const timerId = setTimeout(() => {
            dispatch(bluetoothActions.scanStatusAction({ status: 'idle' }));
        }, SCAN_TIMEOUT);

        setScannerTimerId(timerId);
    }, [dispatch]);

    const onReScanClick = () => {
        setSelectedDeviceId(null);
        dispatch(bluetoothActions.scanStatusAction({ status: 'running' }));

        clearScamTimer();
        const timerId = setTimeout(() => {
            dispatch(bluetoothActions.scanStatusAction({ status: 'idle' }));
        }, SCAN_TIMEOUT);
        setScannerTimerId(timerId);
    };

    if (bluetoothAdapterStatus === 'disabled') {
        return (
            <Column gap={spacings.sm} flex="1">
                <Card paddingType="none">
                    <Column
                        gap={spacings.md}
                        margin={{ vertical: spacings.xxs, horizontal: spacings.xxs }}
                        alignItems="stretch"
                    >
                        <BluetoothScanHeader
                            isScanning={false}
                            onClose={onClose}
                            numberOfDevices={devices.length}
                        />
                        <BluetoothNotEnabled />
                    </Column>
                </Card>
            </Column>
        );
        // return <BluetoothNotEnabled onCancel={onClose} />;
    }

    // Todo: incompatible version
    const isVersionNotCompatible = false;
    if (isVersionNotCompatible) {
        return <BluetoothVersionNotCompatible onCancel={onClose} />;
    }

    console.log('selectedDevice', selectedDevice);

    // This is fake, we scan for devices all the time
    const isScanning = scanStatus === 'running';
    const scanFailed = devices.length === 0 && scanStatus === 'idle';

    const handlePairingCancel = async (deviceId: string) => {
        await dispatch(bluetoothDisconnectDeviceThunk({ id: deviceId }));
        setSelectedDeviceId(null);
        onReScanClick();
    };

    if (
        selectedDevice !== undefined &&
        selectedDevice !== null &&
        selectedDevice.connectionStatus.type === 'pairing' &&
        (selectedDevice.connectionStatus?.pin?.length ?? 0) > 0
    ) {
        return (
            <BluetoothPairingPin
                device={selectedDevice}
                pairingPin={selectedDevice.connectionStatus.pin}
                onCancel={handlePairingCancel}
            />
        );
    }

    if (selectedDevice !== undefined) {
        return (
            <BluetoothSelectedDevice
                device={selectedDevice}
                onReScanClick={onReScanClick}
                onCancel={handlePairingCancel}
            />
        );
    }

    const onConnect = async (deviceId: string) => {
        console.log('___calling: onConnect(deviceId)', deviceId);
        setSelectedDeviceId(deviceId);
        const result = await dispatch(bluetoothConnectDeviceThunk({ id: deviceId })).unwrap();

        if (result.success) {
            if (uiMode === 'card') {
                console.log('_____onConnect(deviceId) success, calling: closeModalApp()');
                dispatch(closeModalApp());
            } else {
                console.log('_____onConnect(deviceId) success, calling: onClose()');
                onClose();
            }
        }

        if (!result.success) {
            console.log('_____onConnect(deviceId) failed, calling: handlePairingCancel()');
            await handlePairingCancel(deviceId);
        }
    };

    const content = scanFailed ? (
        <BluetoothTips onReScanClick={onReScanClick} header="Check tips & try again" />
    ) : (
        <BluetoothDeviceList
            isDisabled={false}
            onConnect={onConnect}
            onError={handlePairingCancel}
            deviceList={devices}
            isScanning={isScanning}
        />
    );

    return (
        <Column gap={spacings.sm} flex="1">
            <Card paddingType="none">
                <Column
                    gap={spacings.md}
                    margin={{ vertical: spacings.xxs, horizontal: spacings.xxs }}
                    alignItems="stretch"
                >
                    <BluetoothScanHeader
                        isScanning={isScanning}
                        onClose={onClose}
                        numberOfDevices={devices.length}
                    />

                    {/* Here we need to do +1 in elevation because of custom design on the welcome screen */}
                    {uiMode === 'spatial' ? <ElevationUp>{content}</ElevationUp> : content}

                    {uiMode === 'card' && (
                        <BluetoothScanFooter
                            onReScanClick={onReScanClick}
                            numberOfDevices={devices.length}
                            scanStatus={scanStatus}
                        />
                    )}
                </Column>
            </Card>

            {uiMode === 'spatial' && (
                // Here we need to do +2 in elevation because of custom design on the welcome screen
                <ElevationUp>
                    <ElevationUp>
                        <BluetoothScanFooter
                            onReScanClick={onReScanClick}
                            numberOfDevices={devices.length}
                            scanStatus={scanStatus}
                        />
                    </ElevationUp>
                </ElevationUp>
            )}
        </Column>
    );
};
