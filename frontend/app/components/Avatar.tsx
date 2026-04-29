import { StyleSheet, Text, View } from 'react-native';

type AvatarProps = {
  name: string;
  size?: number;
  backgroundColor?: string;
};

const Avatar = ({ name, size = 34, backgroundColor = '#0F766E' }: AvatarProps) => {
  const initials = name
    .split(' ')
    .map((segment) => segment[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor }]}>
      <Text style={[styles.initials, { fontSize: Math.max(12, size * 0.36) }]}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default Avatar;
