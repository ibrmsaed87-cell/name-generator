import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

// Types
interface GeneratedName {
  name: string;
  id: string;
}

interface SavedName {
  id: string;
  name: string;
  category: string;
  timestamp: string;
  is_favorite: boolean;
}

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost';

export default function HomeScreen() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string>('ai');
  const [language, setLanguage] = useState<string>('ar');
  const [loading, setLoading] = useState<boolean>(false);
  const [generatedNames, setGeneratedNames] = useState<GeneratedName[]>([]);
  const [savedNames, setSavedNames] = useState<SavedName[]>([]);
  const [formData, setFormData] = useState({
    sector: '',
    keywords: '',
    length: '',
    personality: '',
    location: '',
    count: '5'
  });

  const generationTypes = [
    { id: 'ai', nameAr: 'الذكاء الاصطناعي', nameEn: 'AI Generation', icon: 'bulb-outline' },
    { id: 'sector', nameAr: 'حسب القطاع', nameEn: 'By Sector', icon: 'business-outline' },
    { id: 'abbreviated', nameAr: 'أسماء مختصرة', nameEn: 'Abbreviated', icon: 'text-outline' },
    { id: 'compound', nameAr: 'تركيبي', nameEn: 'Compound', icon: 'layers-outline' },
    { id: 'smart_random', nameAr: 'عشوائي ذكي', nameEn: 'Smart Random', icon: 'shuffle-outline' },
    { id: 'geographic', nameAr: 'جغرافي', nameEn: 'Geographic', icon: 'location-outline' },
    { id: 'length_based', nameAr: 'حسب الطول', nameEn: 'Length Based', icon: 'resize-outline' },
    { id: 'personality', nameAr: 'حسب الشخصية', nameEn: 'Personality', icon: 'person-outline' },
  ];

  const sectors = language === 'ar' ? [
    'التكنولوجيا', 'التجارة الإلكترونية', 'الصحة', 'التعليم', 'العقارات',
    'السياحة', 'المطاعم', 'الأزياء', 'التمويل', 'الاستشارات'
  ] : [
    'Technology', 'E-commerce', 'Healthcare', 'Education', 'Real Estate',
    'Tourism', 'Restaurant', 'Fashion', 'Finance', 'Consulting'
  ];

  const personalities = language === 'ar' ? [
    'قوي', 'مبدع', 'موثوق', 'سريع', 'ذكي', 'عصري', 'أنيق', 'محترف'
  ] : [
    'Strong', 'Creative', 'Reliable', 'Fast', 'Smart', 'Modern', 'Elegant', 'Professional'
  ];

  useEffect(() => {
    loadSavedNames();
  }, []);

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

  const generateNames = async () => {
    setLoading(true);
    try {
      const requestData = {
        type: selectedType,
        language,
        count: parseInt(formData.count) || 5,
        sector: formData.sector || undefined,
        keywords: formData.keywords ? formData.keywords.split(',').map(k => k.trim()) : undefined,
        length: formData.length ? parseInt(formData.length) : undefined,
        personality: formData.personality || undefined,
        location: formData.location || undefined,
      };

      const response = await fetch(`${BACKEND_URL}/api/generate-names`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('API Response status:', response.status);
      console.log('Backend URL:', BACKEND_URL);

      if (!response.ok) {
        throw new Error('Failed to generate names');
      }

      const result = await response.json();
      setGeneratedNames(result.names.map((name: string, index: number) => ({
        name,
        id: `${Date.now()}_${index}`
      })));
    } catch (error) {
      Alert.alert(
        language === 'ar' ? 'خطأ' : 'Error',
        language === 'ar' ? 'فشل في توليد الأسماء' : 'Failed to generate names'
      );
      console.error('Error generating names:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveName = async (name: string) => {
    try {
      const newSavedName: SavedName = {
        id: Date.now().toString(),
        name,
        category: selectedType,
        timestamp: new Date().toISOString(),
        is_favorite: false
      };

      const updatedSavedNames = [...savedNames, newSavedName];
      setSavedNames(updatedSavedNames);
      await AsyncStorage.setItem('savedNames', JSON.stringify(updatedSavedNames));
      
      Alert.alert(
        language === 'ar' ? 'تم الحفظ' : 'Saved',
        language === 'ar' ? 'تم حفظ الاسم بنجاح' : 'Name saved successfully'
      );
    } catch (error) {
      Alert.alert(
        language === 'ar' ? 'خطأ' : 'Error',
        language === 'ar' ? 'فشل في حفظ الاسم' : 'Failed to save name'
      );
    }
  };

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert(
      language === 'ar' ? 'تم النسخ' : 'Copied',
      language === 'ar' ? 'تم نسخ النص' : 'Text copied to clipboard'
    );
  };

  const checkDomain = (name: string) => {
    router.push({
      pathname: '/domain-check',
      params: { name }
    });
  };

  const generateLogo = (name: string) => {
    router.push({
      pathname: '/logo-generator',
      params: { name }
    });
  };

  const renderForm = () => {
    switch (selectedType) {
      case 'sector':
        return (
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>
              {language === 'ar' ? 'اختر القطاع:' : 'Select Sector:'}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsContainer}>
              {sectors.map((sector, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.tag,
                    formData.sector === sector && styles.selectedTag
                  ]}
                  onPress={() => setFormData({ ...formData, sector })}
                >
                  <Text style={[
                    styles.tagText,
                    formData.sector === sector && styles.selectedTagText
                  ]}>
                    {sector}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      case 'ai':
        return (
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>
              {language === 'ar' ? 'كلمات مفتاحية (اختياري):' : 'Keywords (Optional):'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={language === 'ar' ? 'مثال: تقنية، سريع، مبدع' : 'e.g: tech, fast, creative'}
              value={formData.keywords}
              onChangeText={(text) => setFormData({ ...formData, keywords: text })}
            />
          </View>
        );

      case 'abbreviated':
        return (
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>
              {language === 'ar' ? 'كلمات للاختصار:' : 'Words to Abbreviate:'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={language === 'ar' ? 'مثال: شركة، تقنية، حلول' : 'e.g: company, tech, solutions'}
              value={formData.keywords}
              onChangeText={(text) => setFormData({ ...formData, keywords: text })}
            />
          </View>
        );

      case 'length_based':
        return (
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>
              {language === 'ar' ? 'طول الاسم المطلوب:' : 'Desired Name Length:'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="6"
              value={formData.length}
              onChangeText={(text) => setFormData({ ...formData, length: text })}
              keyboardType="numeric"
            />
          </View>
        );

      case 'personality':
        return (
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>
              {language === 'ar' ? 'اختر الشخصية:' : 'Select Personality:'}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsContainer}>
              {personalities.map((personality, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.tag,
                    formData.personality === personality && styles.selectedTag
                  ]}
                  onPress={() => setFormData({ ...formData, personality })}
                >
                  <Text style={[
                    styles.tagText,
                    formData.personality === personality && styles.selectedTagText
                  ]}>
                    {personality}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      case 'geographic':
        return (
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>
              {language === 'ar' ? 'الموقع الجغرافي (اختياري):' : 'Geographic Location (Optional):'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={language === 'ar' ? 'مثال: الرياض، جدة' : 'e.g: Riyadh, Dubai'}
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
            />
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>
            {language === 'ar' ? 'مولد أسماء الشركات' : 'Business Name Generator'}
          </Text>
          <Text style={styles.subtitle}>
            {language === 'ar' ? 'سبينل جينيريتر' : 'Spinel Generator'}
          </Text>
        </View>
        
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.languageButton}
            onPress={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
          >
            <Text style={styles.languageButtonText}>
              {language === 'ar' ? 'EN' : 'عر'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.savedButton}
            onPress={() => router.push('/saved')}
          >
            <Ionicons name="bookmark-outline" size={24} color="#6366f1" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Generation Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'ar' ? 'نوع التوليد:' : 'Generation Type:'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.typesContainer}>
              {generationTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeCard,
                    selectedType === type.id && styles.selectedTypeCard
                  ]}
                  onPress={() => setSelectedType(type.id)}
                >
                  <Ionicons
                    name={type.icon as any}
                    size={24}
                    color={selectedType === type.id ? '#ffffff' : '#6366f1'}
                  />
                  <Text style={[
                    styles.typeText,
                    selectedType === type.id && styles.selectedTypeText
                  ]}>
                    {language === 'ar' ? type.nameAr : type.nameEn}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Form */}
        {renderForm()}

        {/* Count Input */}
        <View style={styles.formSection}>
          <Text style={styles.formLabel}>
            {language === 'ar' ? 'عدد الأسماء:' : 'Number of Names:'}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="5"
            value={formData.count}
            onChangeText={(text) => setFormData({ ...formData, count: text })}
            keyboardType="numeric"
          />
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          style={[styles.generateButton, loading && styles.disabledButton]}
          onPress={generateNames}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Ionicons name="flash-outline" size={24} color="#ffffff" />
              <Text style={styles.generateButtonText}>
                {language === 'ar' ? 'توليد الأسماء' : 'Generate Names'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Results */}
        {generatedNames.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {language === 'ar' ? 'الأسماء المولدة:' : 'Generated Names:'}
            </Text>
            {generatedNames.map((item, index) => (
              <View key={item.id} style={styles.nameCard}>
                <View style={styles.nameHeader}>
                  <Text style={styles.nameIndex}>{index + 1}</Text>
                  <Text style={styles.nameText}>{item.name}</Text>
                </View>
                
                <View style={styles.nameActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => copyToClipboard(item.name)}
                  >
                    <Ionicons name="copy-outline" size={20} color="#6366f1" />
                    <Text style={styles.actionText}>
                      {language === 'ar' ? 'نسخ' : 'Copy'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => saveName(item.name)}
                  >
                    <Ionicons name="bookmark-outline" size={20} color="#6366f1" />
                    <Text style={styles.actionText}>
                      {language === 'ar' ? 'حفظ' : 'Save'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => checkDomain(item.name)}
                  >
                    <Ionicons name="globe-outline" size={20} color="#6366f1" />
                    <Text style={styles.actionText}>
                      {language === 'ar' ? 'نطاق' : 'Domain'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => generateLogo(item.name)}
                  >
                    <Ionicons name="image-outline" size={20} color="#6366f1" />
                    <Text style={styles.actionText}>
                      {language === 'ar' ? 'لوغو' : 'Logo'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  savedButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 15,
  },
  typesContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 5,
  },
  typeCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    minWidth: 100,
    gap: 8,
  },
  selectedTypeCard: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
    textAlign: 'center',
  },
  selectedTypeText: {
    color: '#ffffff',
  },
  formSection: {
    marginVertical: 15,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  tagsContainer: {
    marginTop: 5,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedTag: {
    backgroundColor: '#6366f1',
  },
  tagText: {
    fontSize: 14,
    color: '#374151',
  },
  selectedTagText: {
    color: '#ffffff',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    marginVertical: 20,
    gap: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  generateButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  nameCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  nameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  nameIndex: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6366f1',
    marginRight: 12,
    minWidth: 24,
  },
  nameText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  nameActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  actionButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    minWidth: 60,
  },
  actionText: {
    fontSize: 10,
    color: '#6366f1',
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
});