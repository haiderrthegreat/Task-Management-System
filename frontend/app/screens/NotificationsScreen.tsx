import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import AppCard from '../components/AppCard';
import Screen from '../components/Screen';
import { taskflowRepository } from '../data/taskflowRepository';

const NotificationsScreen = () => {
  const [items, setItems] = useState(taskflowRepository.getNotifications());

  const markAllRead = () => {
    setItems((prev) => prev.map((item) => ({ ...item, unread: false })));
  };

  return (
    <Screen>
      <Pressable style={styles.actionBtn} onPress={markAllRead}>
        <Text style={styles.actionBtnText}>Mark all as read</Text>
      </Pressable>

      {items.map((notification) => (
        <AppCard key={notification.id}>
          <Text style={styles.cardTitle}>{notification.title}</Text>
          <Text style={styles.cardText}>{notification.message}</Text>
          <Text style={styles.cardTime}>{notification.time}</Text>
          {notification.unread ? <Text style={styles.badge}>Unread</Text> : null}
        </AppCard>
      ))}
    </Screen>
  );
};

const styles = StyleSheet.create({
  actionBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#0F766E',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cardTitle: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 15,
  },
  cardText: {
    marginTop: 4,
    color: '#475569',
  },
  cardTime: {
    marginTop: 8,
    color: '#64748B',
    fontSize: 12,
  },
  badge: {
    marginTop: 8,
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default NotificationsScreen;
