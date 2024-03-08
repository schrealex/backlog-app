import * as React from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

export function LoadingIndicator() {
    return (<ActivityIndicator style={styles.loadingSpinner} size="large" color="#fff" />);
}

const styles = StyleSheet.create({
    loadingSpinner: {
        height: 250,
    },
});
