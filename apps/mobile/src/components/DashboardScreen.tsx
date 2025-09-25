import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { apiClient } from '@emergency-dispatch/api-client';
import { USER_ROLES, INCIDENT_TYPES } from '@emergency-dispatch/shared';

interface DashboardScreenProps {
  user: any;
  onLogout: () => void;
}

export default function DashboardScreen({ user, onLogout }: DashboardScreenProps) {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadIncidents = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const response = await apiClient.getIncidents();
      if (response.data.success) {
        setIncidents(response.data.data.slice(0, 10)); // Show latest 10
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load incidents');
    } finally {
      if (showLoader) setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadIncidents(false);
  };

  const handleLogout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      // Continue with logout even if API call fails
    } finally {
      onLogout();
    }
  };

  const getIncidentTypeColor = (type: string) => {
    switch (type) {
      case INCIDENT_TYPES.FIRE:
        return '#dc2626';
      case INCIDENT_TYPES.MEDICAL:
        return '#059669';
      case INCIDENT_TYPES.TRAFFIC:
        return '#2563eb';
      default:
        return '#6b7280';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userRole}>{user.role}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: '#dc2626' }]}>
          <Text style={styles.statNumber}>
            {incidents.filter(i => i.status === 'active').length}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#059669' }]}>
          <Text style={styles.statNumber}>
            {incidents.filter(i => i.status === 'resolved').length}
          </Text>
          <Text style={styles.statLabel}>Resolved</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#2563eb' }]}>
          <Text style={styles.statNumber}>{incidents.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      {/* Recent Incidents */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Incidents</Text>
        <ScrollView
          style={styles.incidentsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {loading ? (
            <Text style={styles.loadingText}>Loading incidents...</Text>
          ) : incidents.length === 0 ? (
            <Text style={styles.emptyText}>No incidents found</Text>
          ) : (
            incidents.map((incident: any) => (
              <View key={incident._id} style={styles.incidentCard}>
                <View style={styles.incidentHeader}>
                  <View
                    style={[
                      styles.incidentTypeIndicator,
                      { backgroundColor: getIncidentTypeColor(incident.type) }
                    ]}
                  />
                  <View style={styles.incidentInfo}>
                    <Text style={styles.incidentType}>{incident.type}</Text>
                    <Text style={styles.incidentTime}>
                      {formatDateTime(incident.createdAt)}
                    </Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: incident.status === 'active' ? '#dc2626' : '#059669' }
                  ]}>
                    <Text style={styles.statusText}>{incident.status}</Text>
                  </View>
                </View>
                <Text style={styles.incidentDescription} numberOfLines={2}>
                  {incident.description}
                </Text>
                <Text style={styles.incidentLocation}>📍 {incident.location}</Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 24,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  greeting: {
    fontSize: 16,
    color: '#6b7280',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  userRole: {
    fontSize: 14,
    color: '#2563eb',
    textTransform: 'capitalize',
  },
  logoutButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: 'white',
    opacity: 0.9,
    marginTop: 4,
  },
  section: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  incidentsList: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 20,
  },
  incidentCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  incidentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  incidentTypeIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  incidentInfo: {
    flex: 1,
  },
  incidentType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textTransform: 'capitalize',
  },
  incidentTime: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  incidentDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  incidentLocation: {
    fontSize: 14,
    color: '#6b7280',
  },
});