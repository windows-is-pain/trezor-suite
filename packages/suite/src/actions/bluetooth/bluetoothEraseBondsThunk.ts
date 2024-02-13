import { BLUETOOTH_PREFIX, bluetoothActions } from '@suite-common/bluetooth';
import { createThunk } from '@suite-common/redux-utils';
import { TrezorDevice } from '@suite-common/suite-types';
import TrezorConnect from '@trezor/connect';

type BluetoothEraseBondsThunkParams = {
    device: TrezorDevice;
};

export const bluetoothEraseBondsThunk = createThunk<void, BluetoothEraseBondsThunkParams, void>(
    `${BLUETOOTH_PREFIX}/bluetoothEraseBondsThunk`,
    async ({ device }, { dispatch }) => {
        const bluetoothId = device?.bluetoothProps?.id;

        // TODO: missing button request in FW
        console.log('___eraseBonds ...............');
        const result = await TrezorConnect.eraseBonds({ device });

        console.log('___eraseBonds', result.success, result);

        if (result.success && bluetoothId !== undefined) {
            console.log('___removing known device:', bluetoothId);
            dispatch(bluetoothActions.removeKnownDeviceAction({ id: bluetoothId }));
        }

        console.warn('Erase bonds!', result);
    },
);
