import { useState, useEffect, useCallback } from "react";
import { carService } from "../services/carService";

export const useCars = (initialFilters = {}) => {
  const [cars, setCars] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ page: 1, limit: 12, ...initialFilters });

  const fetchCars = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      const res = await carService.getCars(params || filters);
      setCars(res.data.cars);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load cars");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchCars(); }, [filters]);

  const updateFilters = (newFilters) =>
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));

  const setPage = (page) => setFilters((prev) => ({ ...prev, page }));

  return { cars, total, pages, loading, error, filters, updateFilters, setPage, refetch: fetchCars };
};
