// Simple API functions for data storage
const API_BASE = process.env.NODE_ENV === 'development' ? 
  (window.location.hostname === 'localhost' ? 'http://localhost:3001' : `http://${window.location.hostname}:3001`) : '';

export const foodsAPI = {
  async getAll() {
    try {
      const response = await fetch(`${API_BASE}/api/foods`);
      if (!response.ok) throw new Error('Failed to fetch foods');
      return await response.json();
    } catch (error) {
      console.warn('Failed to fetch foods from server, using localStorage fallback');
      const savedFoods = localStorage.getItem('fridgeManager_foods');
      return savedFoods ? JSON.parse(savedFoods) : [];
    }
  },

  async save(foods: any[]) {
    try {
      const response = await fetch(`${API_BASE}/api/foods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(foods),
      });
      if (!response.ok) throw new Error('Failed to save foods');
    } catch (error) {
      console.warn('Failed to save foods to server, using localStorage fallback');
      localStorage.setItem('fridgeManager_foods', JSON.stringify(foods));
    }
  }
};

export const recipesAPI = {
  async getAll() {
    try {
      const response = await fetch(`${API_BASE}/api/recipes`);
      if (!response.ok) throw new Error('Failed to fetch recipes');
      return await response.json();
    } catch (error) {
      console.warn('Failed to fetch recipes from server, using localStorage fallback');
      const savedRecipes = localStorage.getItem('fridgeManager_recipes');
      return savedRecipes ? JSON.parse(savedRecipes) : [];
    }
  },

  async save(recipes: any[]) {
    try {
      const response = await fetch(`${API_BASE}/api/recipes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recipes),
      });
      if (!response.ok) throw new Error('Failed to save recipes');
    } catch (error) {
      console.warn('Failed to save recipes to server, using localStorage fallback');
      localStorage.setItem('fridgeManager_recipes', JSON.stringify(recipes));
    }
  }
};