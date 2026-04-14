import api from "./api";

export const testDriveService = {
  getMyTestDrives: () => api.get("/test-drives"),
  createTestDrive: (payload) => api.post("/test-drives", payload),
  updateTestDrive: (id, payload) => api.patch(`/test-drives/${id}`, payload),
};
