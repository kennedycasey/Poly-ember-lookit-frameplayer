import Ember from 'ember';
import ExpLookitSurveyComponent from '../exp-lookit-survey/component';

const {
    computed
} = Ember;

/**
 * CDI vocabulary checklist.
 *
 * Extends exp-lookit-survey so the component keeps the existing:
 * - dynamic-form setup
 * - response collection
 * - validation
 * - Previous button behavior
 * - Finish/Next button behavior
 */
export default ExpLookitSurveyComponent.extend({
    classNames: ['exp-lookit-cdi'],

    /**
     * Default text used when the protocol does not provide a title.
     *
     * The template should use:
     *     {{displayChecklistTitle}}
     */
    defaultChecklistTitle: 'Vocabulary checklist',

    /**
     * Default text used when the protocol does not provide instructions.
     *
     * The template should use:
     *     {{displayChecklistInstructions}}
     */
    defaultChecklistInstructions:
        'Children understand many more words than they say. ' +
        'We are particularly interested in the words your child SAYS. ' +
        'Please mark every word you have heard your child use. ' +
        'If your child uses a different pronunciation of a word, mark it anyway. ' +
        'This is only a sample of words; your child may know many other words not on this list.',

    /**
     * Look for checklistTitle in both possible configuration locations.
     *
     * Some Lookit versions expose frame properties directly on the component.
     * Other versions keep them under frameContext.
     */
    displayChecklistTitle: computed(
        'checklistTitle',
        'frameContext.checklistTitle',
        'defaultChecklistTitle',
        function() {
            return (
                this.get('checklistTitle') ||
                this.get('frameContext.checklistTitle') ||
                this.get('defaultChecklistTitle')
            );
        }
    ),

    /**
     * Look for checklistInstructions in both possible configuration locations.
     */
    displayChecklistInstructions: computed(
        'checklistInstructions',
        'frameContext.checklistInstructions',
        'defaultChecklistInstructions',
        function() {
            return (
                this.get('checklistInstructions') ||
                this.get('frameContext.checklistInstructions') ||
                this.get('defaultChecklistInstructions')
            );
        }
    ),

    /**
     * Count the properties in the dynamic-form schema.
     */
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
    )
});