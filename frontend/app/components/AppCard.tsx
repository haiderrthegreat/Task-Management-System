import { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

type AppCardProps = PropsWithChildren;

const AppCard = ({ children }: AppCardProps) => {
  return <View style={styles.card}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 12,
  },
});

export default AppCard;
