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
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Constants from 'expo-constants';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LogoGenerationResponse {
  company_name: string;
  style: string;
  colors: string[];
  result: {
    success: boolean;
    image_url?: string;
    image_base64?: string;
    prompt?: string;
    error?: string;
    fallback_description?: string;
  };
}

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function LogoGeneratorScreen() {
  const router = useRouter();
  const { name, language: passedLanguage } = useLocalSearchParams<{ name: string; language: string }>();
  const [loading, setLoading] = useState(false);
  const [logoResult, setLogoResult] = useState<LogoGenerationResponse | null>(null);
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [style, setStyle] = useState('modern');
  const [selectedColors, setSelectedColors] = useState<string[]>(['blue', 'white']);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        // First check if language was passed as parameter
        if (passedLanguage) {
          setLanguage(passedLanguage as 'ar' | 'en');
        } else {
          // Otherwise load from AsyncStorage
          const savedLang = await AsyncStorage.getItem('appLanguage');
          if (savedLang) {
            setLanguage(savedLang as 'ar' | 'en');
          }
        }
      } catch (error) {
        console.error('Error loading language:', error);
      }
    };

    loadLanguage();
  }, [passedLanguage]);

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
      const response = await fetch(`/api/generate-logo-image`, {
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
      
      setLogoResult(result);
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
              {language === 'ar' ? 'اللوغو المولد:' : 'Generated Logo:'}
            </Text>
            
            {logoResult.result.success ? (
              <View style={styles.logoResultCard}>
                {/* Logo Image */}
                {logoResult.result.image_base64 && (
                  <View style={styles.logoImageContainer}>
                    <Image 
                      source={{ uri: logoResult.result.image_base64 }}
                      style={styles.logoImage}
                      resizeMode="contain"
                    />
                  </View>
                )}
                
                {/* Logo Info */}
                <View style={styles.logoInfo}>
                  <Text style={styles.logoTitle}>
                    {logoResult.company_name}
                  </Text>
                  <Text style={styles.logoStyle}>
                    {language === 'ar' ? 'النمط:' : 'Style:'} {logoResult.style}
                  </Text>
                  <Text style={styles.logoColors}>
                    {language === 'ar' ? 'الألوان:' : 'Colors:'} {logoResult.colors.join(', ')}
                  </Text>
                </View>
                
                {/* Action Buttons */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.downloadButton}
                    onPress={() => {
                      if (logoResult.result.image_url) {
                        Linking.openURL(logoResult.result.image_url);
                      }
                    }}
                  >
                    <Ionicons name="download-outline" size={20} color="#ffffff" />
                    <Text style={styles.downloadButtonText}>
                      {language === 'ar' ? 'تحميل' : 'Download'}
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
            ) : (
              <View style={styles.errorCard}>
                <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
                <Text style={styles.errorTitle}>
                  {language === 'ar' ? 'فشل في توليد الصورة' : 'Image Generation Failed'}
                </Text>
                <Text style={styles.errorMessage}>
                  {logoResult.result.error || (language === 'ar' ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred')}
                </Text>
                {logoResult.result.fallback_description && (
                  <Text style={styles.fallbackDescription}>
                    {logoResult.result.fallback_description}
                  </Text>
                )}
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => {
                    setLogoResult(null);
                    generateLogo();
                  }}
                >
                  <Ionicons name="refresh-outline" size={20} color="#6366f1" />
                  <Text style={styles.retryButtonText}>
                    {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
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
  logoResultCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  logoImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
  },
  logoImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  logoInfo: {
    marginBottom: 20,
  },
  logoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  logoStyle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  logoColors: {
    fontSize: 14,
    color: '#64748b',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  downloadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#6366f1',
    borderRadius: 8,
    gap: 8,
  },
  downloadButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  regenerateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    gap: 8,
  },
  regenerateButtonText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '600',
  },
  errorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#fecaca',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ef4444',
    marginTop: 12,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 12,
  },
  fallbackDescription: {
    fontSize: 14,
    color: '#6366f1',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    color: '#6366f1',
    fontSize: 14,
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