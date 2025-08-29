import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Constants from 'expo-constants';
import * as Clipboard from 'expo-clipboard';

interface LogoGenerationResponse {
  company_name: string;
  logo_description: string;
  preview_url?: string;
  download_formats: string[];
}

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function LogoGeneratorScreen() {
  const router = useRouter();
  const { name } = useLocalSearchParams<{ name: string }>();
  const [loading, setLoading] = useState(false);
  const [logoResult, setLogoResult] = useState<LogoGenerationResponse | null>(null);
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [style, setStyle] = useState('modern');
  const [selectedColors, setSelectedColors] = useState<string[]>(['blue', 'white']);

  const styles_options = [
    { id: 'modern', nameAr: 'عصري', nameEn: 'Modern' },
    { id: 'classic', nameAr: 'كلاسيكي', nameEn: 'Classic' },
    { id: 'minimalist', nameAr: 'بسيط', nameEn: 'Minimalist' },
    { id: 'bold', nameAr: 'جريء', nameEn: 'Bold' },
    { id: 'elegant', nameAr: 'أنيق', nameEn: 'Elegant' },
    { id: 'playful', nameAr: 'مرح', nameEn: 'Playful' },
  ];

  const colorOptions = [
    { id: 'blue', nameAr: 'أزرق', nameEn: 'Blue', color: '#3b82f6' },
    { id: 'red', nameAr: 'أحمر', nameEn: 'Red', color: '#ef4444' },
    { id: 'green', nameAr: 'أخضر', nameEn: 'Green', color: '#10b981' },
    { id: 'purple', nameAr: 'بنفسجي', nameEn: 'Purple', color: '#8b5cf6' },
    { id: 'orange', nameAr: 'برتقالي', nameEn: 'Orange', color: '#f97316' },
    { id: 'black', nameAr: 'أسود', nameEn: 'Black', color: '#1f2937' },
    { id: 'white', nameAr: 'أبيض', nameEn: 'White', color: '#ffffff' },
    { id: 'gray', nameAr: 'رمادي', nameEn: 'Gray', color: '#6b7280' },
  ];

  const generateLogo = async () => {
    if (!name) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/generate-logo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_name: name,
          style,
          colors: selectedColors,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate logo');
      }

      const result = await response.json();
      console.log('Logo API response:', result);
      
      // Parse JSON if it's inside the description
      let description = result.logo_description;
      try {
        if (description.includes('```json')) {
          // Extract JSON from markdown code block
          const jsonMatch = description.match(/```json\n([\s\S]*?)\n```/);
          if (jsonMatch) {
            const jsonData = JSON.parse(jsonMatch[1]);
            description = `${jsonData.concept}\n\nالطباعة: ${jsonData.typography}\n\nالألوان: الأزرق الأساسي والأبيض الثانوي\n\nالتخطيط: ${jsonData.layout}`;
          }
        }
      } catch (e) {
        console.log('JSON parsing failed, using original description');
      }
      
      setLogoResult({
        ...result,
        logo_description: description
      });
    } catch (error) {
      Alert.alert(
        language === 'ar' ? 'خطأ' : 'Error',
        language === 'ar' ? 'فشل في توليد اللوغو' : 'Failed to generate logo'
      );
      console.error('Logo generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleColorSelection = (colorId: string) => {
    setSelectedColors(prev => {
      if (prev.includes(colorId)) {
        return prev.filter(c => c !== colorId);
      } else if (prev.length < 3) {
        return [...prev, colorId];
      }
      return prev;
    });
  };

  const copyDescription = async () => {
    if (logoResult?.logo_description) {
      await Clipboard.setStringAsync(logoResult.logo_description);
      Alert.alert(
        language === 'ar' ? 'تم النسخ' : 'Copied',
        language === 'ar' ? 'تم نسخ وصف اللوغو' : 'Logo description copied'
      );
    }
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
          {language === 'ar' ? 'مولد اللوغو' : 'Logo Generator'}
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Company Name */}
        <View style={styles.nameSection}>
          <Text style={styles.nameLabel}>
            {language === 'ar' ? 'اسم الشركة:' : 'Company Name:'}
          </Text>
          <Text style={styles.nameText}>{name}</Text>
        </View>

        {/* Style Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'ar' ? 'نمط اللوغو:' : 'Logo Style:'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsContainer}>
            {styles_options.map((styleOption) => (
              <TouchableOpacity
                key={styleOption.id}
                style={[
                  styles.tag,
                  style === styleOption.id && styles.selectedTag
                ]}
                onPress={() => setStyle(styleOption.id)}
              >
                <Text style={[
                  styles.tagText,
                  style === styleOption.id && styles.selectedTagText
                ]}>
                  {language === 'ar' ? styleOption.nameAr : styleOption.nameEn}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Color Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'ar' ? 'الألوان (حد أقصى 3):' : 'Colors (Max 3):'}
          </Text>
          <View style={styles.colorGrid}>
            {colorOptions.map((colorOption) => (
              <TouchableOpacity
                key={colorOption.id}
                style={[
                  styles.colorOption,
                  { backgroundColor: colorOption.color },
                  selectedColors.includes(colorOption.id) && styles.selectedColorOption,
                  colorOption.id === 'white' && styles.whiteColorBorder
                ]}
                onPress={() => toggleColorSelection(colorOption.id)}
              >
                {selectedColors.includes(colorOption.id) && (
                  <Ionicons 
                    name="checkmark" 
                    size={16} 
                    color={colorOption.id === 'white' ? '#1f2937' : '#ffffff'} 
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.selectedColorsContainer}>
            <Text style={styles.selectedColorsLabel}>
              {language === 'ar' ? 'الألوان المختارة:' : 'Selected Colors:'}
            </Text>
            <Text style={styles.selectedColorsText}>
              {selectedColors.map(colorId => {
                const colorOption = colorOptions.find(c => c.id === colorId);
                return language === 'ar' ? colorOption?.nameAr : colorOption?.nameEn;
              }).join(', ')}
            </Text>
          </View>
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          style={[styles.generateButton, loading && styles.disabledButton]}
          onPress={generateLogo}
          disabled={loading || selectedColors.length === 0}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Ionicons name="create-outline" size={24} color="#ffffff" />
              <Text style={styles.generateButtonText}>
                {language === 'ar' ? 'توليد اللوغو' : 'Generate Logo'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Logo Result */}
        {logoResult && !loading && (
          <View style={styles.resultSection}>
            <Text style={styles.sectionTitle}>
              {language === 'ar' ? 'وصف اللوغو المولد:' : 'Generated Logo Description:'}
            </Text>
            
            <View style={styles.descriptionCard}>
              <Text style={styles.descriptionText}>
                {logoResult.logo_description}
              </Text>
              
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={copyDescription}
                >
                  <Ionicons name="copy-outline" size={20} color="#6366f1" />
                  <Text style={styles.copyButtonText}>
                    {language === 'ar' ? 'نسخ الوصف' : 'Copy Description'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.regenerateButton}
                  onPress={() => {
                    setLogoResult(null);
                    generateLogo();
                  }}
                >
                  <Ionicons name="refresh-outline" size={20} color="#10b981" />
                  <Text style={styles.regenerateButtonText}>
                    {language === 'ar' ? 'إعادة توليد' : 'Regenerate'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Available Formats */}
            <View style={styles.formatsSection}>
              <Text style={styles.formatsTitle}>
                {language === 'ar' ? 'صيغ متوفرة:' : 'Available Formats:'}
              </Text>
              <View style={styles.formatsList}>
                {logoResult.download_formats.map((format, index) => (
                  <View key={index} style={styles.formatTag}>
                    <Text style={styles.formatText}>{format}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={24} color="#6366f1" />
            <Text style={styles.infoText}>
              {language === 'ar'
                ? 'هذا المولد يقدم وصفاً تفصيلياً للوغو. يمكنك استخدام هذا الوصف مع مصمم أو أدوات التصميم.'
                : 'This generator provides a detailed logo description. You can use this description with a designer or design tools.'
              }
            </Text>
          </View>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  nameSection: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  nameLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
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
  tagsContainer: {
    marginTop: 5,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 8,
  },
  selectedTag: {
    backgroundColor: '#6366f1',
  },
  tagText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  selectedTagText: {
    color: '#ffffff',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColorOption: {
    borderColor: '#6366f1',
    borderWidth: 3,
  },
  whiteColorBorder: {
    borderColor: '#e2e8f0',
    borderWidth: 2,
  },
  selectedColorsContainer: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
  },
  selectedColorsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  selectedColorsText: {
    fontSize: 14,
    color: '#64748b',
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
  resultSection: {
    marginVertical: 20,
  },
  descriptionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  descriptionText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  copyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    gap: 8,
  },
  copyButtonText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
  regenerateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    gap: 8,
  },
  regenerateButtonText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },
  formatsSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  formatsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  formatsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  formatTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
  },
  formatText: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '600',
  },
  infoSection: {
    marginVertical: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
});