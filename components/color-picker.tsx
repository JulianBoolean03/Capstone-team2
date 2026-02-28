import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Curated palette similar to Discord/Slack
const AVATAR_COLORS = [
    { bg: '#3B5BFF', text: '#FFFFFF', name: 'Blue' },
    { bg: '#FF6B6B', text: '#FFFFFF', name: 'Red' },
    { bg: '#4ECDC4', text: '#FFFFFF', name: 'Teal' },
    { bg: '#95E1D3', text: '#111827', name: 'Mint' },
    { bg: '#F38181', text: '#FFFFFF', name: 'Coral' },
    { bg: '#AA96DA', text: '#FFFFFF', name: 'Purple' },
    { bg: '#FCBAD3', text: '#111827', name: 'Pink' },
    { bg: '#A8D8EA', text: '#111827', name: 'Sky' },
    { bg: '#FFD3B6', text: '#111827', name: 'Peach' },
    { bg: '#FFAAA5', text: '#FFFFFF', name: 'Salmon' },
];

interface ColorPickerProps {
    selectedBg?: string;
    selectedText?: string;
    onSelect: (bgColor: string, textColor: string) => void;
}

export function AvatarColorPicker({
    selectedBg = '#3B5BFF',
    selectedText = '#FFFFFF',
    onSelect,
}: ColorPickerProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.label}>Choose Avatar Color</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {AVATAR_COLORS.map((color) => (
                    <TouchableOpacity
                        key={color.bg}
                        onPress={() => onSelect(color.bg, color.text)}
                        style={[
                            styles.colorOption,
                            {
                                backgroundColor: color.bg,
                                borderWidth: selectedBg === color.bg ? 4 : 0,
                                borderColor: '#111827',
                            },
                        ]}
                    >
                        <Text
                            style={[
                                styles.colorLabel,
                                {
                                    color: color.text,
                                    opacity: selectedBg === color.bg ? 1 : 0.6,
                                },
                            ]}
                        >
                            {color.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 10,
    },
    scrollContent: {
        gap: 10,
        paddingHorizontal: 0,
    },
    colorOption: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    colorLabel: {
        fontSize: 10,
        fontWeight: '700',
        textAlign: 'center',
    },
});
