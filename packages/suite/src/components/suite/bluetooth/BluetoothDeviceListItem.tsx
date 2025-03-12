import { useState } from 'react';

import { DeviceBluetoothConnectionStatusType } from '@suite-common/bluetooth';
import { Button, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { BluetoothDevice } from '@trezor/transport-bluetooth';

import { BluetoothDeviceComponent } from './BluetoothDeviceComponent';
import { bluetoothDisconnectDeviceThunk } from '../../../actions/bluetooth/bluetoothDisconnectDeviceThunk';
import { useDispatch } from '../../../hooks/suite';

const labelMap: Record<DeviceBluetoothConnectionStatusType, string> = {
    disconnected: 'Connect',
    connecting: 'Connecting',
    connected: 'Disconnect',
    'connection-error': 'Try again', // Out-of-range, offline, in the faraday cage, ...
    pairing: 'Pairing',
    paired: 'Paired',
    'pairing-error': '', // shall never be show to user
};

const LOADING_STATUSES: DeviceBluetoothConnectionStatusType[] = ['pairing', 'connecting'];
const DISABLED_STATUSES: DeviceBluetoothConnectionStatusType[] = ['pairing', 'connecting'];

type BluetoothDeviceItemProps = {
    device: BluetoothDevice;
    onConnect: (deviceId: string) => Promise<void>;
    onError: (deviceId: string) => void;
};

export const BluetoothDeviceListItem = ({
    device,
    onConnect,
    onError,
}: BluetoothDeviceItemProps) => {
    const dispatch = useDispatch();

    const [isLoading, setIsLoading] = useState(false);

    const isDisabled = DISABLED_STATUSES.includes(device.connectionStatus.type);
    const isGlobalLoading = LOADING_STATUSES.includes(device.connectionStatus.type);

    const onDisconnect = async () => {
        const result = await dispatch(bluetoothDisconnectDeviceThunk({ id: device.id })).unwrap();

        if (!result.success) {
            onError(device.id);
        }
    };

    const onClickMap: Record<
        DeviceBluetoothConnectionStatusType,
        (() => Promise<void>) | undefined
    > = {
        'connection-error': () => onConnect(device.id),
        'pairing-error': undefined,
        connected: onDisconnect,
        connecting: undefined,
        disconnected: () => onConnect(device.id),
        paired: undefined,
        pairing: undefined,
    };

    const handleOnclick = onClickMap[device.connectionStatus.type];

    const handleOnClick = async () => {
        setIsLoading(true);
        await handleOnclick?.();
        setIsLoading(false);
    };

    return (
        <Row gap={spacings.md} alignItems="center">
            <BluetoothDeviceComponent device={device} flex="1" />
            <Button
                variant="primary"
                size="small"
                margin={{ vertical: spacings.xxs }}
                isDisabled={isDisabled || handleOnclick === undefined}
                isLoading={isLoading || isGlobalLoading}
                onClick={handleOnClick}
            >
                {labelMap[device.connectionStatus.type]}
            </Button>
        </Row>
    );
};
