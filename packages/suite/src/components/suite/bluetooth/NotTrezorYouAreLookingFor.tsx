import { useState } from 'react';

import styled from 'styled-components';

import { Collapsible, Icon, Link, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { BluetoothTips } from './BluetoothTips';

const Toggle = styled.div`
    transition: opacity 0.15s;
    cursor: pointer;
`;

type NotTrezorYouAreLookingForProps = {
    onReScanClick: () => void;
};

export const NotTrezorYouAreLookingFor = ({ onReScanClick }: NotTrezorYouAreLookingForProps) => {
    const [showTips, setShowTips] = useState(false);

    return (
        <Collapsible isOpen={showTips}>
            <Collapsible.Toggle>
                <Row justifyContent="center" flex="1">
                    <Row onClick={() => setShowTips(!showTips)} gap={spacings.xs}>
                        <Link typographyStyle="hint" variant="underline">
                            <Text variant="tertiary">Not the Trezor you’re looking for?</Text>
                        </Link>
                        <Toggle>
                            <Icon name={showTips ? 'caretUp' : 'caretDown'} variant="tertiary" />
                        </Toggle>
                    </Row>
                </Row>
            </Collapsible.Toggle>
            <Collapsible.Content>
                <BluetoothTips onReScanClick={onReScanClick} header="Check tips & try again" />
            </Collapsible.Content>
        </Collapsible>
    );
};
