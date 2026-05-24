import React from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    TextInputProps,
    ViewStyle,
} from 'react-native';
import { THEME } from '../theme';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    containerStyle,
    style,
    ...props
}) => {
    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TextInput
                style={[
                    styles.input,
                    error ? { borderColor: THEME.colors.error } : null,
                    style,
                ]}
                placeholderTextColor={THEME.colors.textSecondary}
                {...props}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: THEME.spacing.m,
    },
    label: {
        fontSize: THEME.sizes.caption,
        color: THEME.colors.textSecondary,
        marginBottom: THEME.spacing.xs,
        fontFamily: THEME.fonts.medium,
    },
    input: {
        height: THEME.responsive.ms(48),
        borderWidth: 1,
        borderColor: THEME.colors.border,
        borderRadius: THEME.responsive.ms(8),
        paddingHorizontal: THEME.spacing.m,
        color: THEME.colors.text,
        fontSize: THEME.responsive.fs(THEME.sizes.body1),
        backgroundColor: THEME.colors.surface,
    },
    errorText: {
        fontSize: THEME.sizes.caption,
        color: THEME.colors.error,
        marginTop: THEME.spacing.xs,
    },
});
