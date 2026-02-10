import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <Text style={styles.text}>Profile (placeholder)</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 16, color: '#0F172A' },
});