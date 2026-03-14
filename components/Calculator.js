app.component('calculator', {
    data() {
        return {
            isOpen: false,
            ingredients: [
                { name: '', weight: '', calories: '' }
            ],
            finalWeight: '',
        }
    },
    template: /*html*/`
    <div>
        <button class="staples-trigger" @click="isOpen = true">🧮 Calculator</button>

        <div v-if="isOpen" class="staples-overlay" @click.self="isOpen = false">
            <div class="staples-modal">

                <div class="staples-header">
                    <span>Recipe Calculator</span>
                    <button class="staples-close" @click="isOpen = false">✕</button>
                </div>

                <div class="staples-content">
                    <table class="staples-table">
                        <thead>
                            <tr>
                                <th>Ingredient</th>
                                <th>Weight (g)</th>
                                <th>Cal / 100g</th>
                                <th>Total cal</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(ing, index) in ingredients" :key="index">
                                <td>
                                    <input
                                        v-model="ing.name"
                                        placeholder="e.g. flour"
                                        class="staples-input"
                                    />
                                </td>
                                <td>
                                    <input
                                        v-model="ing.weight"
                                        placeholder="g"
                                        type="number"
                                        class="staples-input small"
                                    />
                                </td>
                                <td>
                                    <input
                                        v-model="ing.calories"
                                        placeholder="cal"
                                        type="number"
                                        class="staples-input small"
                                    />
                                </td>
                                <td class="calc-total">
                                    {{ ingTotal(ing) !== null ? ingTotal(ing) + ' cal' : '—' }}
                                </td>
                                <td>
                                    <button class="btn-remove" @click="removeIngredient(index)">✕</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <button class="btn-add-row" @click="addIngredient">+ Add ingredient</button>

                    <!-- Totals -->
                    <div class="calc-summary">
                        <div class="calc-summary-row">
                            <span>Total raw weight</span>
                            <span>{{ totalRawWeight }}g</span>
                        </div>
                        <div class="calc-summary-row">
                            <span>Total calories</span>
                            <span>{{ totalCalories }} cal</span>
                        </div>
                        <div class="calc-divider"></div>
                        <div class="calc-summary-row final-weight-row">
                            <span>Final product weight</span>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <input
                                    v-model="finalWeight"
                                    type="number"
                                    placeholder="e.g. 850"
                                    class="staples-input small"
                                />
                                <span>g</span>
                            </div>
                        </div>
                        <div class="calc-divider"></div>
                        <div class="calc-summary-row result-row">
                            <span>Cal / 100g of final product</span>
                            <span class="calc-result">{{ calsPer100g }}</span>
                        </div>
                    </div>

                    <!-- Save to reference -->
                    <div v-if="calsPer100g !== '—'" class="calc-save-row">
                        <input
                            v-model="saveName"
                            placeholder="Save as... (e.g. My chicken stew)"
                            class="staples-input"
                        />
                        <button class="btn-add" @click="saveToReference">Save to Reference</button>
                    </div>
                    <p v-if="saveSuccess" class="calc-save-success">✅ Saved to reference foods!</p>
                </div>

            </div>
        </div>
    </div>
    `,
    data() {
        return {
            isOpen: false,
            ingredients: [{ name: '', weight: '', calories: '' }],
            finalWeight: '',
            saveName: '',
            saveSuccess: false,
        }
    },
    computed: {
        totalRawWeight() {
            return this.ingredients.reduce((sum, ing) => {
                return sum + (parseFloat(ing.weight) || 0);
            }, 0);
        },
        totalCalories() {
            return Math.round(this.ingredients.reduce((sum, ing) => {
                const w = parseFloat(ing.weight) || 0;
                const c = parseFloat(ing.calories) || 0;
                return sum + (w / 100 * c);
            }, 0));
        },
        calsPer100g() {
            const fw = parseFloat(this.finalWeight);
            if (!fw || fw <= 0 || this.totalCalories === 0) return '—';
            return Math.round(this.totalCalories / fw * 100) + ' cal/100g';
        }
    },
    methods: {
        ingTotal(ing) {
            const w = parseFloat(ing.weight);
            const c = parseFloat(ing.calories);
            if (!w || !c) return null;
            return Math.round(w / 100 * c);
        },
        addIngredient() {
            this.ingredients.push({ name: '', weight: '', calories: '' });
        },
        removeIngredient(index) {
            if (this.ingredients.length === 1) {
                this.ingredients = [{ name: '', weight: '', calories: '' }];
            } else {
                this.ingredients.splice(index, 1);
            }
        },
        async saveToReference() {
            if (!this.saveName.trim() || this.calsPer100g === '—') return;
            const calValue = Math.round(this.totalCalories / parseFloat(this.finalWeight) * 100);
            try {
                await window.db.collection('reference').doc('referenced_foods').set({
                    [this.saveName.trim()]: calValue
                }, { merge: true });
                this.saveSuccess = true;
                setTimeout(() => { this.saveSuccess = false; }, 3000);
            } catch (e) {
                console.error('Error saving to reference:', e);
            }
        }
    }
});