import api from "./api";

export const carService = {
  // Get all cars with filters & pagination
  getCars: (params) => api.get("/cars", { params }),

  // Get single car
  getCar: (id) => api.get(`/cars/${id}`),

  // Create listing (FormData for images)
  createCar: (formData) =>
    api.post("/cars", formData, { headers: { "Content-Type": "multipart/form-data" } }),

  // Update listing
  updateCar: (id, formData) =>
    api.patch(`/cars/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } }),

  // Delete listing
  deleteCar: (id) => api.delete(`/cars/${id}`),

  // Get my listings
  getMyCars: () => api.get("/cars/my/listings"),
};
