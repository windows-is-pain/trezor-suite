import styled from 'styled-components';

import { Card, Link, NewModal, Row, Text } from '@trezor/components';
import { spacings, spacingsPx, typography } from '@trezor/theme';
import { BluetoothDevice } from '@trezor/transport-bluetooth';

import { BluetoothDeviceComponent } from './BluetoothDeviceComponent';

const Pin = styled.div`
    display: flex;
    flex: 1;

    ${typography.titleLarge} /* Amount */ margin: 0 auto;

    letter-spacing: ${spacingsPx.md};
`;

type BluetoothPairingPinProps = {
    onCancel: (deviceId: string) => void;
    pairingPin?: string;
    device: BluetoothDevice;
};

export const BluetoothPairingPin = ({ onCancel, pairingPin, device }: BluetoothPairingPinProps) => {
    const handleOnCancel = () => onCancel(device.id);

    return (
        <NewModal
            heading="Bluetooth pairing code"
            onCancel={handleOnCancel}
            variant="primary"
            bottomContent={
                <Link onClick={handleOnCancel} typographyStyle="hint" variant="underline">
                    <Text variant="tertiary">Codes don&apos;t match?</Text>
                </Link>
            }
        >
            <Card paddingType="none" overflow="hidden">
                <Row
                    alignItems="center"
                    gap={spacings.xs}
                    justifyContent="space-between"
                    margin={{ vertical: spacings.xxl, horizontal: spacings.xxl }}
                >
                    <Pin>{pairingPin}</Pin>
                    <BluetoothDeviceComponent
                        device={device}
                        margin={{ vertical: spacings.xxs, horizontal: spacings.xxs }}
                    />
                </Row>
            </Card>
        </NewModal>
    );
};
