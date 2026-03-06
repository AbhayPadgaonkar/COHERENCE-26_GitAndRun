"""Analytics Repository - Firebase data fetching with hierarchical filters"""
from typing import List, Dict, Optional
from app.core.firebase import FirebaseConfig
from app.core.logger import logger


class AnalyticsRepository:
    """Repository for fetching analytics data from Firebase"""
    
    def __init__(self):
        self.db = FirebaseConfig.get_db()
    
    def get_schemes_by_level(self, level: Optional[str] = None, entity_id: Optional[str] = None) -> List[Dict]:
        """Get schemes filtered by level and entity"""
        try:
            schemes_ref = self.db.collection('schemes')
            
            if level:
                schemes_ref = schemes_ref.where('level', '==', level)
            if entity_id:
                schemes_ref = schemes_ref.where('managing_entity_id', '==', entity_id)
            
            docs = schemes_ref.stream()
            schemes = []
            for doc in docs:
                data = doc.to_dict()
                data['document_id'] = doc.id
                schemes.append(data)
            
            return schemes
        except Exception as e:
            logger.error(f"Error fetching schemes: {e}")
            return []
    
    def get_fund_flows_by_entity(self, level: Optional[str] = None, entity_id: Optional[str] = None) -> List[Dict]:
        """Get fund flows filtered by entity level"""
        try:
            flows_ref = self.db.collection('fund_flows')
            
            if level:
                flows_ref = flows_ref.where('to_level', '==', level)
            if entity_id:
                flows_ref = flows_ref.where('to_entity_id', '==', entity_id)
            
            docs = flows_ref.stream()
            flows = []
            for doc in docs:
                data = doc.to_dict()
                data['document_id'] = doc.id
                flows.append(data)
            
            return flows
        except Exception as e:
            logger.error(f"Error fetching fund flows: {e}")
            return []
    
    def get_utilization_by_entity(self, level: Optional[str] = None, entity_id: Optional[str] = None) -> List[Dict]:
        """Get utilization records filtered by entity"""
        try:
            util_ref = self.db.collection('utilization')
            
            if level:
                util_ref = util_ref.where('level', '==', level)
            if entity_id:
                util_ref = util_ref.where('entity_id', '==', entity_id)
            
            docs = util_ref.stream()
            utilizations = []
            for doc in docs:
                data = doc.to_dict()
                data['document_id'] = doc.id
                utilizations.append(data)
            
            return utilizations
        except Exception as e:
            logger.error(f"Error fetching utilization: {e}")
            return []
    
    def get_anomalies_by_entity(self, entity_id: Optional[str] = None, severity: Optional[str] = None) -> List[Dict]:
        """Get anomalies filtered by entity"""
        try:
            anomalies_ref = self.db.collection('anomalies')
            
            if entity_id:
                anomalies_ref = anomalies_ref.where('entity_id', '==', entity_id)
            if severity:
                anomalies_ref = anomalies_ref.where('severity', '==', severity)
            
            docs = anomalies_ref.stream()
            anomalies = []
            for doc in docs:
                data = doc.to_dict()
                data['document_id'] = doc.id
                anomalies.append(data)
            
            return anomalies
        except Exception as e:
            logger.error(f"Error fetching anomalies: {e}")
            return []
    
    def get_nodal_agencies_by_scheme(self, scheme_id: str) -> List[Dict]:
        """Get nodal agencies for a specific scheme"""
        try:
            agencies_ref = self.db.collection('nodal_agencies').where('scheme_id', '==', scheme_id)
            docs = agencies_ref.stream()
            agencies = []
            for doc in docs:
                data = doc.to_dict()
                data['document_id'] = doc.id
                agencies.append(data)
            
            return agencies
        except Exception as e:
            logger.error(f"Error fetching nodal agencies: {e}")
            return []
    
    def get_all_fund_flows(self) -> List[Dict]:
        """Get all fund flows (for central dashboard)"""
        try:
            docs = self.db.collection('fund_flows').stream()
            flows = []
            for doc in docs:
                data = doc.to_dict()
                data['document_id'] = doc.id
                flows.append(data)
            return flows
        except Exception as e:
            logger.error(f"Error fetching all fund flows: {e}")
            return []
    
    def get_district_data(self, district_id: str) -> Dict:
        """Get comprehensive data for a specific district"""
        try:
            # Get utilization for district
            utilization = self.get_utilization_by_entity(level='District', entity_id=district_id)
            
            # Get fund flows to district
            fund_flows = self.get_fund_flows_by_entity(level='District', entity_id=district_id)
            
            # Get anomalies for district
            anomalies = self.get_anomalies_by_entity(entity_id=district_id)
            
            return {
                'utilization': utilization,
                'fund_flows': fund_flows,
                'anomalies': anomalies
            }
        except Exception as e:
            logger.error(f"Error fetching district data: {e}")
            return {'utilization': [], 'fund_flows': [], 'anomalies': []}
    
    def get_state_aggregated_data(self, state_id: str) -> Dict:
        """Get aggregated data for state (includes all districts)"""
        try:
            # Get state-level utilization
            state_util = self.get_utilization_by_entity(level='State', entity_id=state_id)
            
            # Get state-level fund flows
            state_flows = self.get_fund_flows_by_entity(level='State', entity_id=state_id)
            
            # Get state schemes
            state_schemes = self.get_schemes_by_level(level='State', entity_id=state_id)
            
            # Get state anomalies
            state_anomalies = self.get_anomalies_by_entity(entity_id=state_id)
            
            return {
                'utilization': state_util,
                'fund_flows': state_flows,
                'schemes': state_schemes,
                'anomalies': state_anomalies
            }
        except Exception as e:
            logger.error(f"Error fetching state data: {e}")
            return {'utilization': [], 'fund_flows': [], 'schemes': [], 'anomalies': []}
    
    def get_central_aggregated_data(self) -> Dict:
        """Get aggregated data for central dashboard (all data)"""
        try:
            # Get all schemes
            all_schemes = self.get_schemes_by_level()
            
            # Get all fund flows
            all_flows = self.get_all_fund_flows()
            
            # Get all utilization
            all_util = self.get_utilization_by_entity()
            
            # Get all anomalies
            all_anomalies = self.get_anomalies_by_entity()
            
            return {
                'schemes': all_schemes,
                'fund_flows': all_flows,
                'utilization': all_util,
                'anomalies': all_anomalies
            }
        except Exception as e:
            logger.error(f"Error fetching central data: {e}")
            return {'schemes': [], 'fund_flows': [], 'utilization': [], 'anomalies': []}
