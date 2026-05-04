import { useCallback, useMemo, useState } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Text,
  View,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

import Screen from '../components/Screen';
import {
  getApiErrorMessage,
  useGetInvitationsQuery,
  useMarkInvitationReadMutation,
  useAcceptInvitationMutation,
  useDeclineInvitationMutation,
} from '../store/api';
import ScreenHeader from '../components/ScreenHeader';

type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';

type InvitationItem = {
  id: string;
  workspaceName: string;
  workspaceDescription?: string | null;
  inviterName?: string;
  inviterEmail?: string;
  message?: string;
  status: InvitationStatus;
  isRead: boolean;
  createdAt: string;
  respondedAt?: string | null;
};

// ── Status config ──────────────────────────────────────────────
const STATUS_CONFIG: Record<InvitationStatus, { label: string; dot: string; pill: object; text: object }> = {
  PENDING: {
    label: 'Pending',
    dot: '#F59E0B',
    pill: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
    text: { color: '#92400E' },
  },
  ACCEPTED: {
    label: 'Accepted',
    dot: '#10B981',
    pill: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
    text: { color: '#065F46' },
  },
  DECLINED: {
    label: 'Declined',
    dot: '#EF4444',
    pill: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
    text: { color: '#991B1B' },
  },
  EXPIRED: {
    label: 'Expired',
    dot: '#9CA3AF',
    pill: { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' },
    text: { color: '#6B7280' },
  },
};

const NotificationsScreen = () => {
  const { data: items = [], isLoading, refetch } = useGetInvitationsQuery();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [markRead] = useMarkInvitationReadMutation();
  const [acceptInvitation] = useAcceptInvitationMutation();
  const [declineInvitation] = useDeclineInvitationMutation();

  const notifications = useMemo(() => items as InvitationItem[], [items]);

  const onMarkRead = useCallback(
    async (id: string) => {
      setProcessingId(id);
      try {
        await markRead({ invitationId: id }).unwrap();
      } catch (err) {
        Alert.alert('Error', getApiErrorMessage(err, 'Could not mark invitation as read'));
      } finally {
        await refetch();
        setProcessingId(null);
      }
    },
    [markRead, refetch],
  );

  const onAccept = useCallback(
    async (id: string) => {
      setProcessingId(id);
      try {
        await acceptInvitation({ invitationId: id }).unwrap();
        Alert.alert('Joined', 'You have joined the workspace');
      } catch (err) {
        Alert.alert('Error', getApiErrorMessage(err, 'Could not accept invitation'));
      } finally {
        await refetch();
        setProcessingId(null);
      }
    },
    [acceptInvitation, refetch],
  );

  const onDecline = useCallback(
    async (id: string) => {
      setProcessingId(id);
      try {
        await declineInvitation({ invitationId: id }).unwrap();
        Alert.alert('Declined', 'Invitation declined successfully');
      } catch (err) {
        Alert.alert('Error', getApiErrorMessage(err, 'Could not decline invitation'));
      } finally {
        await refetch();
        setProcessingId(null);
      }
    },
    [declineInvitation, refetch],
  );

  const renderMessage = (notification: InvitationItem) => {
    if (notification.message && notification.message.trim().length > 0) {
      return notification.message;
    }
    const inviter = notification.inviterName || notification.inviterEmail || 'Someone';
    return `${inviter} invited you to join "${notification.workspaceName}"`;
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <Screen>
      <ScreenHeader title="Notifications" />
      
      {/* ── Header ───────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerEyebrow}>WORKSPACE</Text>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>Invitations</Text>
            {unreadCount > 0 && (
              <View style={styles.unreadPill}>
                <Text style={styles.unreadPillText}>{unreadCount} new</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => refetch()}
          activeOpacity={0.7}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#6366F1" size="small" />
          ) : (
            <Text style={styles.refreshIcon}>↻</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Divider ──────────────────────────────── */}
      <View style={styles.headerDivider} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Loading ──────────────────────────────── */}
        {isLoading && (
          <View style={styles.centerState}>
            <ActivityIndicator color="#6366F1" size="large" />
            <Text style={styles.centerStateText}>Fetching invitations…</Text>
          </View>
        )}

        {/* ── Empty ────────────────────────────────── */}
        {!isLoading && notifications.length === 0 && (
          <View style={styles.centerState}>
            <View style={styles.emptyIconWrap}>
              <Text style={styles.emptyEmoji}>📭</Text>
            </View>
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySubtitle}>No workspace invitations right now.</Text>
          </View>
        )}

        {/* ── Cards ────────────────────────────────── */}
        {notifications.map((notification) => {
          const isPending = notification.status === 'PENDING';
          const isProcessing = processingId === notification.id;
          const cfg = STATUS_CONFIG[notification.status];
          const initials = notification.workspaceName
            .split(' ')
            .map((w) => w[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

          return (
            <View
              key={notification.id}
              style={[styles.card, !notification.isRead && styles.cardUnread]}
            >
              {/* Unread indicator strip */}
              {!notification.isRead && <View style={styles.unreadStrip} />}

              {/* ── Card header ── */}
              <View style={styles.cardHeader}>
                {/* Avatar */}
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>

                {/* Title block */}
                <View style={styles.cardHeaderText}>
                  <Text style={styles.workspaceName} numberOfLines={1}>
                    {notification.workspaceName}
                  </Text>
                  {(notification.inviterName || notification.inviterEmail) && (
                    <Text style={styles.inviterLine} numberOfLines={1}>
                      from{' '}
                      <Text style={styles.inviterName}>
                        {notification.inviterName ?? notification.inviterEmail}
                      </Text>
                    </Text>
                  )}
                </View>

                {/* Status pill */}
                <View style={[styles.statusPill, cfg.pill]}>
                  <View style={[styles.statusDot, { backgroundColor: cfg.dot }]} />
                  <Text style={[styles.statusPillText, cfg.text]}>{cfg.label}</Text>
                </View>
              </View>

              {/* ── Message ── */}
              <Text style={styles.messageText}>{renderMessage(notification)}</Text>

              {/* ── Description ── */}
              {notification.workspaceDescription ? (
                <View style={styles.descriptionBox}>
                  <Text style={styles.descriptionText}>
                    {notification.workspaceDescription}
                  </Text>
                </View>
              ) : null}

              {/* ── Meta row ── */}
              <View style={styles.metaRow}>
                <Text style={styles.metaTime}>
                  🕐 {new Date(notification.createdAt).toLocaleString()}
                </Text>
                {notification.respondedAt && (
                  <Text style={styles.metaTime}>
                    ✅ {new Date(notification.respondedAt).toLocaleString()}
                  </Text>
                )}
                <View style={[styles.readBadge, notification.isRead && styles.readBadgeRead]}>
                  <Text
                    style={[styles.readBadgeText, notification.isRead && styles.readBadgeTextRead]}
                  >
                    {notification.isRead ? '● Read' : '● Unread'}
                  </Text>
                </View>
              </View>

              {/* ── Divider ── */}
              <View style={styles.cardDivider} />

              {/* ── Actions ── */}
              <View style={styles.actionsRow}>
                {isPending ? (
                  <>
                    <TouchableOpacity
                      onPress={() => onAccept(notification.id)}
                      disabled={isProcessing}
                      activeOpacity={0.8}
                      style={[styles.btnAccept, isProcessing && styles.btnDisabled]}
                    >
                      {isProcessing ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.btnAcceptText}>✓  Accept</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => onDecline(notification.id)}
                      disabled={isProcessing}
                      activeOpacity={0.8}
                      style={[styles.btnDecline, isProcessing && styles.btnDisabled]}
                    >
                      <Text style={styles.btnDeclineText}>✕  Decline</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={styles.resolvedBox}>
                    <Text style={styles.resolvedText}>
                      This invitation has been{' '}
                      <Text style={[styles.resolvedStatus, cfg.text]}>
                        {cfg.label.toLowerCase()}
                      </Text>
                      .
                    </Text>
                  </View>
                )}

                {!notification.isRead && (
                  <TouchableOpacity
                    onPress={() => onMarkRead(notification.id)}
                    disabled={isProcessing}
                    activeOpacity={0.7}
                    style={[styles.btnMarkRead, isProcessing && styles.btnDisabled]}
                  >
                    <Text style={styles.btnMarkReadText}>Mark read</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  // ── Header ────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flex: 1,
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6366F1',
    letterSpacing: 2.5,
    marginBottom: 4,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  unreadPill: {
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  unreadPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338CA',
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  refreshIcon: {
    fontSize: 20,
    color: '#6366F1',
    fontWeight: '700',
  },
  headerDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 20,
  },

  // ── Scroll ────────────────────────────────────────────
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // ── States ────────────────────────────────────────────
  centerState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  centerStateText: {
    marginTop: 12,
    color: '#94A3B8',
    fontSize: 14,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyEmoji: { fontSize: 32 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
  },

  // ── Card ──────────────────────────────────────────────
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  cardUnread: {
    borderColor: '#C7D2FE',
    backgroundColor: '#FAFBFF',
  },
  unreadStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#6366F1',
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },

  // ── Card header ───────────────────────────────────────
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#4338CA',
  },
  cardHeaderText: {
    flex: 1,
  },
  workspaceName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 1,
  },
  inviterLine: {
    fontSize: 12,
    color: '#94A3B8',
  },
  inviterName: {
    fontWeight: '600',
    color: '#64748B',
  },

  // ── Status pill ───────────────────────────────────────
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: 1,
    gap: 5,
    flexShrink: 0,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // ── Message ───────────────────────────────────────────
  messageText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
    marginBottom: 10,
  },

  // ── Description box ───────────────────────────────────
  descriptionBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  descriptionText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },

  // ── Meta row ──────────────────────────────────────────
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  metaTime: {
    fontSize: 11,
    color: '#94A3B8',
  },
  readBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
  },
  readBadgeRead: {
    backgroundColor: '#F1F5F9',
  },
  readBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  readBadgeTextRead: {
    color: '#94A3B8',
  },

  // ── Card divider ──────────────────────────────────────
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 12,
  },

  // ── Actions ───────────────────────────────────────────
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  btnAccept: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 9,
    minWidth: 90,
    justifyContent: 'center',
  },
  btnAcceptText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnDecline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderWidth: 1.5,
    borderColor: '#FECACA',
    minWidth: 90,
    justifyContent: 'center',
  },
  btnDeclineText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
  },
  btnMarkRead: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: '#F1F5F9',
    marginLeft: 'auto',
  },
  btnMarkReadText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  btnDisabled: {
    opacity: 0.45,
  },
  resolvedBox: {
    flex: 1,
  },
  resolvedText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  resolvedStatus: {
    fontWeight: '700',
  },

  // ── Bottom ────────────────────────────────────────────
  bottomSpacer: {
    height: 32,
  },
});

export default NotificationsScreen;