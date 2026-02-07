#!/usr/bin/env python3

import requests
import sys
import json
import uuid
from datetime import datetime

class CareLensAPITester:
    def __init__(self, base_url="https://health-insights-ai.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED {details}")
        else:
            self.failed_tests.append(f"{name} - {details}")
            print(f"❌ {name} - FAILED {details}")

    def test_api_endpoint(self, method, endpoint, expected_status, data=None, headers=None):
        """Generic API test method"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method.upper() == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            
            success = response.status_code == expected_status
            return success, response
        except Exception as e:
            return False, str(e)

    def test_seed_data(self):
        """Test seeding initial data"""
        print("\n🌱 Testing seed data...")
        success, response = self.test_api_endpoint("POST", "seed", 200)
        
        if success:
            try:
                result = response.json()
                self.log_test("Seed Data", True, f"Message: {result.get('message', '')}")
            except:
                self.log_test("Seed Data", True, "Seeded successfully")
        else:
            if hasattr(response, 'status_code'):
                self.log_test("Seed Data", False, f"Status: {response.status_code}, Response: {response.text[:100]}")
            else:
                self.log_test("Seed Data", False, f"Error: {response}")

    def test_user_registration(self):
        """Test user registration for patient and doctor"""
        print("\n👤 Testing user registration...")
        
        # Test patient registration
        patient_data = {
            "name": f"Test Patient {uuid.uuid4().hex[:8]}",
            "email": f"patient_{uuid.uuid4().hex[:8]}@test.com",
            "password": "testpass123",
            "phone": "+91 98765 43210",
            "role": "patient"
        }
        
        success, response = self.test_api_endpoint("POST", "auth/register", 200, patient_data)
        
        if success:
            try:
                result = response.json()
                if result.get('token') and result.get('user'):
                    self.token = result['token']
                    self.user_data = result['user']
                    self.log_test("Patient Registration", True, f"User: {self.user_data.get('name')}")
                else:
                    self.log_test("Patient Registration", False, "Missing token or user data")
            except:
                self.log_test("Patient Registration", False, "Invalid JSON response")
        else:
            if hasattr(response, 'status_code'):
                self.log_test("Patient Registration", False, f"Status: {response.status_code}")
            else:
                self.log_test("Patient Registration", False, f"Error: {response}")

        # Test doctor registration
        doctor_data = {
            "name": f"Dr. Test Doctor {uuid.uuid4().hex[:8]}",
            "email": f"doctor_{uuid.uuid4().hex[:8]}@test.com", 
            "password": "testpass123",
            "phone": "+91 98765 43211",
            "role": "doctor"
        }
        
        success, response = self.test_api_endpoint("POST", "auth/register", 200, doctor_data)
        self.log_test("Doctor Registration", success, f"Status: {response.status_code if hasattr(response, 'status_code') else 'Error'}")

    def test_user_login(self):
        """Test user login"""
        if not self.user_data:
            print("\n⚠️  Skipping login test - no user data from registration")
            return
            
        print("\n🔑 Testing user login...")
        
        login_data = {
            "email": self.user_data['email'], 
            "password": "testpass123"
        }
        
        success, response = self.test_api_endpoint("POST", "auth/login", 200, login_data)
        
        if success:
            try:
                result = response.json()
                if result.get('token'):
                    # Update token from login 
                    self.token = result['token']
                    self.log_test("User Login", True, f"Token received")
                else:
                    self.log_test("User Login", False, "No token in response")
            except:
                self.log_test("User Login", False, "Invalid JSON response")
        else:
            if hasattr(response, 'status_code'):
                self.log_test("User Login", False, f"Status: {response.status_code}")
            else:
                self.log_test("User Login", False, f"Error: {response}")

    def test_get_current_user(self):
        """Test getting current user info"""
        if not self.token:
            print("\n⚠️  Skipping current user test - no token")
            return
            
        print("\n👤 Testing get current user...")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        success, response = self.test_api_endpoint("GET", "auth/me", 200, headers=headers)
        
        if success:
            try:
                result = response.json()
                if result.get('id') and result.get('email'):
                    self.log_test("Get Current User", True, f"User: {result.get('name')}")
                else:
                    self.log_test("Get Current User", False, "Missing user data")
            except:
                self.log_test("Get Current User", False, "Invalid JSON response")
        else:
            if hasattr(response, 'status_code'):
                self.log_test("Get Current User", False, f"Status: {response.status_code}")
            else:
                self.log_test("Get Current User", False, f"Error: {response}")

    def test_hospitals_nearby(self):
        """Test nearby hospitals API"""
        print("\n🏥 Testing nearby hospitals...")
        
        # Test with Kovilpatti coordinates
        success, response = self.test_api_endpoint("GET", "hospitals/nearby?lat=9.17&lng=77.87&radius=50", 200)
        
        if success:
            try:
                result = response.json()
                if isinstance(result, list):
                    self.log_test("Hospitals Nearby", True, f"Found {len(result)} hospitals")
                else:
                    self.log_test("Hospitals Nearby", False, "Response is not a list")
            except:
                self.log_test("Hospitals Nearby", False, "Invalid JSON response")
        else:
            if hasattr(response, 'status_code'):
                self.log_test("Hospitals Nearby", False, f"Status: {response.status_code}")
            else:
                self.log_test("Hospitals Nearby", False, f"Error: {response}")

    def test_hospitals_by_city(self):
        """Test hospitals by city search"""
        print("\n🏥 Testing hospitals by city...")
        
        success, response = self.test_api_endpoint("GET", "hospitals/by-city?city=Kovilpatti", 200)
        
        if success:
            try:
                result = response.json()
                if result.get('hospitals') and isinstance(result['hospitals'], list):
                    self.log_test("Hospitals By City", True, f"Found {len(result['hospitals'])} hospitals in {result.get('city')}")
                else:
                    self.log_test("Hospitals By City", False, "No hospitals list in response")
            except:
                self.log_test("Hospitals By City", False, "Invalid JSON response")
        else:
            if hasattr(response, 'status_code'):
                self.log_test("Hospitals By City", False, f"Status: {response.status_code}")
            else:
                self.log_test("Hospitals By City", False, f"Error: {response}")

    def test_bp_monitoring(self):
        """Test BP monitoring functionality"""
        if not self.token:
            print("\n⚠️  Skipping BP tests - no token")
            return
            
        print("\n🫀 Testing BP monitoring...")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        
        # Add BP record
        bp_data = {
            "systolic": 120,
            "diastolic": 80,
            "pulse": 72,
            "notes": "Morning reading"
        }
        
        success, response = self.test_api_endpoint("POST", "bp/record", 200, bp_data, headers)
        
        if success:
            try:
                result = response.json()
                if result.get('status') and result.get('systolic'):
                    self.log_test("Add BP Record", True, f"Status: {result['status']}, Reading: {result['systolic']}/{result['diastolic']}")
                else:
                    self.log_test("Add BP Record", False, "Missing BP data in response")
            except:
                self.log_test("Add BP Record", False, "Invalid JSON response")
        else:
            if hasattr(response, 'status_code'):
                self.log_test("Add BP Record", False, f"Status: {response.status_code}")
            else:
                self.log_test("Add BP Record", False, f"Error: {response}")

        # Get BP records
        success, response = self.test_api_endpoint("GET", "bp/records", 200, headers=headers)
        
        if success:
            try:
                result = response.json()
                if isinstance(result, list):
                    self.log_test("Get BP Records", True, f"Found {len(result)} records")
                else:
                    self.log_test("Get BP Records", False, "Response is not a list")
            except:
                self.log_test("Get BP Records", False, "Invalid JSON response")
        else:
            if hasattr(response, 'status_code'):
                self.log_test("Get BP Records", False, f"Status: {response.status_code}")
            else:
                self.log_test("Get BP Records", False, f"Error: {response}")

    def test_ai_chat(self):
        """Test AI chat functionality"""
        if not self.token:
            print("\n⚠️  Skipping AI chat test - no token")
            return
            
        print("\n🤖 Testing AI chat...")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        
        chat_data = {
            "message": "I have a headache. What should I do?",
            "language": "English"
        }
        
        # Give extra time for AI response
        url = f"{self.api_url}/chat/message"
        test_headers = {'Content-Type': 'application/json'}
        test_headers.update(headers)
        
        try:
            response = requests.post(url, json=chat_data, headers=test_headers, timeout=60)
            success = response.status_code == 200
            
            if success:
                try:
                    result = response.json()
                    if result.get('response') and result.get('session_id'):
                        self.log_test("AI Chat Message", True, f"Got response (length: {len(result['response'])})")
                    else:
                        self.log_test("AI Chat Message", False, "Missing response or session_id")
                except:
                    self.log_test("AI Chat Message", False, "Invalid JSON response")
            else:
                self.log_test("AI Chat Message", False, f"Status: {response.status_code}, Error: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("AI Chat Message", False, f"Request error: {str(e)}")

    def test_ambulance_request(self):
        """Test ambulance request"""
        if not self.token:
            print("\n⚠️  Skipping ambulance test - no token")
            return
            
        print("\n🚑 Testing ambulance request...")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        
        ambulance_data = {
            "lat": 9.1742,
            "lng": 77.8697, 
            "patient_name": "Test Patient",
            "phone": "+91 98765 43210",
            "emergency_type": "general",
            "notes": "Test emergency request"
        }
        
        success, response = self.test_api_endpoint("POST", "ambulance/request", 200, ambulance_data, headers)
        
        if success:
            try:
                result = response.json()
                if result.get('status') and result.get('eta_minutes'):
                    self.log_test("Ambulance Request", True, f"Status: {result['status']}, ETA: {result['eta_minutes']} mins")
                else:
                    self.log_test("Ambulance Request", False, "Missing status or ETA")
            except:
                self.log_test("Ambulance Request", False, "Invalid JSON response")
        else:
            if hasattr(response, 'status_code'):
                self.log_test("Ambulance Request", False, f"Status: {response.status_code}")
            else:
                self.log_test("Ambulance Request", False, f"Error: {response}")

    def test_dashboard_stats(self):
        """Test dashboard stats"""
        if not self.token:
            print("\n⚠️  Skipping dashboard stats test - no token")
            return
            
        print("\n📊 Testing dashboard stats...")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        success, response = self.test_api_endpoint("GET", "dashboard/stats", 200, headers=headers)
        
        if success:
            try:
                result = response.json()
                if 'bp_readings' in result and 'ai_consultations' in result:
                    self.log_test("Dashboard Stats", True, f"BP readings: {result['bp_readings']}, AI chats: {result['ai_consultations']}")
                else:
                    self.log_test("Dashboard Stats", False, "Missing required stats")
            except:
                self.log_test("Dashboard Stats", False, "Invalid JSON response")
        else:
            if hasattr(response, 'status_code'):
                self.log_test("Dashboard Stats", False, f"Status: {response.status_code}")
            else:
                self.log_test("Dashboard Stats", False, f"Error: {response}")

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting CareLens AI Backend API Tests...")
        print(f"📍 Base URL: {self.base_url}")
        
        # Test basic functionality first
        self.test_seed_data()
        self.test_user_registration()
        self.test_user_login()
        self.test_get_current_user()
        
        # Test hospital services
        self.test_hospitals_nearby()
        self.test_hospitals_by_city()
        
        # Test health monitoring features
        self.test_bp_monitoring()
        
        # Test AI and emergency services (more likely to have issues)
        self.test_ai_chat() 
        self.test_ambulance_request()
        self.test_dashboard_stats()
        
        # Print final results
        print(f"\n📋 Test Results Summary:")
        print(f"✅ Tests Passed: {self.tests_passed}/{self.tests_run}")
        print(f"❌ Tests Failed: {len(self.failed_tests)}/{self.tests_run}")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests:")
            for failed in self.failed_tests:
                print(f"   - {failed}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"\n📊 Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = CareLensAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())