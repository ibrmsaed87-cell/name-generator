#!/usr/bin/env python3
"""
Comprehensive Backend Test Suite for Spinel Name Generator API
Tests all endpoints with both Arabic and English languages
"""

import requests
import json
import uuid
import time
from typing import Dict, List, Any
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')

# Get backend URL from frontend .env
BACKEND_URL = os.getenv('EXPO_PUBLIC_BACKEND_URL', 'http://10.150.0.2')
API_BASE_URL = f"{BACKEND_URL}/api"

class SpinelAPITester:
    def __init__(self):
        self.base_url = API_BASE_URL
        self.test_results = []
        self.saved_name_ids = []  # Track created names for cleanup
        
    def log_result(self, test_name: str, success: bool, message: str, details: Dict = None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "details": details or {}
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def test_health_check(self):
        """Test basic API health check"""
        try:
            response = requests.get(f"{self.base_url}/", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "Spinel" in data["message"]:
                    self.log_result("Health Check", True, "API is responding correctly")
                    return True
                else:
                    self.log_result("Health Check", False, "Unexpected response format", {"response": data})
            else:
                self.log_result("Health Check", False, f"HTTP {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result("Health Check", False, f"Connection error: {str(e)}")
        return False
    
    def test_ai_name_generation(self, language: str):
        """Test AI-powered name generation"""
        test_name = f"AI Name Generation ({language})"
        try:
            payload = {
                "type": "ai",
                "language": language,
                "sector": "Technology" if language == "en" else "التكنولوجيا",
                "keywords": ["innovation", "digital"] if language == "en" else ["ابتكار", "رقمي"],
                "count": 3
            }
            
            response = requests.post(f"{self.base_url}/generate-names", json=payload, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if "names" in data and isinstance(data["names"], list) and len(data["names"]) > 0:
                    self.log_result(test_name, True, f"Generated {len(data['names'])} names", {"names": data["names"]})
                    return True
                else:
                    self.log_result(test_name, False, "No names generated", {"response": data})
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result(test_name, False, f"Error: {str(e)}")
        return False
    
    def test_sector_name_generation(self, language: str):
        """Test sector-based name generation"""
        test_name = f"Sector Name Generation ({language})"
        try:
            payload = {
                "type": "sector",
                "language": language,
                "sector": "Healthcare" if language == "en" else "الصحة",
                "count": 5
            }
            
            response = requests.post(f"{self.base_url}/generate-names", json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "names" in data and len(data["names"]) == 5:
                    self.log_result(test_name, True, f"Generated {len(data['names'])} sector-based names")
                    return True
                else:
                    self.log_result(test_name, False, "Incorrect number of names generated", {"response": data})
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result(test_name, False, f"Error: {str(e)}")
        return False
    
    def test_abbreviated_names(self, language: str):
        """Test abbreviated name generation"""
        test_name = f"Abbreviated Names ({language})"
        try:
            payload = {
                "type": "abbreviated",
                "language": language,
                "keywords": ["Smart", "Tech", "Solutions"] if language == "en" else ["ذكي", "تقني", "حلول"],
                "count": 3
            }
            
            response = requests.post(f"{self.base_url}/generate-names", json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "names" in data and len(data["names"]) > 0:
                    self.log_result(test_name, True, f"Generated {len(data['names'])} abbreviated names")
                    return True
                else:
                    self.log_result(test_name, False, "No abbreviated names generated", {"response": data})
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result(test_name, False, f"Error: {str(e)}")
        return False
    
    def test_compound_names(self, language: str):
        """Test compound name generation"""
        test_name = f"Compound Names ({language})"
        try:
            payload = {
                "type": "compound",
                "language": language,
                "count": 4
            }
            
            response = requests.post(f"{self.base_url}/generate-names", json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "names" in data and len(data["names"]) == 4:
                    self.log_result(test_name, True, f"Generated {len(data['names'])} compound names")
                    return True
                else:
                    self.log_result(test_name, False, "Incorrect number of compound names", {"response": data})
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result(test_name, False, f"Error: {str(e)}")
        return False
    
    def test_smart_random_names(self, language: str):
        """Test smart random name generation"""
        test_name = f"Smart Random Names ({language})"
        try:
            payload = {
                "type": "smart_random",
                "language": language,
                "count": 5
            }
            
            response = requests.post(f"{self.base_url}/generate-names", json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "names" in data and len(data["names"]) == 5:
                    self.log_result(test_name, True, f"Generated {len(data['names'])} smart random names")
                    return True
                else:
                    self.log_result(test_name, False, "Incorrect number of smart random names", {"response": data})
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result(test_name, False, f"Error: {str(e)}")
        return False
    
    def test_geographic_names(self, language: str):
        """Test geographic name generation"""
        test_name = f"Geographic Names ({language})"
        try:
            payload = {
                "type": "geographic",
                "language": language,
                "location": "Riyadh" if language == "en" else "الرياض",
                "count": 3
            }
            
            response = requests.post(f"{self.base_url}/generate-names", json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "names" in data and len(data["names"]) == 3:
                    self.log_result(test_name, True, f"Generated {len(data['names'])} geographic names")
                    return True
                else:
                    self.log_result(test_name, False, "Incorrect number of geographic names", {"response": data})
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result(test_name, False, f"Error: {str(e)}")
        return False
    
    def test_length_based_names(self, language: str):
        """Test length-based name generation"""
        test_name = f"Length-based Names ({language})"
        try:
            payload = {
                "type": "length_based",
                "language": language,
                "length": 7,
                "count": 4
            }
            
            response = requests.post(f"{self.base_url}/generate-names", json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "names" in data and len(data["names"]) == 4:
                    self.log_result(test_name, True, f"Generated {len(data['names'])} length-based names")
                    return True
                else:
                    self.log_result(test_name, False, "Incorrect number of length-based names", {"response": data})
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result(test_name, False, f"Error: {str(e)}")
        return False
    
    def test_personality_names(self, language: str):
        """Test personality-based name generation"""
        test_name = f"Personality Names ({language})"
        try:
            payload = {
                "type": "personality",
                "language": language,
                "personality": "Creative" if language == "en" else "مبدع",
                "count": 3
            }
            
            response = requests.post(f"{self.base_url}/generate-names", json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "names" in data and len(data["names"]) == 3:
                    self.log_result(test_name, True, f"Generated {len(data['names'])} personality-based names")
                    return True
                else:
                    self.log_result(test_name, False, "Incorrect number of personality names", {"response": data})
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result(test_name, False, f"Error: {str(e)}")
        return False
    
    def test_domain_check(self):
        """Test domain availability checking"""
        test_name = "Domain Availability Check"
        try:
            payload = {
                "name": "TechInnovate2024"
            }
            
            response = requests.post(f"{self.base_url}/check-domain", json=payload, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                if "results" in data and isinstance(data["results"], list) and len(data["results"]) > 0:
                    # Check if we have domain results with expected structure
                    first_result = data["results"][0]
                    if "domain" in first_result and "available" in first_result:
                        self.log_result(test_name, True, f"Checked {len(data['results'])} domains")
                        return True
                    else:
                        self.log_result(test_name, False, "Invalid domain result structure", {"response": data})
                else:
                    self.log_result(test_name, False, "No domain results returned", {"response": data})
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result(test_name, False, f"Error: {str(e)}")
        return False
    
    def test_logo_generation(self):
        """Test AI logo description generation"""
        test_name = "Logo Generation"
        try:
            payload = {
                "company_name": "InnovateTech Solutions",
                "style": "modern",
                "colors": ["blue", "white", "silver"]
            }
            
            response = requests.post(f"{self.base_url}/generate-logo", json=payload, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if "logo_description" in data and "company_name" in data:
                    self.log_result(test_name, True, "Logo description generated successfully")
                    return True
                else:
                    self.log_result(test_name, False, "Invalid logo response structure", {"response": data})
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result(test_name, False, f"Error: {str(e)}")
        return False
    
    def test_save_name(self):
        """Test saving a generated name"""
        test_name = "Save Name"
        try:
            payload = {
                "name": "TechVision Pro",
                "category": "Technology"
            }
            
            response = requests.post(f"{self.base_url}/save-name", json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and "name" in data and data["name"] == payload["name"]:
                    self.saved_name_ids.append(data["id"])  # Track for cleanup
                    self.log_result(test_name, True, f"Name saved with ID: {data['id']}")
                    return data["id"]
                else:
                    self.log_result(test_name, False, "Invalid save response", {"response": data})
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result(test_name, False, f"Error: {str(e)}")
        return None
    
    def test_get_saved_names(self):
        """Test retrieving saved names"""
        test_name = "Get Saved Names"
        try:
            response = requests.get(f"{self.base_url}/saved-names", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result(test_name, True, f"Retrieved {len(data)} saved names")
                    return True
                else:
                    self.log_result(test_name, False, "Response is not a list", {"response": data})
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result(test_name, False, f"Error: {str(e)}")
        return False
    
    def test_toggle_favorite(self, name_id: str):
        """Test toggling favorite status"""
        test_name = "Toggle Favorite"
        try:
            response = requests.put(f"{self.base_url}/saved-names/{name_id}/favorite", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "is_favorite" in data and "message" in data:
                    self.log_result(test_name, True, f"Favorite toggled: {data['is_favorite']}")
                    return True
                else:
                    self.log_result(test_name, False, "Invalid favorite response", {"response": data})
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result(test_name, False, f"Error: {str(e)}")
        return False
    
    def test_delete_saved_name(self, name_id: str):
        """Test deleting a saved name"""
        test_name = "Delete Saved Name"
        try:
            response = requests.delete(f"{self.base_url}/saved-names/{name_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data:
                    self.log_result(test_name, True, "Name deleted successfully")
                    return True
                else:
                    self.log_result(test_name, False, "Invalid delete response", {"response": data})
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result(test_name, False, f"Error: {str(e)}")
        return False
    
    def test_error_handling(self):
        """Test error handling for invalid requests"""
        test_name = "Error Handling"
        try:
            # Test invalid generation type
            payload = {
                "type": "invalid_type",
                "language": "en",
                "count": 5
            }
            
            response = requests.post(f"{self.base_url}/generate-names", json=payload, timeout=10)
            
            if response.status_code == 400:
                self.log_result(test_name, True, "Correctly handled invalid generation type")
                return True
            else:
                self.log_result(test_name, False, f"Expected 400, got {response.status_code}", {"response": response.text})
        except Exception as e:
            self.log_result(test_name, False, f"Error: {str(e)}")
        return False
    
    def cleanup_test_data(self):
        """Clean up any test data created during testing"""
        print("\n🧹 Cleaning up test data...")
        for name_id in self.saved_name_ids:
            try:
                requests.delete(f"{self.base_url}/saved-names/{name_id}", timeout=5)
                print(f"   Deleted test name: {name_id}")
            except:
                pass  # Ignore cleanup errors
    
    def run_all_tests(self):
        """Run the complete test suite"""
        print("🚀 Starting Spinel Name Generator API Test Suite")
        print(f"📍 Testing API at: {self.base_url}")
        print("=" * 60)
        
        # Basic connectivity test
        if not self.test_health_check():
            print("❌ API is not accessible. Stopping tests.")
            return False
        
        print("\n📝 Testing Name Generation Features...")
        
        # Test all generation types for both languages
        languages = ["en", "ar"]
        generation_tests = [
            self.test_ai_name_generation,
            self.test_sector_name_generation,
            self.test_abbreviated_names,
            self.test_compound_names,
            self.test_smart_random_names,
            self.test_geographic_names,
            self.test_length_based_names,
            self.test_personality_names
        ]
        
        for test_func in generation_tests:
            for lang in languages:
                test_func(lang)
                time.sleep(0.5)  # Small delay between tests
        
        print("\n🌐 Testing Domain and Logo Features...")
        self.test_domain_check()
        self.test_logo_generation()
        
        print("\n💾 Testing CRUD Operations...")
        # Test CRUD operations
        saved_id = self.test_save_name()
        self.test_get_saved_names()
        
        if saved_id:
            self.test_toggle_favorite(saved_id)
            self.test_delete_saved_name(saved_id)
        
        print("\n🛡️ Testing Error Handling...")
        self.test_error_handling()
        
        # Cleanup
        self.cleanup_test_data()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"✅ Passed: {passed}/{total}")
        print(f"❌ Failed: {total - passed}/{total}")
        
        if total - passed > 0:
            print("\n🔍 Failed Tests:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   • {result['test']}: {result['message']}")
        
        return passed == total

def main():
    """Main test execution"""
    tester = SpinelAPITester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 All tests passed! The Spinel Name Generator API is working correctly.")
        exit(0)
    else:
        print("\n⚠️  Some tests failed. Please check the issues above.")
        exit(1)

if __name__ == "__main__":
    main()