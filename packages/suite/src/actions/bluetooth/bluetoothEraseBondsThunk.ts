import { BLUETOOTH_PREFIX, bluetoothActions } from '@suite-common/bluetooth';
import { createThunk } from '@suite-common/redux-utils';
import { TrezorDevice } from '@suite-common/suite-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import TrezorConnect from '@trezor/connect';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

type BluetoothEraseBondsThunkParams = {
    device: TrezorDevice;
};

export const bluetoothEraseBondsThunk = createThunk<void, BluetoothEraseBondsThunkParams, void>(
    `${BLUETOOTH_PREFIX}/bluetoothEraseBondsThunk`,
    async ({ device }, { dispatch }) => {
        const bluetoothId = device?.bluetoothProps?.id;

        if (bluetoothId === undefined) {
            return;
        }

        // Todo: this shall happend AFTER the connect call but it is bugged so we do it optimistically
        dispatch(bluetoothActions.removeKnownDeviceAction({ id: bluetoothId }));

        const resultForget = await bluetoothIpc.forgetDevice(bluetoothId); // Todo: move this after connect call once fixed
        if (!resultForget.success) {
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: 'Removing device from OS failed, do it manually', // Todo: better UX
                }),
            );
        }

        // TODO: missing button request in FW
        console.log('___eraseBonds ...............');
        const result = await TrezorConnect.eraseBonds({ device });

        console.log('___eraseBonds', result.success, result);

        if (result.success) {
            console.log('___removing known device:', bluetoothId);
            dispatch(bluetoothActions.removeKnownDeviceAction({ id: bluetoothId }));
        } else {
            dispatch(notificationsActions.addToast({ type: 'error', error: result.payload.error }));
        }
    },
);
