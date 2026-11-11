import React, { useState, useEffect } from 'react';
import { Category, Recipe } from '../types';
import { api, ApiError } from '../services/api';
import { X, Plus, Trash2, Clock, Users, Award, BookOpen, AlertCircle } from 'lucide-react';
import { getCategoryTheme } from '../utils/theme';

interface RecipeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (recipe: Recipe) => void;
  categories: Category[];
  recipeToEdit?: Recipe | null;
}

export const RecipeFormModal: React.FC<RecipeFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  categories,
  recipeToEdit,
}) => {
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<number | string>(1);
  const [description, setDescription] = useState('');
  const [prepTime, setPrepTime] = useState<number>(45);
  const [servings, setServings] = useState('4 porções');
  const [difficulty, setDifficulty] = useState<'Fácil' | 'Médio' | 'Difícil'>('Fácil');
  const [photoTag, setPhotoTag] = useState('');
  const [chefTip, setChefTip] = useState('');

  const [ingredients, setIngredients] = useState<Array<{ name: string; quantity: string }>>([
    { name: '', quantity: '' },
    { name: '', quantity: '' },
    { name: '', quantity: '' },
  ]);

  const [steps, setSteps] = useState<Array<{ title: string; text: string }>>([
    { title: 'Preparo dos ingredientes', text: '' },
    { title: 'Cocção e finalização', text: '' },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (recipeToEdit) {
      setTitle(recipeToEdit.title);
      setCategoryId(recipeToEdit.category.id);
      setDescription(recipeToEdit.description);
      setPrepTime(recipeToEdit.prep_time_minutes);
      setServings(recipeToEdit.servings);
      setDifficulty(recipeToEdit.difficulty);
      setPhotoTag(recipeToEdit.photo_tag || '');
      setChefTip(recipeToEdit.chef_tip || '');
      if (recipeToEdit.ingredients && recipeToEdit.ingredients.length > 0) {
        setIngredients(recipeToEdit.ingredients.map(i => ({ name: i.name, quantity: i.quantity })));
      }
      if (recipeToEdit.steps && recipeToEdit.steps.length > 0) {
        setSteps(recipeToEdit.steps.map(s => ({ title: s.title, text: s.text })));
      }
    } else {
      // Reset form
      setTitle('');
      if (categories.length > 0) setCategoryId(categories[0].id);
      setDescription('');
      setPrepTime(40);
      setServings('4 porções');
      setDifficulty('Fácil');
      setPhotoTag('');
      setChefTip('');
      setIngredients([
        { name: '', quantity: '' },
        { name: '', quantity: '' },
      ]);
      setSteps([
        { title: 'Preparo inicial', text: '' },
      ]);
    }
  }, [recipeToEdit, categories, isOpen]);

  if (!isOpen) return null;

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { name: '', quantity: '' }]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index: number, field: 'name' | 'quantity', value: string) => {
    const updated = [...ingredients];
    updated[index][field] = value;
    setIngredients(updated);
  };

  const handleAddStep = () => {
    setSteps([...steps, { title: `Etapa ${steps.length + 1}`, text: '' }]);
  };

  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleStepChange = (index: number, field: 'title' | 'text', value: string) => {
    const updated = [...steps];
    updated[index][field] = value;
    setSteps(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (title.trim().length < 3) {
      setError('O título da receita deve conter pelo menos 3 caracteres.');
      return;
    }

    const validIngredients = ingredients.filter(i => i.name.trim().length > 0);
    if (validIngredients.length === 0) {
      setError('Adicione pelo menos um ingrediente para a receita.');
      return;
    }

    const validSteps = steps.filter(s => s.text.trim().length > 0);
    if (validSteps.length === 0) {
      setError('Adicione pelo menos um passo no modo de preparo.');
      return;
    }

    setLoading(true);

    const payload = {
      title: title.trim(),
      category_id: categoryId,
      description: description.trim(),
      prep_time_minutes: prepTime,
      servings: servings.trim(),
      difficulty,
      photo_tag: photoTag.trim(),
      chef_tip: chefTip.trim(),
      ingredients: validIngredients,
      steps: validSteps,
    };

    try {
      let savedRecipe: Recipe;
      if (recipeToEdit) {
        savedRecipe = await api.updateRecipe(recipeToEdit.id, payload);
      } else {
        savedRecipe = await api.createRecipe(payload);
      }
      onSuccess(savedRecipe);
      onClose();
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Ocorreu um erro ao salvar a receita. Verifique os campos.');
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = categories.find(c => c.id === categoryId);
  const theme = selectedCategory ? getCategoryTheme(selectedCategory.color_token) : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-[#eae8e3]">
        {/* Header */}
        <div className="p-6 border-b border-[#eae8e3] flex items-center justify-between bg-[#fbf9f4]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#003b21] text-white flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-[#8ec4a0]" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-[#1b1c19]">
                {recipeToEdit ? 'Editar Receita do Caderno' : 'Cadastrar Nova Receita'}
              </h2>
              <p className="text-xs text-[#717972]">
                Contribua para o livro colaborativo da turma com proporções e técnica.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white hover:bg-[#eae8e3] text-[#414942] flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 sm:p-8 space-y-8 flex-1">
          {error && (
            <div className="p-4 bg-[#fce8e6] border border-[#ffdad6] text-[#ba1a1a] rounded-2xl text-xs font-semibold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#003b21]">
              1. Identificação do Prato
            </h3>

            <div>
              <label className="block text-xs font-bold text-[#1b1c19] mb-1">
                Título da Receita *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Bolo de cenoura com calda crocante"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#c0c9c0] focus:border-[#003b21] focus:ring-1 focus:ring-[#003b21] text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1b1c19] mb-1">
                  Categoria Temática *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#c0c9c0] focus:border-[#003b21] focus:ring-1 focus:ring-[#003b21] text-sm bg-white"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {theme && (
                  <p className="text-[11px] mt-1 text-[#717972] flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: theme.base }} />
                    <span>Tema cromático: {theme.name}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1b1c19] mb-1">
                  Descrição visual da foto (legenda)
                </label>
                <input
                  type="text"
                  placeholder="Ex: cobertura de chocolate brilhante"
                  value={photoTag}
                  onChange={(e) => setPhotoTag(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#c0c9c0] focus:border-[#003b21] focus:ring-1 focus:ring-[#003b21] text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1b1c19] mb-1">
                Descrição Curta / História do Prato *
              </label>
              <textarea
                required
                rows={2}
                placeholder="Descreva a textura, sabor e inspiração afetiva deste prato..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#c0c9c0] focus:border-[#003b21] focus:ring-1 focus:ring-[#003b21] text-sm"
              />
            </div>
          </div>

          {/* Section 2: Preparation Parameters */}
          <div className="space-y-4 pt-4 border-t border-[#f0eee9]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#003b21]">
              2. Parâmetros de Cozinha
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1b1c19] mb-1 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-[#717972]" />
                  <span>Tempo (minutos) *</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={prepTime}
                  onChange={(e) => setPrepTime(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#c0c9c0] focus:border-[#003b21] focus:ring-1 focus:ring-[#003b21] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1b1c19] mb-1 flex items-center space-x-1">
                  <Users className="w-3.5 h-3.5 text-[#717972]" />
                  <span>Rendimento *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 12 fatias, 4 porções"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#c0c9c0] focus:border-[#003b21] focus:ring-1 focus:ring-[#003b21] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1b1c19] mb-1 flex items-center space-x-1">
                  <Award className="w-3.5 h-3.5 text-[#717972]" />
                  <span>Dificuldade</span>
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#c0c9c0] focus:border-[#003b21] focus:ring-1 focus:ring-[#003b21] text-sm bg-white"
                >
                  <option value="Fácil">Fácil</option>
                  <option value="Médio">Médio</option>
                  <option value="Difícil">Difícil</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Ingredients */}
          <div className="space-y-4 pt-4 border-t border-[#f0eee9]">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#003b21]">
                3. Ingredientes & Medidas
              </h3>
              <button
                type="button"
                onClick={handleAddIngredient}
                className="inline-flex items-center space-x-1 text-xs font-bold text-[#003b21] hover:text-[#1e5236]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Ingrediente</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {ingredients.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Nome do ingrediente (ex: farinha de trigo peneirada)"
                    value={item.name}
                    onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-[#c0c9c0] text-xs focus:border-[#003b21] focus:ring-1 focus:ring-[#003b21]"
                  />
                  <input
                    type="text"
                    placeholder="Quantidade (ex: 2 xícaras)"
                    value={item.quantity}
                    onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                    className="w-36 px-3.5 py-2 rounded-xl border border-[#c0c9c0] text-xs focus:border-[#003b21] focus:ring-1 focus:ring-[#003b21]"
                  />
                  {ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(index)}
                      className="p-2 text-[#717972] hover:text-[#ba1a1a] transition-colors"
                      title="Remover linha"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Steps */}
          <div className="space-y-4 pt-4 border-t border-[#f0eee9]">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#003b21]">
                4. Modo de Preparo
              </h3>
              <button
                type="button"
                onClick={handleAddStep}
                className="inline-flex items-center space-x-1 text-xs font-bold text-[#003b21] hover:text-[#1e5236]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Etapa</span>
              </button>
            </div>

            <div className="space-y-3.5">
              {steps.map((step, index) => (
                <div key={index} className="p-4 bg-[#fbf9f4] rounded-2xl border border-[#eae8e3] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#003b21]">
                      Passo {index + 1}
                    </span>
                    {steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(index)}
                        className="text-xs text-[#717972] hover:text-[#ba1a1a] flex items-center space-x-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remover</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Título da etapa (opcional, ex: Emulsão no liquidificador)"
                    value={step.title}
                    onChange={(e) => handleStepChange(index, 'title', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-[#c0c9c0] text-xs bg-white"
                  />
                  <textarea
                    rows={2}
                    required
                    placeholder="Descreva as ações, pontos de cocção ou temperaturas..."
                    value={step.text}
                    onChange={(e) => handleStepChange(index, 'text', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#c0c9c0] text-xs bg-white"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Chef Tip */}
          <div className="space-y-2 pt-4 border-t border-[#f0eee9]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#003b21]">
              5. Dica de Bancada do Aluno
            </h3>
            <textarea
              rows={2}
              placeholder="Algum segredo técnico? (ex: peneirar a farinha e o chocolate garante a textura aveludada sem grumos)"
              value={chefTip}
              onChange={(e) => setChefTip(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#c0c9c0] focus:border-[#003b21] focus:ring-1 focus:ring-[#003b21] text-sm"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-[#eae8e3] flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full text-xs font-bold bg-[#f0eee9] hover:bg-[#e4e2dd] text-[#1b1c19] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#8c1818] hover:bg-[#721111] text-white transition-transform active:scale-95 disabled:opacity-60 shadow-xs cursor-pointer"
            >
              {loading ? 'Salvando...' : recipeToEdit ? 'Atualizar Receita' : 'Publicar no Caderno'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
