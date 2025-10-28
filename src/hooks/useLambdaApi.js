import { useState, useCallback } from 'react';
import { adminApi, dashboardApi } from '../services/api';

export const useLambdaApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  // Generic function to call any API method
  const callApi = useCallback(async (apiMethod, ...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiMethod(...args);
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Admin operations
  const getAllAdmins = useCallback(() => {
    return callApi(adminApi.getAllAdmins);
  }, [callApi]);

  const getAdminById = useCallback((adminId) => {
    return callApi(adminApi.getAdminById, adminId);
  }, [callApi]);

  const createAdmin = useCallback((adminData) => {
    return callApi(adminApi.createAdmin, adminData);
  }, [callApi]);

  const updateAdmin = useCallback((adminId, adminData) => {
    return callApi(adminApi.updateAdmin, adminId, adminData);
  }, [callApi]);

  const deleteAdmin = useCallback((adminId) => {
    return callApi(adminApi.deleteAdmin, adminId);
  }, [callApi]);

  // Dashboard operations
  const getDashboardStats = useCallback(() => {
    return callApi(dashboardApi.getDashboardStats);
  }, [callApi]);

  const getChartData = useCallback((filter) => {
    return callApi(dashboardApi.getChartData, filter);
  }, [callApi]);

  const getNewScamTypes = useCallback((limit) => {
    return callApi(dashboardApi.getNewScamTypes, limit);
  }, [callApi]);

  // Reset state
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    // State
    loading,
    error,
    data,
    // Admin Methods
    getAllAdmins,
    getAdminById,
    createAdmin,
    updateAdmin,
    deleteAdmin,
    // Dashboard Methods
    getDashboardStats,
    getChartData,
    getNewScamTypes,
    // Utility
    reset,
    callApi
  };
};

export default useLambdaApi;