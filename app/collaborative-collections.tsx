import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { useDebt } from '@/contexts/DebtContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, MessageSquare, CheckCircle, Clock, UserPlus, Send, Target, TrendingUp } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CollectionTask {
  id: string;
  debtorId: string;
  debtorName: string;
  assignedTo: string;
  assignedToName: string;
  assignedBy: string;
  assignedByName: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  completedAt?: string;
  notes: string[];
}

interface TeamActivity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  actionKu: string;
  debtorName?: string;
  timestamp: string;
}

const STORAGE_KEY = 'collection_tasks';
const ACTIVITY_KEY = 'team_activities';

export default function CollaborativeCollectionsScreen() {
  const { debtors } = useDebt();
  const { currentUser, users } = useAuth();
  const { language } = useLanguage();
  const { settings } = useTheme();
  const isDarkMode = settings.theme === 'dark';

  const [tasks, setTasks] = useState<CollectionTask[]>([]);
  const [activities, setActivities] = useState<TeamActivity[]>([]);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedDebtor, setSelectedDebtor] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [taskDescription, setTaskDescription] = useState('');

  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const tasksData = await AsyncStorage.getItem(STORAGE_KEY);
      const activitiesData = await AsyncStorage.getItem(ACTIVITY_KEY);
      
      if (tasksData) {
        setTasks(JSON.parse(tasksData));
      }
      if (activitiesData) {
        setActivities(JSON.parse(activitiesData));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveData = async (newTasks: CollectionTask[], newActivities?: TeamActivity[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newTasks));
      if (newActivities) {
        await AsyncStorage.setItem(ACTIVITY_KEY, JSON.stringify(newActivities));
      }
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const addActivity = (action: string, actionKu: string, debtorName?: string) => {
    if (!currentUser) return;

    const newActivity: TeamActivity = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.fullName || currentUser.username,
      action,
      actionKu,
      debtorName,
      timestamp: new Date().toISOString(),
    };

    const updated = [newActivity, ...activities].slice(0, 50);
    setActivities(updated);
    saveData(tasks, updated);
  };

  const createTask = () => {
    if (!currentUser || !selectedDebtor || !selectedUser || !taskDescription) {
      Alert.alert(
        language === 'ku' ? 'هەڵە' : 'Error',
        language === 'ku' ? 'تکایە هەموو خانەکان پڕبکەرەوە' : 'Please fill all fields'
      );
      return;
    }

    const debtor = debtors.find(d => d.id === selectedDebtor);
    const user = users.find(u => u.id === selectedUser);

    if (!debtor || !user) return;

    const newTask: CollectionTask = {
      id: Date.now().toString(),
      debtorId: debtor.id,
      debtorName: debtor.name,
      assignedTo: user.id,
      assignedToName: user.fullName || user.username,
      assignedBy: currentUser.id,
      assignedByName: currentUser.fullName || currentUser.username,
      description: taskDescription,
      status: 'pending',
      priority: 'medium',
      createdAt: new Date().toISOString(),
      notes: [],
    };

    const updated = [newTask, ...tasks];
    setTasks(updated);
    saveData(updated, activities);

    addActivity(
      `Assigned task to ${user.fullName || user.username} for ${debtor.name}`,
      `ئەرکێک دیاری کرا بۆ ${user.fullName || user.username} بۆ ${debtor.name}`,
      debtor.name
    );

    setShowAssignForm(false);
    setSelectedDebtor('');
    setSelectedUser('');
    setTaskDescription('');
  };

  const updateTaskStatus = (taskId: string, status: CollectionTask['status']) => {
    const updated = tasks.map(task => {
      if (task.id === taskId) {
        const updatedTask = {
          ...task,
          status,
          completedAt: status === 'completed' ? new Date().toISOString() : task.completedAt,
        };

        if (status === 'completed') {
          addActivity(
            `Completed task for ${task.debtorName}`,
            `ئەرکێک تەواوکرا بۆ ${task.debtorName}`,
            task.debtorName
          );
        }

        return updatedTask;
      }
      return task;
    });

    setTasks(updated);
    saveData(updated, activities);
  };

  const addNote = (taskId: string) => {
    if (!newNote.trim() || !currentUser) return;

    const updated = tasks.map(task => {
      if (task.id === taskId) {
        const noteWithUser = `[${currentUser.fullName || currentUser.username}] ${newNote}`;
        return {
          ...task,
          notes: [...task.notes, noteWithUser],
        };
      }
      return task;
    });

    setTasks(updated);
    saveData(updated, activities);
    setNewNote('');
  };

  const teamMembers = currentUser?.marketId 
    ? users.filter(u => u.marketId === currentUser.marketId && u.isActive !== false)
    : [];

  const myTasks = tasks.filter(t => t.assignedTo === currentUser?.id);
  const pendingTasks = myTasks.filter(t => t.status === 'pending');
  const completedTasks = myTasks.filter(t => t.status === 'completed');

  const bgColor = isDarkMode ? '#1F2937' : '#F9FAFB';
  const cardBg = isDarkMode ? '#374151' : '#FFFFFF';
  const textColor = isDarkMode ? '#F9FAFB' : '#111827';
  const secondaryText = isDarkMode ? '#D1D5DB' : '#6B7280';
  const inputBg = isDarkMode ? '#4B5563' : '#F3F4F6';

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={20} color="#10B981" />;
      case 'in_progress': return <Clock size={20} color="#F59E0B" />;
      default: return <Target size={20} color="#6B7280" />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <Stack.Screen 
        options={{
          title: language === 'ku' ? 'کۆکردنەوەی هاوبەش' : 'Collaborative Collections',
          headerStyle: { backgroundColor: cardBg },
          headerTintColor: textColor,
        }}
      />
      
      <ScrollView style={styles.scrollView}>
        <LinearGradient
          colors={['#8B5CF6', '#6366F1']}
          style={styles.headerCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Users size={48} color="#FFF" />
          <Text style={styles.headerTitle}>
            {language === 'ku' ? 'تیمی کۆکردنەوە' : 'Collection Team'}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{pendingTasks.length}</Text>
              <Text style={styles.statLabel}>
                {language === 'ku' ? 'چاوەڕوان' : 'Pending'}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{completedTasks.length}</Text>
              <Text style={styles.statLabel}>
                {language === 'ku' ? 'تەواو' : 'Completed'}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{teamMembers.length}</Text>
              <Text style={styles.statLabel}>
                {language === 'ku' ? 'ئەندام' : 'Members'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              {language === 'ku' ? 'ئەرکەکانی من' : 'My Tasks'}
            </Text>
            {(currentUser?.role === 'manager' || currentUser?.role === 'owner') && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowAssignForm(!showAssignForm)}
              >
                <UserPlus size={20} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>

          {showAssignForm && (
            <View style={[styles.assignForm, { backgroundColor: cardBg }]}>
              <Text style={[styles.formTitle, { color: textColor }]}>
                {language === 'ku' ? 'ئەرکی نوێ' : 'New Task'}
              </Text>

              <Text style={[styles.label, { color: secondaryText }]}>
                {language === 'ku' ? 'قەرزدار' : 'Debtor'}
              </Text>
              <View style={[styles.picker, { backgroundColor: inputBg }]}>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => {
                    Alert.alert(
                      language === 'ku' ? 'هەڵبژاردنی قەرزدار' : 'Select Debtor',
                      '',
                      debtors.map(d => ({
                        text: d.name,
                        onPress: () => setSelectedDebtor(d.id),
                      }))
                    );
                  }}
                >
                  <Text style={{ color: textColor }}>
                    {selectedDebtor ? debtors.find(d => d.id === selectedDebtor)?.name : language === 'ku' ? 'هەڵبژێرە' : 'Select'}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.label, { color: secondaryText }]}>
                {language === 'ku' ? 'دیاریکردن بۆ' : 'Assign To'}
              </Text>
              <View style={[styles.picker, { backgroundColor: inputBg }]}>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => {
                    Alert.alert(
                      language === 'ku' ? 'هەڵبژاردنی ئەندام' : 'Select Member',
                      '',
                      teamMembers.map(u => ({
                        text: u.fullName || u.username,
                        onPress: () => setSelectedUser(u.id),
                      }))
                    );
                  }}
                >
                  <Text style={{ color: textColor }}>
                    {selectedUser ? teamMembers.find(u => u.id === selectedUser)?.fullName || teamMembers.find(u => u.id === selectedUser)?.username : language === 'ku' ? 'هەڵبژێرە' : 'Select'}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.label, { color: secondaryText }]}>
                {language === 'ku' ? 'وەسف' : 'Description'}
              </Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: inputBg, color: textColor }]}
                value={taskDescription}
                onChangeText={setTaskDescription}
                placeholder={language === 'ku' ? 'ئەرکەکە وەسف بکە...' : 'Describe the task...'}
                placeholderTextColor={secondaryText}
                multiline
              />

              <TouchableOpacity style={styles.createButton} onPress={createTask}>
                <Text style={styles.createButtonText}>
                  {language === 'ku' ? 'دروستکردن' : 'Create Task'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {myTasks.length === 0 && (
            <View style={[styles.emptyState, { backgroundColor: cardBg }]}>
              <Target size={48} color={secondaryText} />
              <Text style={[styles.emptyText, { color: secondaryText }]}>
                {language === 'ku' ? 'هیچ ئەرکێک نییە' : 'No tasks assigned'}
              </Text>
            </View>
          )}

          {myTasks.map(task => (
            <TouchableOpacity
              key={task.id}
              style={[styles.taskCard, { backgroundColor: cardBg }]}
              onPress={() => setSelectedTask(selectedTask === task.id ? null : task.id)}
            >
              <View style={styles.taskHeader}>
                {getStatusIcon(task.status)}
                <View style={styles.taskInfo}>
                  <Text style={[styles.taskDebtor, { color: textColor }]}>
                    {task.debtorName}
                  </Text>
                  <Text style={[styles.taskDesc, { color: secondaryText }]}>
                    {task.description}
                  </Text>
                </View>
                <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(task.priority) }]} />
              </View>

              {selectedTask === task.id && (
                <View style={styles.taskDetails}>
                  <View style={styles.taskMeta}>
                    <Text style={[styles.metaText, { color: secondaryText }]}>
                      {language === 'ku' ? 'دیاریکرا لەلایەن' : 'Assigned by'}: {task.assignedByName}
                    </Text>
                    <Text style={[styles.metaText, { color: secondaryText }]}>
                      {new Date(task.createdAt).toLocaleDateString()}
                    </Text>
                  </View>

                  {task.status !== 'completed' && (
                    <View style={styles.statusButtons}>
                      {task.status === 'pending' && (
                        <TouchableOpacity
                          style={[styles.statusButton, { backgroundColor: '#F59E0B' }]}
                          onPress={() => updateTaskStatus(task.id, 'in_progress')}
                        >
                          <Text style={styles.statusButtonText}>
                            {language === 'ku' ? 'دەستپێکردن' : 'Start'}
                          </Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={[styles.statusButton, { backgroundColor: '#10B981' }]}
                        onPress={() => updateTaskStatus(task.id, 'completed')}
                      >
                        <Text style={styles.statusButtonText}>
                          {language === 'ku' ? 'تەواوکردن' : 'Complete'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {task.notes.length > 0 && (
                    <View style={styles.notesSection}>
                      <Text style={[styles.notesTitle, { color: textColor }]}>
                        {language === 'ku' ? 'تێبینیەکان' : 'Notes'}
                      </Text>
                      {task.notes.map((note, index) => (
                        <Text key={index} style={[styles.noteText, { color: secondaryText }]}>
                          • {note}
                        </Text>
                      ))}
                    </View>
                  )}

                  <View style={styles.addNoteContainer}>
                    <TextInput
                      style={[styles.noteInput, { backgroundColor: inputBg, color: textColor }]}
                      value={newNote}
                      onChangeText={setNewNote}
                      placeholder={language === 'ku' ? 'تێبینی زیاد بکە...' : 'Add a note...'}
                      placeholderTextColor={secondaryText}
                    />
                    <TouchableOpacity
                      style={styles.sendButton}
                      onPress={() => addNote(task.id)}
                    >
                      <Send size={20} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            {language === 'ku' ? 'چالاکی تیم' : 'Team Activity'}
          </Text>

          {activities.length === 0 && (
            <View style={[styles.emptyState, { backgroundColor: cardBg }]}>
              <TrendingUp size={48} color={secondaryText} />
              <Text style={[styles.emptyText, { color: secondaryText }]}>
                {language === 'ku' ? 'هیچ چالاکیەک نییە' : 'No activity yet'}
              </Text>
            </View>
          )}

          {activities.slice(0, 10).map(activity => (
            <View key={activity.id} style={[styles.activityCard, { backgroundColor: cardBg }]}>
              <MessageSquare size={16} color="#8B5CF6" />
              <View style={styles.activityContent}>
                <Text style={[styles.activityUser, { color: textColor }]}>
                  {activity.userName}
                </Text>
                <Text style={[styles.activityText, { color: secondaryText }]}>
                  {language === 'ku' ? activity.actionKu : activity.action}
                </Text>
                <Text style={[styles.activityTime, { color: secondaryText }]}>
                  {new Date(activity.timestamp).toLocaleString()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  headerCard: {
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#FFF',
    marginTop: 16,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: '#FFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
    marginTop: 4,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  assignForm: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
    marginTop: 12,
  },
  picker: {
    borderRadius: 12,
    padding: 12,
  },
  pickerButton: {
    padding: 4,
  },
  textInput: {
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top' as const,
  },
  createButton: {
    backgroundColor: '#8B5CF6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
  taskCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskInfo: {
    flex: 1,
    marginLeft: 12,
  },
  taskDebtor: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  taskDesc: {
    fontSize: 14,
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  taskDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  taskMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaText: {
    fontSize: 12,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statusButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusButtonText: {
    color: '#FFF',
    fontWeight: '600' as const,
  },
  notesSection: {
    marginBottom: 12,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  noteText: {
    fontSize: 12,
    marginBottom: 4,
  },
  addNoteContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  noteInput: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activityContent: {
    flex: 1,
    marginLeft: 12,
  },
  activityUser: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  activityText: {
    fontSize: 13,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 11,
  },
});
