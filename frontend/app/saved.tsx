import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';

interface SavedName {
  id: string;
  name: string;
  category: string;
  timestamp: string;
  is_favorite: boolean;
}

export default function SavedScreen() {
  const router = useRouter();
  const [savedNames, setSavedNames] = useState<SavedName[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'favorite' | 'category'>('recent');
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');

  useEffect(() => {
    loadSavedNames();
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLang = await AsyncStorage.getItem('language');
      if (savedLang) {
        setLanguage(savedLang as 'ar' | 'en');
      }
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };

  const loadSavedNames = async () => {
    try {
      const saved = await AsyncStorage.getItem('savedNames');
      if (saved) {
        setSavedNames(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading saved names:', error);
    }
  };

  const toggleFavorite = async (id: string) => {
    const updatedNames = savedNames.map(name =>
      name.id === id ? { ...name, is_favorite: !name.is_favorite } : name
    );
    setSavedNames(updatedNames);
    await AsyncStorage.setItem('savedNames', JSON.stringify(updatedNames));
  };

  const deleteName = async (id: string) => {
    Alert.alert(
      language === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete',
      language === 'ar' ? 'هل تريد حذف هذا الاسم؟' : 'Do you want to delete this name?',
      [
        { text: language === 'ar' ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: language === 'ar' ? 'حذف' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedNames = savedNames.filter(name => name.id !== id);
            setSavedNames(updatedNames);
            await AsyncStorage.setItem('savedNames', JSON.stringify(updatedNames));
          }
        }
      ]
    );
  };

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert(
      language === 'ar' ? 'تم النسخ' : 'Copied',
      language === 'ar' ? 'تم نسخ النص' : 'Text copied to clipboard'
    );
  };

  const filteredNames = savedNames
    .filter(name => 
      name.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      name.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'favorite':
          if (a.is_favorite && !b.is_favorite) return -1;
          if (!a.is_favorite && b.is_favorite) return 1;
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
    });

  const getCategoryName = (category: string) => {
    const categories: Record<string, { ar: string; en: string }> = {
      ai: { ar: 'الذكاء الاصطناعي', en: 'AI Generation' },
      sector: { ar: 'حسب القطاع', en: 'By Sector' },
      abbreviated: { ar: 'مختصرة', en: 'Abbreviated' },
      compound: { ar: 'تركيبي', en: 'Compound' },
      smart_random: { ar: 'عشوائي ذكي', en: 'Smart Random' },
      geographic: { ar: 'جغرافي', en: 'Geographic' },
      length_based: { ar: 'حسب الطول', en: 'Length Based' },
      personality: { ar: 'حسب الشخصية', en: 'Personality' },
    };
    return categories[category]?.[language] || category;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        
        <Text style={styles.title}>
          {language === 'ar' ? 'الأسماء المحفوظة' : 'Saved Names'}
        </Text>
        
        <TouchableOpacity
          style={styles.languageButton}
          onPress={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
        >
          <Text style={styles.languageButtonText}>
            {language === 'ar' ? 'EN' : 'عر'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder={language === 'ar' ? 'البحث في الأسماء...' : 'Search names...'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, sortBy === 'recent' && styles.activeFilterButton]}
            onPress={() => setSortBy('recent')}
          >
            <Text style={[styles.filterText, sortBy === 'recent' && styles.activeFilterText]}>
              {language === 'ar' ? 'الأحدث' : 'Recent'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, sortBy === 'favorite' && styles.activeFilterButton]}
            onPress={() => setSortBy('favorite')}
          >
            <Text style={[styles.filterText, sortBy === 'favorite' && styles.activeFilterText]}>
              {language === 'ar' ? 'المفضلة' : 'Favorites'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, sortBy === 'category' && styles.activeFilterButton]}
            onPress={() => setSortBy('category')}
          >
            <Text style={[styles.filterText, sortBy === 'category' && styles.activeFilterText]}>
              {language === 'ar' ? 'الفئة' : 'Category'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Saved Names List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredNames.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="bookmark-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>
              {language === 'ar' ? 'لا توجد أسماء محفوظة' : 'No Saved Names'}
            </Text>
            <Text style={styles.emptyDescription}>
              {language === 'ar' ? 'ابدأ بتوليد أسماء جديدة واحفظها هنا' : 'Start generating names and save them here'}
            </Text>
          </View>
        ) : (
          filteredNames.map((savedName) => (
            <View key={savedName.id} style={styles.nameCard}>
              <View style={styles.nameHeader}>
                <View style={styles.nameInfo}>
                  <Text style={styles.nameText}>{savedName.name}</Text>
                  <Text style={styles.categoryText}>
                    {getCategoryName(savedName.category)}
                  </Text>
                  <Text style={styles.timestampText}>
                    {new Date(savedName.timestamp).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                  </Text>
                </View>
                
                <TouchableOpacity
                  style={styles.favoriteButton}
                  onPress={() => toggleFavorite(savedName.id)}
                >
                  <Ionicons
                    name={savedName.is_favorite ? "heart" : "heart-outline"}
                    size={24}
                    color={savedName.is_favorite ? "#ef4444" : "#64748b"}
                  />
                </TouchableOpacity>
              </View>
              
              <View style={styles.nameActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => copyToClipboard(savedName.name)}
                >
                  <Ionicons name="copy-outline" size={20} color="#6366f1" />
                  <Text style={styles.actionText}>
                    {language === 'ar' ? 'نسخ' : 'Copy'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => router.push({
                    pathname: '/domain-check',
                    params: { name: savedName.name }
                  })}
                >
                  <Ionicons name="globe-outline" size={20} color="#6366f1" />
                  <Text style={styles.actionText}>
                    {language === 'ar' ? 'نطاق' : 'Domain'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => router.push({
                    pathname: '/logo-generator',
                    params: { name: savedName.name }
                  })}
                >
                  <Ionicons name="image-outline" size={20} color="#6366f1" />
                  <Text style={styles.actionText}>
                    {language === 'ar' ? 'لوغو' : 'Logo'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteName(savedName.id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  languageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
  },
  languageButtonText: {
    color: '#6366f1',
    fontWeight: '600',
  },
  searchSection: {
    padding: 20,
    backgroundColor: '#ffffff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#1e293b',
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    marginRight: 10,
  },
  activeFilterButton: {
    backgroundColor: '#6366f1',
  },
  filterText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  activeFilterText: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#64748b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  nameCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  nameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  nameInfo: {
    flex: 1,
  },
  nameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 14,
    color: '#6366f1',
    marginBottom: 2,
  },
  timestampText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  favoriteButton: {
    padding: 8,
  },
  nameActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
  },
});