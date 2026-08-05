import ExpLookitSurveyComponent from '../exp-lookit-survey/component';

/**
 * CDI vocabulary checklist.
 *
 * Reuses exp-lookit-survey's dynamic-form setup, response collection,
 * validation, previous, and finish behavior. The accompanying template and
 * stylesheet only change presentation.
 */
export default ExpLookitSurveyComponent.extend({
    classNames: ['exp-lookit-cdi'],

    // Optional frame configuration values.
    checklistTitle: 'Vocabulary checklist',
    checklistInstructions:
        'hildren understand many more words than they say. We are particularly interested in teh words your child SAYS. Please mark the words you have heard your child use. If your child uses a different pronunciation of the word, mark it anyway. This is only a sample of words; your child may know many other words not on this list.',

    didReceiveAttrs() {
        this._super(...arguments);

        // Give the template a count without requiring a second word list.
        const schema = this.get('formSchema.schema') || {};
        const properties = schema.properties || {};
        this.set('wordCount', Object.keys(properties).length);
    }
});