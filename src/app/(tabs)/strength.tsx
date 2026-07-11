import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function StrengthScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">筋トレ</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        実装予定
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
});
