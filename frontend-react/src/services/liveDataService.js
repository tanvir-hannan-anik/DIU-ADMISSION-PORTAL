import axios from 'axios';
import API_CONFIG, { API_ENDPOINTS } from '../config/apiConfig';

const aiApi = axios.create({
  baseURL: API_CONFIG.AI_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

export const liveDataService = {
  /**
   * Fetch real-time scholarship data scraped from DIU's scholarship page.
   * @param {boolean} force - bypass cache and re-scrape
   */
  getScholarships: async (force = false) => {
    try {
      const url = API_ENDPOINTS.LIVE.SCHOLARSHIPS + (force ? '?force=1' : '');
      const response = await aiApi.get(url);
      return { success: true, data: response.data?.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  },

  /**
   * Fetch real-time tuition fee data scraped from DIU's fees page.
   * @param {boolean} force - bypass cache and re-scrape
   */
  getTuitionFees: async (force = false) => {
    try {
      const url = API_ENDPOINTS.LIVE.TUITION_FEES + (force ? '?force=1' : '');
      const response = await aiApi.get(url);
      return { success: true, data: response.data?.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  },

  /**
   * Official tuition-fee table (all programs) from Supabase — the 4 headline
   * figures per program: Payable During Admission, Average Semester Fees,
   * Total Tuition Fees, Total Program Fees. No scraping at request time, no tokens.
   * Returns { success, data: { [faculty]: [ {program_name, ...4 fees...} ] }, count }.
   */
  getTuitionFeeTable: async () => {
    try {
      const response = await aiApi.get(API_ENDPOINTS.LIVE.TUITION_TABLE);
      return { success: true, data: response.data?.data || {}, count: response.data?.count || 0 };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  },

  /**
   * Fetch the complete, structured faculty directory from Supabase (kb_faculty).
   * Served directly from the DB — no scraping at request time, no LLM tokens.
   * Returns { success, data: { success, faculty:[{name, designation, department}], count } }.
   */
  getFacultyList: async () => {
    try {
      const response = await aiApi.get(API_ENDPOINTS.LIVE.FACULTY_DIRECTORY);
      const faculty = response.data?.data || [];
      return {
        success: true,
        data: { success: true, faculty, count: faculty.length },
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  },

  /**
   * Fetch a single faculty member's detailed profile.
   * @param {string} profileUrl - the full URL on faculty.daffodilvarsity.edu.bd
   */
  getFacultyProfile: async (profileUrl) => {
    try {
      const url = `${API_ENDPOINTS.LIVE.FACULTY_PROFILE}?url=${encodeURIComponent(profileUrl)}`;
      const response = await aiApi.get(url);
      return { success: true, data: response.data?.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  },

  /**
   * Force-refresh all scraper caches on the backend.
   */
  refreshCaches: async () => {
    try {
      const response = await aiApi.post(API_ENDPOINTS.LIVE.REFRESH);
      return { success: true, message: response.data?.message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  },

  /**
   * Refresh caches AND rebuild the Qdrant RAG index with live data.
   */
  refreshRAG: async () => {
    try {
      const response = await aiApi.post(API_ENDPOINTS.LIVE.REFRESH_RAG);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  },
};
