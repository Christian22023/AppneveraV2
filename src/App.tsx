import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Plus, Minus, Edit2, Trash2, ChefHat, ShoppingCart, Search, Filter, Calendar, AlertTriangle, Clock, Refrigerator } from 'lucide-react';
import './App.css';
import { foodsAPI, recipesAPI } from './api/storage';

// Definición de tipos
interface Food {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  notes: string;
  dateAdded: string;
}

interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

interface Recipe {
  id: number;
  name: string;
  description: string;
  instructions: string;
  cookingTime: string;
  servings: number;
  ingredients: Ingredient[];
  dateCreated: string;
}

interface FoodFormProps {
  food?: Food;
  onSubmit: (food: Omit<Food, 'id' | 'dateAdded'>) => void;
  onCancel: () => void;
}

interface RecipeFormProps {
  recipe?: Recipe;
  onSubmit: (recipe: Omit<Recipe, 'id' | 'dateCreated'>) => void;
  onCancel: () => void;
}

const FridgeManager: React.FC = () => {
  const [foods, setFoods] = useState<Food[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'foods' | 'recipes'>('dashboard');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showAddFood, setShowAddFood] = useState<boolean>(false);
  const [showAddRecipe, setShowAddRecipe] = useState<boolean>(false);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [lastFoodsSave, setLastFoodsSave] = useState<string>('');
  const [lastRecipesSave, setLastRecipesSave] = useState<string>('');
  
  // Refs to track if data is from server to prevent immediate save
  const foodsFromServerRef = useRef<boolean>(false);
  const recipesFromServerRef = useRef<boolean>(false);
  const saveTimeoutRef = useRef<{ foods?: NodeJS.Timeout; recipes?: NodeJS.Timeout }>({});

  const categories = ['lácteos', 'verduras', 'frutas', 'carnes', 'pescado', 'cereales', 'conservas', 'condimentos', 'bebidas', 'otros'];

  // Utility function to create data hash for comparison
  const createDataHash = useCallback((data: any[]) => {
    return JSON.stringify(data.map(item => ({ ...item })).sort((a, b) => a.id - b.id));
  }, []);

  // Debounced save function
  const debouncedSave = useCallback((type: 'foods' | 'recipes', data: any[], hash: string) => {
    // Clear existing timeout
    if (saveTimeoutRef.current[type]) {
      clearTimeout(saveTimeoutRef.current[type]);
    }

    // Set new timeout
    saveTimeoutRef.current[type] = setTimeout(async () => {
      const currentHash = type === 'foods' ? lastFoodsSave : lastRecipesSave;
      
      // Only save if data actually changed
      if (hash !== currentHash) {
        try {
          if (type === 'foods') {
            await foodsAPI.save(data);
            setLastFoodsSave(hash);
          } else {
            await recipesAPI.save(data);
            setLastRecipesSave(hash);
          }
        } catch (error) {
          console.error(`Error saving ${type}:`, error);
        }
      }
    }, 500); // 500ms debounce
  }, [lastFoodsSave, lastRecipesSave]);

  // Load data from API on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const loadedFoods = await foodsAPI.getAll();
        const loadedRecipes = await recipesAPI.getAll();
        
        // Mark as loaded from server to prevent immediate save
        foodsFromServerRef.current = true;
        recipesFromServerRef.current = true;
        
        setFoods(loadedFoods);
        setRecipes(loadedRecipes);
        
        // Set initial hashes
        setLastFoodsSave(createDataHash(loadedFoods));
        setLastRecipesSave(createDataHash(loadedRecipes));
        
        setIsLoaded(true);
        
        // Reset server flags after a brief moment
        setTimeout(() => {
          foodsFromServerRef.current = false;
          recipesFromServerRef.current = false;
        }, 100);
      } catch (error) {
        console.error('Error loading data:', error);
        setIsLoaded(true);
      }
    };
    loadData();
  }, [createDataHash]);

  // Save to API whenever foods change (with debouncing and hash comparison)
  useEffect(() => {
    if (isLoaded && !foodsFromServerRef.current && foods.length >= 0) {
      const hash = createDataHash(foods);
      debouncedSave('foods', foods, hash);
    }
  }, [foods, isLoaded, createDataHash, debouncedSave]);

  // Save to API whenever recipes change (with debouncing and hash comparison)
  useEffect(() => {
    if (isLoaded && !recipesFromServerRef.current && recipes.length >= 0) {
      const hash = createDataHash(recipes);
      debouncedSave('recipes', recipes, hash);
    }
  }, [recipes, isLoaded, createDataHash, debouncedSave]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(saveTimeoutRef.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  const addFood = (foodData: Omit<Food, 'id' | 'dateAdded'>) => {
    console.log("=== AÑADIENDO ALIMENTO ===");
    console.log("Datos recibidos:", foodData);
    
    try {
      const newFood: Food = {
        id: Date.now() + Math.random(), // ID único
        name: foodData.name,
        category: foodData.category,
        quantity: foodData.quantity,
        unit: foodData.unit,
        expiryDate: foodData.expiryDate,
        notes: foodData.notes || '',
        dateAdded: new Date().toISOString()
      };
      
      console.log("Nuevo alimento creado:", newFood);
      
      setFoods(currentFoods => {
        const updated = [...currentFoods, newFood];
        console.log("Lista actualizada:", updated);
        return updated;
      });
      
      console.log("Cerrando modal...");
      setShowAddFood(false);
      
      console.log("=== ALIMENTO AÑADIDO EXITOSAMENTE ===");
    } catch (error) {
      console.error("Error al añadir alimento:", error);
      alert("Error al añadir el alimento. Revisa la consola para más detalles.");
    }
  };

  const updateFood = (foodData: Omit<Food, 'id' | 'dateAdded'>) => {
    const updatedFood: Food = {
      ...foodData,
      id: editingFood!.id,
      dateAdded: editingFood!.dateAdded
    };
    setFoods(foods.map(food => food.id === updatedFood.id ? updatedFood : food));
    setEditingFood(null);
  };

  const deleteFood = (id: number) => {
    setFoods(foods.filter(food => food.id !== id));
  };

  const addRecipe = (recipeData: Omit<Recipe, 'id' | 'dateCreated'>) => {
    const newRecipe: Recipe = {
      ...recipeData,
      id: Date.now(),
      dateCreated: new Date().toISOString()
    };
    setRecipes([...recipes, newRecipe]);
    setShowAddRecipe(false);
  };

  const updateRecipe = (recipeData: Omit<Recipe, 'id' | 'dateCreated'>) => {
    const updatedRecipe: Recipe = {
      ...recipeData,
      id: editingRecipe!.id,
      dateCreated: editingRecipe!.dateCreated
    };
    setRecipes(recipes.map(recipe => recipe.id === updatedRecipe.id ? updatedRecipe : recipe));
    setEditingRecipe(null);
  };

  const deleteRecipe = (id: number) => {
    setRecipes(recipes.filter(recipe => recipe.id !== id));
  };

  const getDaysUntilExpiry = (expiryDate: string): number => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getExpiringFoods = (days: number = 3): Food[] => {
    return foods.filter(food => {
      const daysUntilExpiry = getDaysUntilExpiry(food.expiryDate);
      return daysUntilExpiry <= days && daysUntilExpiry >= 0;
    });
  };

  const getExpiredFoods = (): Food[] => {
    return foods.filter(food => getDaysUntilExpiry(food.expiryDate) < 0);
  };

  const getAvailableRecipes = (): Recipe[] => {
    return recipes.filter(recipe => {
      return recipe.ingredients.every(ingredient => {
        const availableFood = foods.find(food => 
          food.name.toLowerCase().includes(ingredient.name.toLowerCase()) && 
          food.quantity >= ingredient.quantity
        );
        return availableFood;
      });
    });
  };

  const filteredFoods = useMemo(() => {
    return foods.filter(food => {
      const matchesSearch = food.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || food.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [foods, searchTerm, filterCategory]);

  const FoodForm: React.FC<FoodFormProps> = ({ food, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
      name: food?.name || '',
      category: food?.category || 'otros',
      quantity: food?.quantity || 1,
      unit: food?.unit || 'unidad',
      expiryDate: food?.expiryDate || '',
      notes: food?.notes || ''
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      console.log("Form submit triggered");
      console.log("Form data:", formData);
      
      if (!formData.name.trim()) {
        alert('El nombre del alimento es obligatorio');
        return;
      }
      
      if (!formData.expiryDate) {
        alert('La fecha de caducidad es obligatoria');
        return;
      }
      
      const processedData = {
        ...formData,
        quantity: Number(formData.quantity) || 1,
        name: formData.name.trim()
      };
      
      console.log("Calling onSubmit with:", processedData);
      onSubmit(processedData);
    };

    const handleAddClick = () => {
      console.log("Add button clicked");
      
      if (!formData.name.trim()) {
        alert('El nombre del alimento es obligatorio');
        return;
      }
      
      if (!formData.expiryDate) {
        alert('La fecha de caducidad es obligatoria');
        return;
      }
      
      const processedData = {
        ...formData,
        quantity: Number(formData.quantity) || 1,
        name: formData.name.trim()
      };
      
      console.log("Calling onSubmit with:", processedData);
      onSubmit(processedData);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
          <h3 className="text-xl font-bold text-white mb-4">
            {food ? 'Editar Alimento' : 'Añadir Alimento'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-1">Nombre</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-1">Categoría</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="flex space-x-2">
              <div className="flex-1">
                <label className="block text-gray-300 text-sm font-medium mb-1">Cantidad</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-gray-300 text-sm font-medium mb-1">Unidad</label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="unidad">Unidad</option>
                  <option value="kg">Kg</option>
                  <option value="g">Gramos</option>
                  <option value="l">Litros</option>
                  <option value="ml">ml</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-1">Fecha de Caducidad</label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-1">Notas (opcional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                placeholder="Notas adicionales..."
              />
            </div>
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleAddClick}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                {food ? 'Actualizar' : 'Añadir'}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const RecipeForm: React.FC<RecipeFormProps> = ({ recipe, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
      name: recipe?.name || '',
      description: recipe?.description || '',
      instructions: recipe?.instructions || '',
      cookingTime: recipe?.cookingTime || '',
      servings: recipe?.servings || 1,
      ingredients: recipe?.ingredients || [{ name: '', quantity: 1, unit: 'unidad' }]
    });

    const addIngredient = () => {
      setFormData({
        ...formData,
        ingredients: [...formData.ingredients, { name: '', quantity: 1, unit: 'unidad' }]
      });
    };

    const removeIngredient = (index: number) => {
      setFormData({
        ...formData,
        ingredients: formData.ingredients.filter((_, i) => i !== index)
      });
    };

    const updateIngredient = (index: number, field: keyof Ingredient, value: string | number) => {
      const updatedIngredients = formData.ingredients.map((ingredient, i) =>
        i === index ? { ...ingredient, [field]: value } : ingredient
      );
      setFormData({ ...formData, ingredients: updatedIngredients });
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <h3 className="text-xl font-bold text-white mb-4">
            {recipe ? 'Editar Receta' : 'Añadir Receta'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-1">Nombre de la receta</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block text-gray-300 text-sm font-medium mb-1">Tiempo de cocción</label>
                <input
                  type="text"
                  value={formData.cookingTime}
                  onChange={(e) => setFormData({...formData, cookingTime: e.target.value})}
                  placeholder="ej: 30 minutos"
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-gray-300 text-sm font-medium mb-1">Porciones</label>
                <input
                  type="number"
                  min="1"
                  value={formData.servings}
                  onChange={(e) => setFormData({...formData, servings: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-1">Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                placeholder="Descripción breve de la receta..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-gray-300 text-sm font-medium">Ingredientes</label>
                <button
                  type="button"
                  onClick={addIngredient}
                  className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
                >
                  <Plus size={16} className="mr-1" /> Añadir ingrediente
                </button>
              </div>
              <div className="space-y-2">
                {formData.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex space-x-2 items-center">
                    <input
                      type="text"
                      placeholder="Ingrediente"
                      value={ingredient.name}
                      onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      placeholder="Cantidad"
                      value={ingredient.quantity}
                      onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value))}
                      className="w-20 px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <select
                      value={ingredient.unit}
                      onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                      className="w-24 px-2 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="unidad">ud</option>
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="l">l</option>
                      <option value="ml">ml</option>
                      <option value="taza">taza</option>
                      <option value="cda">cda</option>
                    </select>
                    {formData.ingredients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeIngredient(index)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <Minus size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-1">Instrucciones</label>
              <textarea
                value={formData.instructions}
                onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none"
                placeholder="Describe los pasos para preparar la receta..."
                required
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                {recipe ? 'Actualizar' : 'Añadir'}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderDashboard = () => {
    const expiringFoods = getExpiringFoods();
    const expiredFoods = getExpiredFoods();
    const availableRecipes = getAvailableRecipes();

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Alimentos</p>
                <p className="text-2xl font-bold text-white">{foods.length}</p>
              </div>
              <Refrigerator className="text-blue-400" size={24} />
            </div>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Próximos a caducar</p>
                <p className="text-2xl font-bold text-orange-400">{expiringFoods.length}</p>
              </div>
              <AlertTriangle className="text-orange-400" size={24} />
            </div>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Caducados</p>
                <p className="text-2xl font-bold text-red-400">{expiredFoods.length}</p>
              </div>
              <Clock className="text-red-400" size={24} />
            </div>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Recetas disponibles</p>
                <p className="text-2xl font-bold text-green-400">{availableRecipes.length}</p>
              </div>
              <ChefHat className="text-green-400" size={24} />
            </div>
          </div>
        </div>

        {expiringFoods.length > 0 && (
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-orange-400 mb-3 flex items-center">
              <AlertTriangle size={20} className="mr-2" />
              Próximos a caducar
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {expiringFoods.map(food => (
                <div key={food.id} className="bg-gray-700 p-3 rounded flex justify-between items-center">
                  <div>
                    <p className="text-white font-medium">{food.name}</p>
                    <p className="text-gray-400 text-sm">{food.quantity} {food.unit}</p>
                  </div>
                  <div className="text-orange-400 text-sm">
                    {getDaysUntilExpiry(food.expiryDate)} días
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {availableRecipes.length > 0 && (
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center">
              <ChefHat size={20} className="mr-2" />
              Recetas que puedes hacer ahora
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableRecipes.slice(0, 4).map(recipe => (
                <div key={recipe.id} className="bg-gray-700 p-3 rounded">
                  <h4 className="text-white font-medium mb-1">{recipe.name}</h4>
                  <p className="text-gray-400 text-sm mb-2">{recipe.description}</p>
                  <div className="flex text-xs text-gray-500">
                    <span className="mr-3">⏱️ {recipe.cookingTime}</span>
                    <span>👥 {recipe.servings} porciones</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFoods = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex gap-3 flex-1 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar alimentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas las categorías</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setShowAddFood(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus size={20} className="mr-2" />
          Añadir Alimento
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFoods.map(food => {
          const daysUntilExpiry = getDaysUntilExpiry(food.expiryDate);
          const isExpiring = daysUntilExpiry <= 3 && daysUntilExpiry >= 0;
          const isExpired = daysUntilExpiry < 0;
          
          return (
            <div key={food.id} className={`bg-gray-800 p-4 rounded-lg border-l-4 ${
              isExpired ? 'border-red-500' : isExpiring ? 'border-orange-500' : 'border-green-500'
            }`}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-white">{food.name}</h3>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setEditingFood(food)}
                    className="text-gray-400 hover:text-blue-400 transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => deleteFood(food.id)}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-gray-300">
                  <span className="text-gray-400">Cantidad:</span> {food.quantity} {food.unit}
                </p>
                <p className="text-gray-300">
                  <span className="text-gray-400">Categoría:</span> {food.category}
                </p>
                <p className={`text-sm ${isExpired ? 'text-red-400' : isExpiring ? 'text-orange-400' : 'text-green-400'}`}>
                  {isExpired 
                    ? `Caducado hace ${Math.abs(daysUntilExpiry)} días`
                    : isExpiring 
                    ? `Caduca en ${daysUntilExpiry} días`
                    : `Caduca en ${daysUntilExpiry} días`
                  }
                </p>
                {food.notes && (
                  <p className="text-gray-400 text-sm italic">{food.notes}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredFoods.length === 0 && (
        <div className="text-center py-12">
          <Refrigerator size={64} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 text-lg">No hay alimentos que coincidan con tu búsqueda</p>
        </div>
      )}
    </div>
  );

  const renderRecipes = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Mis Recetas</h2>
        <button
          onClick={() => setShowAddRecipe(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus size={20} className="mr-2" />
          Añadir Receta
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recipes.map(recipe => {
          const canMake = recipe.ingredients.every(ingredient => {
            const availableFood = foods.find(food => 
              food.name.toLowerCase().includes(ingredient.name.toLowerCase()) && 
              food.quantity >= ingredient.quantity
            );
            return availableFood;
          });

          return (
            <div key={recipe.id} className={`bg-gray-800 p-6 rounded-lg border-l-4 ${
              canMake ? 'border-green-500' : 'border-gray-600'
            }`}>
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-semibold text-white">{recipe.name}</h3>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setEditingRecipe(recipe)}
                    className="text-gray-400 hover:text-blue-400 transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => deleteRecipe(recipe.id)}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              {recipe.description && (
                <p className="text-gray-300 mb-3">{recipe.description}</p>
              )}
              
              <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-400">
                {recipe.cookingTime && (
                  <span className="flex items-center">
                    <Clock size={16} className="mr-1" />
                    {recipe.cookingTime}
                  </span>
                )}
                <span>👥 {recipe.servings} porciones</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  canMake ? 'bg-green-600 text-green-100' : 'bg-gray-600 text-gray-300'
                }`}>
                  {canMake ? '✅ Disponible' : '❌ Faltan ingredientes'}
                </span>
              </div>

              <div className="mb-4">
                <h4 className="text-gray-300 font-medium mb-2">Ingredientes:</h4>
                <ul className="space-y-1">
                  {recipe.ingredients.map((ingredient, index) => {
                    const availableFood = foods.find(food => 
                      food.name.toLowerCase().includes(ingredient.name.toLowerCase())
                    );
                    const hasEnough = availableFood && availableFood.quantity >= ingredient.quantity;
                    
                    return (
                      <li key={index} className={`text-sm flex justify-between ${
                        hasEnough ? 'text-green-400' : 'text-red-400'
                      }`}>
                        <span>{ingredient.name}</span>
                        <span>{ingredient.quantity} {ingredient.unit}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="text-gray-300 font-medium mb-2">Instrucciones:</h4>
                <p className="text-gray-400 text-sm">{recipe.instructions}</p>
              </div>
            </div>
          );
        })}
      </div>

      {recipes.length === 0 && (
        <div className="text-center py-12">
          <ChefHat size={64} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 text-lg">No tienes recetas guardadas</p>
          <p className="text-gray-500">¡Añade tu primera receta para empezar!</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Refrigerator className="text-blue-400 mr-3" size={32} />
              <h1 className="text-2xl font-bold text-white">FridgeManager</h1>
            </div>
            <div className="text-sm text-gray-400">
              Tu asistente de cocina inteligente
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-gray-800 border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('foods')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'foods'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              Alimentos
            </button>
            <button
              onClick={() => setActiveTab('recipes')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'recipes'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              Recetas
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'foods' && renderFoods()}
        {activeTab === 'recipes' && renderRecipes()}
      </main>

      {/* Modals */}
      {showAddFood && (
        <FoodForm
          onSubmit={addFood}
          onCancel={() => setShowAddFood(false)}
        />
      )}
      
      {editingFood && (
        <FoodForm
          food={editingFood}
          onSubmit={updateFood}
          onCancel={() => setEditingFood(null)}
        />
      )}
      
      {showAddRecipe && (
        <RecipeForm
          onSubmit={addRecipe}
          onCancel={() => setShowAddRecipe(false)}
        />
      )}
      
      {editingRecipe && (
        <RecipeForm
          recipe={editingRecipe}
          onSubmit={updateRecipe}
          onCancel={() => setEditingRecipe(null)}
        />
      )}
    </div>
  );
};

export default FridgeManager;