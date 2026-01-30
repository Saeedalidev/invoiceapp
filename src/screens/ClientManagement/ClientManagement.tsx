import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { clientStorage } from '../../services/storage';
import { spacing, fontSize, borderRadius } from '../../theme/constants';
import { useThemeColors } from '../../theme/hooks/useThemeColors';
import type { RootScreenProps } from '../../navigation/types';
import { useTheme } from '@/theme';
import type { Client } from '../../types/schemas/invoice';

const ClientManagement = ({ navigation }: RootScreenProps<'ClientManagement'>) => {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { variant } = useTheme();
  const isDarkMode = variant === 'dark';

  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
      paddingTop: Math.max(insets.top, spacing.md),
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.card,
      borderBottomWidth: 1, borderBottomColor: colors.border
    },
    headerTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
    backLink: { fontSize: fontSize.md, color: colors.textSecondary },
    addLink: { fontSize: fontSize.md, color: colors.accent, fontWeight: '600' },

    searchContainer: { padding: spacing.md, backgroundColor: colors.background },
    searchInput: {
      backgroundColor: colors.card, padding: spacing.sm, borderRadius: borderRadius.md,
      fontSize: fontSize.md, borderWidth: 1, borderColor: colors.border, color: colors.text
    },

    listContent: { padding: spacing.md },
    clientCard: {
      backgroundColor: colors.card, padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.sm,
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1
    },
    clientInfo: { flex: 1 },
    clientName: { fontSize: fontSize.md, fontWeight: '600', color: colors.text, marginBottom: 4 },
    clientDetails: { fontSize: fontSize.sm, color: colors.textSecondary },
    clientActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    deleteButton: { padding: spacing.xs },
    deleteIcon: { fontSize: 18, opacity: 0.7 },
    chevron: { fontSize: 24, color: colors.textSecondary, opacity: 0.5 },

    emptyState: { alignItems: 'center', marginTop: spacing.xxl },
    emptyStateText: { fontSize: fontSize.md, color: colors.textSecondary, marginBottom: spacing.sm },
    emptyStateLink: { fontSize: fontSize.md, color: colors.accent, fontWeight: '600' },
  }), [colors, insets]);

  // Load clients when screen comes into focus in case a new client was added
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadClients();
    });
    return unsubscribe;
  }, [navigation]);

  const loadClients = () => {
    const allClients = clientStorage.getAll();
    setClients(sortClients(allClients));
  };

  const sortClients = (data: Client[]) => {
    return data.sort((a, b) => a.clientName.localeCompare(b.clientName));
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadClients();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      loadClients();
    } else {
      const filtered = clientStorage.search(text);
      setClients(sortClients(filtered));
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete Client',
      `Are you sure you want to delete ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            clientStorage.delete(id);
            loadClients();
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: Client }) => (
    <TouchableOpacity
      style={styles.clientCard}
      onPress={() => navigation.navigate('ClientHistory', { clientId: item.id })}
    >
      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{item.clientName}</Text>
        <Text style={styles.clientDetails}>{item.email}</Text>
        <Text style={styles.clientDetails}>{item.contactNumber}</Text>
      </View>
      <View style={styles.clientActions}>
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            handleDelete(item.id, item.clientName);
          }}
          hitSlop={10}
          style={styles.deleteButton}
        >
          <Icon name="trash-outline" size={18} color={colors.error} style={{ opacity: 0.7 }} />
        </TouchableOpacity>
        <Icon name="chevron-forward" size={24} color={colors.textSecondary} style={{ opacity: 0.5 }} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon name="chevron-back" size={24} color={colors.textSecondary} />
          <Text style={styles.backLink}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Clients</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddClient')} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon name="add" size={20} color={colors.accent} />
          <Text style={styles.addLink}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search clients..."
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <FlatList
        data={clients}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No clients found</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AddClient')}>
              <Text style={styles.emptyStateLink}>Add your first client</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default ClientManagement;
