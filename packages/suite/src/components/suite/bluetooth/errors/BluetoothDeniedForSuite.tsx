import { useState } from 'react';

import { Banner, Button, Card, Column, Icon, Row, Text } from '@trezor/components';
import { desktopApi } from '@trezor/suite-desktop-api';
import { spacings } from '@trezor/theme';

export const BluetoothDeniedForSuite = () => {
    const [hasDeeplinkFailed, setHasDeeplinkFailed] = useState(false);

    const openSettings = async () => {
        // TODO: open Settings/Privacy and security/Bluetooth
        const opened = await desktopApi.openSystemSettings('bluetooth-security');
        if (!opened.success) {
            setHasDeeplinkFailed(true);
        }
    };

    return (
        <Card>
            <Column alignItems="start" gap={spacings.xs}>
                <Icon name="bluetooth" />
                <Text typographyStyle="titleSmall">Allow bluetooth permissions</Text>
                <Text typographyStyle="body" variant="tertiary">
                    Or connect your Trezor via cable.
                </Text>
                {hasDeeplinkFailed && (
                    <Banner variant="warning">
                        Cannot open permission settings. Go to Settings/Privacy and
                        security/Bluetooth.
                    </Banner>
                )}
                <Row>
                    <Button onClick={openSettings}>Open permissions settings</Button>
                </Row>
            </Column>
        </Card>
    );
};
