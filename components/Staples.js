app.component('staples', {
    data() {
        return {
            isOpen: false,
            activeTab: 'reference',
            // Reference foods
            foods: {},
            newFood: { name: '', calories: '' },
            // Portions
            portions: [],
            newPortion: { name: '', amount: '', unit: 'g', weight: '', calories: '' },
        }
    },
    template: /*html*/`
    <div>
        <button class="staples-trigger" @click="isOpen = true">📋 Staples</button>

        <div v-if="isOpen" class="staples-overlay" @click.self="isOpen = false">
            <div class="staples-modal">

                <div class="staples-header">
                    <span>Staples</span>
                    <button class="staples-close" @click="isOpen = false">✕</button>
                </div>

                <div class="staples-tabs">
                    <button :class="['tab-btn', { active: activeTab === 'reference' }]" @click="activeTab = 'reference'">
                        Reference Foods
                    </button>
                    <button :class="['tab-btn', { active: activeTab === 'portions' }]" @click="activeTab = 'portions'">
                        Portion Presets
                    </button>
                </div>

                <!-- Reference Tab -->
                <div v-if="activeTab === 'reference'" class="staples-content">
                    <table class="staples-table">
                        <thead>
                            <tr>
                                <th>Food</th>
                                <th>Cal / 100g</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(calories, food) in foods" :key="food">
                                <td>{{ food }}</td>
                                <td>{{ calories }}</td>
                                <td><button class="btn-remove" @click="deleteFood(food)">✕</button></td>
                            </tr>
                            <tr v-if="Object.keys(foods).length === 0">
                                <td colspan="3" class="empty-row">No foods added yet</td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="staples-add-row">
                        <input v-model="newFood.name" placeholder="Food name" class="staples-input" />
                        <input v-model="newFood.calories" placeholder="Cal/100g" type="number" class="staples-input small" />
                        <button class="btn-add" @click="addFood">Add</button>
                    </div>
                </div>

                <!-- Portions Tab -->
                <div v-if="activeTab === 'portions'" class="staples-content">
                    <table class="staples-table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Portion</th>
                                <th>Weight</th>
                                <th>Cal/100g</th>
                                <th>Total cal</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(portion, index) in portions" :key="index">
                                <td>{{ portion.name }}</td>
                                <td>{{ portion.amount }} {{ portion.unit }}</td>
                                <td>{{ portion.weight }}g</td>
                                <td>{{ portion.calories }}</td>
                                <td>{{ Math.round(portion.weight / 100 * portion.calories) }}</td>
                                <td><button class="btn-remove" @click="deletePortion(index)">✕</button></td>
                            </tr>
                            <tr v-if="portions.length === 0">
                                <td colspan="6" class="empty-row">No portions added yet</td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="staples-add-row wrap">
                        <input v-model="newPortion.name" placeholder="e.g. Bread slice" class="staples-input" />
                        <input v-model="newPortion.amount" placeholder="Amount" type="number" class="staples-input tiny" />
                        <select v-model="newPortion.unit" class="staples-input tiny">
                            <option>g</option>
                            <option>ml</option>
                            <option>slice</option>
                            <option>tbsp</option>
                            <option>tsp</option>
                            <option>piece</option>
                            <option>cup</option>
                        </select>
                        <input v-model="newPortion.weight" placeholder="Weight (g)" type="number" class="staples-input tiny" />
                        <input v-model="newPortion.calories" placeholder="Cal/100g" type="number" class="staples-input tiny" />
                        <button class="btn-add" @click="addPortion">Add</button>
                    </div>
                </div>

            </div>
        </div>
    </div>
    `,
    mounted() {
        this.fetchFoods();
        this.fetchPortions();
    },
    methods: {
        async fetchFoods() {
            try {
                const doc = await window.db.collection('reference').doc('referenced_foods').get();
                if (doc.exists) this.foods = doc.data();
            } catch (e) { console.error(e); }
        },
        async addFood() {
            if (!this.newFood.name.trim() || !this.newFood.calories) return;
            try {
                await window.db.collection('reference').doc('referenced_foods').set({
                    [this.newFood.name]: Number(this.newFood.calories)
                }, { merge: true });
                this.newFood = { name: '', calories: '' };
                this.fetchFoods();
            } catch (e) { console.error(e); }
        },
        async deleteFood(foodName) {
            try {
                const doc = await window.db.collection('reference').doc('referenced_foods').get();
                if (doc.exists) {
                    const data = doc.data();
                    delete data[foodName];
                    await window.db.collection('reference').doc('referenced_foods').set(data);
                    this.fetchFoods();
                }
            } catch (e) { console.error(e); }
        },
        async fetchPortions() {
            try {
                const doc = await window.db.collection('reference').doc('portions').get();
                if (doc.exists) this.portions = doc.data().list || [];
            } catch (e) { console.error(e); }
        },
        async addPortion() {
            if (!this.newPortion.name.trim() || !this.newPortion.weight || !this.newPortion.calories) return;
            const updated = [...this.portions, { ...this.newPortion }];
            try {
                await window.db.collection('reference').doc('portions').set({ list: updated });
                this.newPortion = { name: '', amount: '', unit: 'g', weight: '', calories: '' };
                this.fetchPortions();
            } catch (e) { console.error(e); }
        },
        async deletePortion(index) {
            const updated = this.portions.filter((_, i) => i !== index);
            try {
                await window.db.collection('reference').doc('portions').set({ list: updated });
                this.fetchPortions();
            } catch (e) { console.error(e); }
        }
    }
});