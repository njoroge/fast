interface FormAssociatedElement
    extends Pick<
            ElementInternals,
            | "form"
            | "validity"
            | "validationMessage"
            | "willValidate"
            | "checkValidity"
            | "reportValidity"
            | "labels"
        > {}
/**
 * HTMLElement.attachInternals()
 * remove when this goes through: https://github.com/microsoft/TSJS-lib-generator/pull/818/files
 */
interface ValidityStateFlags {
    badInput?: boolean;
    customError?: boolean;
    patternMismatch?: boolean;
    rangeOverflow?: boolean;
    rangeUnderflow?: boolean;
    stepMismatch?: boolean;
    tooLong?: boolean;
    tooShort?: boolean;
    typeMismatch?: boolean;
    valueMissing?: boolean;
}

/**
 * Source:
 * https://html.spec.whatwg.org/multipage/custom-elements.html#elementinternals
 */
interface ElementInternals {
    /**
     * Returns the form owner of internals target element.
     */
    readonly form: HTMLFormElement | null;
    /**
     * Returns a NodeList of all the label elements that internals target element is associated with.
     */
    readonly labels: NodeList;
    /**
     * Returns the error message that would be shown to the user if internals target element was to be checked for validity.
     */
    readonly validationMessage: string;
    /**
     * Returns the ValidityState object for internals target element.
     */
    readonly validity: ValidityState;
    /**
     * Returns true if internals target element will be validated when the form is submitted; false otherwise.
     */
    readonly willValidate: boolean;
    /**
     * Returns true if internals target element has no validity problems; false otherwise. Fires an invalid event at the element in the latter case.
     */
    checkValidity(): boolean;
    /**
     * Returns true if internals target element has no validity problems; otherwise, returns false, fires an invalid event at the element, and (if the event isn't canceled) reports the problem to the user.
     */
    reportValidity(): boolean;
    /**
     * Sets both the state and submission value of internals target element to value.
     *
     * If value is null, the element won't participate in form submission.
     */
    setFormValue(value: File | string | FormData, state?: File | string | FormData): void;
    /**
     * Marks internals target element as suffering from the constraints indicated by the flags argument, and sets the element's validation message to message. If anchor is specified, the user agent might use it to indicate problems with the constraints of internals target element when the form owner is validated interactively or reportValidity() is called.
     */
    setValidity(flags: ValidityStateFlags, message?: string, anchor?: HTMLElement): void;
}

declare var ElementInternals: {
    prototype: ElementInternals;
    new (): ElementInternals;
};

interface HTMLElement {
    attachInternals?(): ElementInternals;
}