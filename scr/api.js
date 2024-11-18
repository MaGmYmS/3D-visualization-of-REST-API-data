import axios from 'axios';

const API_URL = 'http://localhost:8000';

export const getAllNodes = async () => {
    const response = await axios.get(`${API_URL}/nodes`);
    return response.data;
};

export const getNodeById = async (id) => {
    const response = await axios.get(`${API_URL}/nodes/${id}`);
    return response.data;
};

export const getAllNodesWithRelationships = async () => {
    const response = await axios.get(`${API_URL}/nodes_with_relationships`);
    return response.data;
};
