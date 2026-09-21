import client from "./http/client";

// Vendor APIs
export const getVendors = async (query = "") => {
  const params = query ? { q: query } : {};
  const res = await client.get("/vendors", { params });
  return res.data;
};

export const getVendorById = async (id) => {
  const res = await client.get(`/vendors/${id}`);
  return res.data;
};

export const createVendor = async (data) => {
  const res = await client.post("/admin/vendors", data);
  return res.data;
};

export const updateVendor = async (id, data) => {
  const res = await client.put(`/admin/vendors/${id}`, data);
  return res.data;
};

export const deleteVendor = async (id) => {
  await client.delete(`/admin/vendors/${id}`);
};

export const deactivateVendor = async (id) => {
  const res = await client.patch(`/admin/vendors/${id}/deactivate`);
  return res.data;
};

export const activateVendor = async (id) => {
  const res = await client.patch(`/admin/vendors/${id}/activate`);
  return res.data;
};

export const getInactiveVendors = async (query = "") => {
  const params = query ? { q: query } : {};
  const res = await client.get("/admin/vendors/inactive", { params });
  return res.data;
};

// Equipment APIs
export const getEquipmentByVendor = async (vendorId) => {
  const res = await client.get(`/vendors/${vendorId}/equipment`);
  return res.data;
};

export const getEquipmentById = async (id) => {
  const res = await client.get(`/equipment/${id}`);
  return res.data;
};

export const getAllEquipment = async (query = "") => {
  const params = query ? { q: query } : {};
  const res = await client.get("/admin/equipment", { params });
  return res.data;
};

export const createEquipment = async (data) => {
  const res = await client.post("/admin/vendors/" + data.vendorId + "/equipment", data);
  return res.data;
};

export const updateEquipment = async (id, data) => {
  const res = await client.put(`/admin/equipment/${id}`, data);
  return res.data;
};

export const deleteEquipment = async (id) => {
  await client.delete(`/admin/equipment/${id}`);
};

export const deactivateEquipment = async (id) => {
  const res = await client.patch(`/admin/equipment/${id}/deactivate`);
  return res.data;
};

export const activateEquipment = async (id) => {
  const res = await client.patch(`/admin/equipment/${id}/activate`);
  return res.data;
};

export const getInactiveEquipment = async (query = "") => {
  const params = query ? { q: query } : {};
  const res = await client.get("/admin/equipment/inactive", { params });
  return res.data;
};

export const uploadEquipmentImage = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await client.post("/admin/equipment/upload-image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};
