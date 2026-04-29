import { StyleSheet, Text, View } from 'react-native';

type BadgeType = 'priority' | 'status';

type BadgeProps = {
  label: string;
  type: BadgeType;
};

const palette = {
  High: { bg: '#FEE2E2', fg: '#B91C1C' },
  Medium: { bg: '#FEF3C7', fg: '#92400E' },
  Low: { bg: '#DCFCE7', fg: '#166534' },
  Todo: { bg: '#E2E8F0', fg: '#334155' },
  'In Progress': { bg: '#DBEAFE', fg: '#1D4ED8' },
  Done: { bg: '#DCFCE7', fg: '#166534' },
} as const;

const Badge = ({ label, type }: BadgeProps) => {
  const style = palette[label as keyof typeof palette] ?? { bg: '#E2E8F0', fg: '#334155' };

  return (
    <View style={[styles.badge, { backgroundColor: style.bg }, type === 'status' ? styles.statusBadge : null]}>
      <Text style={[styles.text, { color: style.fg }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  statusBadge: {
    marginLeft: 8,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default Badge;
