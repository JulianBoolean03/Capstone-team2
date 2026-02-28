import { StyleSheet, Text, View } from 'react-native';

interface AvatarProps {
    name: string;
    backgroundColor?: string;
    textColor?: string;
    size?: number;
}

export function Avatar({
    name,
    backgroundColor = '#3B5BFF',
    textColor = '#FFFFFF',
    size = 48,
}: AvatarProps) {
    const initials = name
        .split(' ')
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase())
        .join('');

    const fontSize = size * 0.4;

    return (
        <View
            style={[
                styles.container,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor,
                },
            ]}
        >
            <Text style={[styles.initials, { fontSize, color: textColor }]}>
                {initials}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    initials: {
        fontWeight: '700',
    },
});
