import Ember from 'ember';
import ExpLookitSurveyComponent from '../exp-lookit-survey/component';

const {
    computed,
    run
} = Ember;

export default ExpLookitSurveyComponent.extend({
    classNames: ['exp-lookit-cdi'],

    defaultChecklistTitle: 'Vocabulary checklist',

    defaultChecklistInstructions:
        'Children understand many more words than they say. ' +
        'We are particularly interested in the words your child SAYS. ' +
        'Please mark every word you have heard your child use. ' +
        'If your child uses a different pronunciation of a word, mark it anyway. ' +
        'This is only a sample of words; your child may know many other words not on this list.',

    displayChecklistTitle: computed(
        'checklistTitle',
        'frameContext.checklistTitle',
        function() {
            return (
                this.get('checklistTitle') ||
                this.get('frameContext.checklistTitle') ||
                this.get('defaultChecklistTitle')
            );
        }
    ),

    displayChecklistInstructions: computed(
        'checklistInstructions',
        'frameContext.checklistInstructions',
        function() {
            return (
                this.get('checklistInstructions') ||
                this.get('frameContext.checklistInstructions') ||
                this.get('defaultChecklistInstructions')
            );
        }
    ),

    wordCount: computed(
        'formSchema.schema.properties',
        'frameContext.formSchema.schema.properties',
        function() {
            const properties =
                this.get('formSchema.schema.properties') ||
                this.get('frameContext.formSchema.schema.properties') ||
                {};

            return Object.keys(properties).length;
        }
    ),

    didRender() {
        this._super(...arguments);

        run.scheduleOnce('afterRender', this, this.formatChecklist);
    },

    formatChecklist() {
        const root = this.element;

        if (!root) {
            return;
        }

        /*
         * Find the actual rendered checkbox fields rather than assuming
         * a particular dynamic-form wrapper structure.
         */
        const checkboxes = root.querySelectorAll(
            '.exp-lookit-cdi-form input[type="checkbox"]'
        );

        const fields = [];

        Array.prototype.forEach.call(checkboxes, (checkbox) => {
            let field = checkbox.closest('.form-group');

            /*
             * Some versions of Alpaca/dynamic-form use .alpaca-field
             * instead of Bootstrap's .form-group.
             */
            if (!field) {
                field = checkbox.closest('.alpaca-field');
            }

            /*
             * Final fallback: use the checkbox's nearest containing div.
             */
            if (!field) {
                field = checkbox.parentElement;
            }

            if (field && fields.indexOf(field) === -1) {
                fields.push(field);
            }
        });

        fields.forEach((field, index) => {
            const visualRow = index % 25;
            const column = Math.floor(index / 25);

            field.classList.add('cdi-word');
            field.classList.add(`cdi-column-${column + 1}`);
            field.classList.add(`cdi-row-${visualRow + 1}`);

            if (visualRow % 2 === 0) {
                field.classList.add('cdi-row-gray');
            } else {
                field.classList.remove('cdi-row-gray');
            }
        });

        /*
         * Apply the grid to the common parent that actually contains
         * all checkbox fields.
         */
        if (fields.length > 0) {
            let grid = fields[0].parentElement;

            while (
                grid &&
                !fields.every((field) => field.parentElement === grid)
            ) {
                grid = grid.parentElement;
            }

            if (grid) {
                grid.classList.add('cdi-checkbox-grid');
            }
        }
    }
});