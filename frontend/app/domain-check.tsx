import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Constants from 'expo-constants';

interface DomainResult {
  domain: string;
  available: boolean;
  price?: string;
}

interface DomainCheckResponse {
  domain_name: string;
  results: DomainResult[];
}

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function DomainCheckScreen() {
  const router = useRouter();
  const { name } = useLocalSearchParams<{ name: string }>();
  const [loading, setLoading] = useState(false);
  const [domainResults, setDomainResults] = useState<DomainCheckResponse | null>(null);
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');

  useEffect(() => {
    if (name) {
      checkDomains();
    }
  }, [name]);

  const checkDomains = async () => {
    if (!name) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/check-domain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error('Failed to check domains');
      }

      const result = await response.json();
      setDomainResults(result);
    } catch (error) {
      Alert.alert(
        language === 'ar' ? 'خطأ' : 'Error',
        language === 'ar' ? 'فشل في فحص النطاقات' : 'Failed to check domains'
      );
      console.error('Domain check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const openRegistrar = (domain: string) => {
    // Open domain registrar (simplified - in production, you'd use specific registrar APIs)
    const registrarUrl = `https://www.namecheap.com/domains/registration/results/?domain=${domain}`;
    Linking.openURL(registrarUrl);
  };

  const getStatusColor = (available: boolean) => {
    return available ? '#10b981' : '#ef4444';
  };

  const getStatusText = (available: boolean) => {
    if (language === 'ar') {
      return available ? 'متوفر' : 'مُسجل';
    } else {
      return available ? 'Available' : 'Taken';
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
          {language === 'ar' ? 'فحص النطاقات' : 'Domain Check'}
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

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>
              {language === 'ar' ? 'جارٍ فحص النطاقات...' : 'Checking domains...'}
            </Text>
          </View>
        )}

        {/* Domain Results */}
        {domainResults && !loading && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>
              {language === 'ar' ? 'نتائج النطاقات:' : 'Domain Results:'}
            </Text>
            
            {domainResults.results.map((result, index) => (
              <View key={index} style={styles.domainCard}>
                <View style={styles.domainHeader}>
                  <Text style={styles.domainName}>{result.domain}</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(result.available) + '20' }
                  ]}>
                    <View style={[
                      styles.statusIndicator,
                      { backgroundColor: getStatusColor(result.available) }
                    ]} />
                    <Text style={[
                      styles.statusText,
                      { color: getStatusColor(result.available) }
                    ]}>
                      {getStatusText(result.available)}
                    </Text>
                  </View>
                </View>
                
                {result.available && result.price && (
                  <Text style={styles.priceText}>
                    {language === 'ar' ? 'السعر التقديري:' : 'Estimated Price:'} {result.price}
                  </Text>
                )}
                
                {result.available && (
                  <TouchableOpacity
                    style={styles.registerButton}
                    onPress={() => openRegistrar(result.domain)}
                  >
                    <Ionicons name="open-outline" size={20} color="#ffffff" />
                    <Text style={styles.registerButtonText}>
                      {language === 'ar' ? 'تسجيل النطاق' : 'Register Domain'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={24} color="#6366f1" />
            <Text style={styles.infoText}>
              {language === 'ar' 
                ? 'يتم فحص النطاقات في الوقت الفعلي. النتائج قد تختلف حسب مزود النطاق.'
                : 'Domains are checked in real-time. Results may vary depending on the domain provider.'
              }
            </Text>
          </View>
          
          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark-outline" size={24} color="#10b981" />
            <Text style={styles.infoText}>
              {language === 'ar'
                ? 'ننصح بتسجيل النطاق بأسرع وقت ممكن إذا كان متوفراً.'
                : 'We recommend registering the domain as soon as possible if available.'
              }
            </Text>
          </View>
        </View>

        {/* Refresh Button */}
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={checkDomains}
          disabled={loading}
        >
          <Ionicons name="refresh-outline" size={20} color="#6366f1" />
          <Text style={styles.refreshButtonText}>
            {language === 'ar' ? 'إعادة الفحص' : 'Refresh Check'}
          </Text>
        </TouchableOpacity>
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
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 16,
  },
  resultsSection: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 15,
  },
  domainCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  domainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  domainName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  priceText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 16,
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
    marginBottom: 12,
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
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 12,
    marginVertical: 20,
    borderWidth: 2,
    borderColor: '#6366f1',
    gap: 8,
  },
  refreshButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
});