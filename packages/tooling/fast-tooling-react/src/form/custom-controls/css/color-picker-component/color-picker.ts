import { ColorHSV, ColorRGBA64, hsvToRGB, parseColor, rgbToHSV } from "@microsoft/fast-colors";
import { attr, DOM, observable } from "@microsoft/fast-element";
import { isNullOrWhiteSpace } from "@microsoft/fast-web-utilities";
import { isNumber } from "util";
import { FormAssociatedColorPicker } from "./color-picker.form-associated";

/**
 * A Color Picker Custom HTML Element.
 *
 * @public
 */
export class ColorPicker extends FormAssociatedColorPicker 
{
    /**
     * When true, the control will be immutable by user interaction. See {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/readonly | readonly HTML attribute} for more information.
     * @public
     * @remarks
     * HTML Attribute: readonly
     */
    @attr({ attribute: "readonly", mode: "boolean" })
    public readOnly: boolean;
    private readOnlyChanged(): void 
    {
        if (this.proxy instanceof HTMLElement) 
        {
            this.proxy.readOnly = this.readOnly;
        }
    }

    /**
     * Indicates that this element should get focus after the page finishes loading. See {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#htmlattrdefautofocus | autofocus HTML attribute} for more information.
     * @public
     * @remarks
     * HTML Attribute: autofocus
     */
    @attr({ mode: "boolean" })
    public autofocus: boolean;
    private autofocusChanged(): void 
    {
        if (this.proxy instanceof HTMLElement) 
        {
            this.proxy.autofocus = this.autofocus;
        }
    }

    /**
     * Sets the placeholder value of the element, generally used to provide a hint to the user.
     * @public
     * @remarks
     * HTML Attribute: placeholder
     * Using this attribute does is not a valid substitute for a labeling element.
     */
    @attr
    public placeholder: string;
    private placeholderChanged(): void 
    {
        if (this.proxy instanceof HTMLElement) 
        {
            this.proxy.placeholder = this.placeholder;
        }
    }

    /**
     * Flag indicating that the color UI is visible.
     */
    @observable
    public isOpen: boolean;

    /**
     * Flag indicating that the color UI is activily listening for mouse move and up events.
     */
    @observable
    public isMouseActive:boolean = false;

    /**
     * Object containing all of the properties displayed in the UI.
     */
    @observable
    public uiValues: ColorPickerUI = new ColorPickerUI(new ColorRGBA64(1,0,0), new ColorHSV(0,1,1));

    /**
     * A reference to the internal input element
     * @internal
     */
    public control: HTMLInputElement;

    /**
     * A reference to the HTMLElement that is the current target of mouse move events.
     */
    private currentMouseTarget:HTMLElement = null;

    /**
     * A string indicating which of the three graphical elements is the current mouse target. ['sv','h','a']
     */
    private currentMouseParam:string;

    /**
     * The ColorRGBA64 representation of the current color value.
     */
    private currentRGBColor: ColorRGBA64;

    /**
     * The ColorHSV representation of the current color value.
     */
    private currentHSVColor: ColorHSV;

    /**
     * @internal
     */
    public connectedCallback(): void 
    {
        super.connectedCallback();
        this.isOpen = false;
        if(!isNullOrWhiteSpace(this.value))
        {
            this.currentRGBColor = parseColor(this.value);
        }
        else
        {
            this.currentRGBColor = new ColorRGBA64(1,0,0,1);
        }
        this.currentHSVColor = rgbToHSV(this.currentRGBColor);
        this.updateUIValues(false);

        this.proxy.setAttribute("type", "colorpicker");

        if (this.autofocus) 
        {
            DOM.queueUpdate(() => {
                this.focus();
            });
        }
    }

    /**
     * Handles the focus event. When the template has focus the color UI will be visable.
     * @internal
     */
    public handleFocus(): void 
    {
        this.isOpen = true;
    }

    /**
     * Handles the blur event. Hides the color UI when the template loses focus.
     * @internal
     */
    public handleBlur(): void 
    {
        this.isOpen = false;
    }

    /**
     * Handles the internal control's `input` event. This event is fired whenever a user types directly into the primary text field.
     * @internal
     */
    public handleTextInput(): void 
    {
        this.value = this.control.value;
        if(this.isValideCSSColor(this.value))
        {
            this.currentRGBColor = parseColor(this.value);
            this.currentHSVColor = rgbToHSV(this.currentRGBColor);
            this.updateUIValues(false);
            this.$emit("change");
        }
    }

    /**
     * Handles the mouse down event on the Sat/Val square and Hue and Alpha sliders. Sets the current targeted element and begins listening for mouse move events.
     * @param param ['sv','h','a'] - string specifying which color property is being modified with the mouse.
     * @param e - A reference to the mouse event.
     */
    public handleMouseDown(param:string, e:MouseEvent)
    {
        this.currentMouseTarget = (<HTMLElement>e.composedPath()[0]);
        this.currentMouseParam = param;
        this.updateFromMouseEvent(e.pageX, e.pageY);
        this.isMouseActive = true;
    }

    /**
     * Handles the mouse move event within the color UI. Is only called once the isMouseActive is set to true.
     * @param e - Reference to the Mouse Event
     */
    public handleMouseMove(e:MouseEvent)
    {
        this.updateFromMouseEvent(e.pageX, e.pageY);
    }

    /**
     * Handles the mouse up event within the color UI. Disables listening for mouse move events.
     * @param e - Reference to the Mouse Event
     */
    public handleMouseUp(e:MouseEvent)
    {
        this.updateFromMouseEvent(e.pageX, e.pageY);
        this.currentMouseTarget = null;
        this.currentMouseParam = null;
        this.isMouseActive = false;
    }

    /**
     * Handles changes to any of the color property text inputs typed by the user.
     * @param param ['r','g','b','a','h','s','v'] - String specifying which color value is being modified.
     * @param e - Reference to the event.
     */
    public handleTextValueInput(param:string,e:Event)
    {
        const inputVal = (<HTMLInputElement>e.composedPath()[0]).value;
        if(isNullOrWhiteSpace(inputVal) || Number.isNaN(inputVal))
        {
            return;
        }
        let newVal: number = parseInt(inputVal);

        if(['r','g','b','a'].includes(param))
        {
            if( (param != 'a' && this.isValideRGB(newVal)) || ( param == 'a' && this.isValideAlpha(newVal) ))
            {
                this.currentRGBColor = new ColorRGBA64(
                    param == 'r' ? newVal / 255 : this.currentRGBColor.r,
                    param == 'g' ? newVal / 255 : this.currentRGBColor.g,
                    param == 'b' ? newVal / 255 : this.currentRGBColor.b,
                    param == 'a' ? newVal / 100 : this.currentRGBColor.a
                );
                this.currentHSVColor = rgbToHSV(this.currentRGBColor);
                this.updateUIValues(true);
            }
        }
        else if(['h','s','v'].includes(param))
        {
            if( (param != 'h' && this.isValideSatVal(newVal)) || ( param == 'h' && this.isValideHue(newVal) ))
            {
                this.updateHSV(
                    param == 'h' ? newVal : this.currentHSVColor.h,
                    param == 's' ? newVal / 100 : this.currentHSVColor.s,
                    param == 'v' ? newVal / 100 : this.currentHSVColor.v
                );
            }
        }
    }

    /**
     * Change event handler for inner control.
     * @remarks
     * "Change" events are not `composable` so they will not
     * permeate the shadow DOM boundary. This fn effectively proxies
     * the change event, emitting a `change` event whenever the internal
     * control emits a `change` event
     * @internal
     */
    public handleChange(): void 
    {
        this.$emit("change");
    }

    /**
     * Determines if a number value is within the valid range for an R, G, or B color channel.
     * @param val - Number to be evaluated.
     */
    private isValideRGB(val: number): boolean
    {
        return val >= 0 && val <= 255;
    }

    /**
     * Determines if a number value is within the valid range for the alpha channel.
     * @param val - Number to be evaluated.
     */
    private isValideAlpha(val: number): boolean
    {
        return val >= 0 && val <= 100;
    }

    /**
     * Determines if a number value is within the valid range for the saturation or value color channels.
     * @param val - Number to be evaluated.
     */
    private isValideSatVal(val: number): boolean
    {
        return val >= 0 && val <= 100;
    }

    /**
     * Determines if a number value is within the valid range for the hue color channel.
     * @param val - Number to be evaluated.
     */
    private isValideHue(val: number): boolean
    {
        return val >= 0 && val <= 359;
    }

    /**
     * Checks if input is a valid CSS color.
     * After placing an invalid css color value into a color style property the value will be an empty string when read back.
     * @internal
     */
    private isValideCSSColor(testValue:string): boolean 
    {
        /* Set the background color of the proxy element since it is not visible in the UI. */
        this.proxy.style.backgroundColor = "";
        this.proxy.style.backgroundColor = testValue;
        /* Read the value back out. If it was not a valid color value then it will be an empty string when read back out. */
        return this.proxy.style.backgroundColor!="" ? true : false;
    }

    /**
     * Update the current color values to a new HSV color.
     * @param hue The new Hue value.
     * @param sat The new saturation value.
     * @param val The new Value value.
     */
    private updateHSV(hue:number, sat:number, val:number)
    {
        this.currentHSVColor = new ColorHSV(hue, sat, val);
        this.currentRGBColor = hsvToRGB(this.currentHSVColor,this.currentRGBColor.a);
        this.updateUIValues(true);
    }

    /**
     * Update the current color values based on the mouse position over one of the three UI elements (hue, saturation/value, or alpha).
     * @param pageX The pageX position of the mouse.
     * @param pageY The pageY position of the mouse.
     */
    private updateFromMouseEvent(pageX:number, pageY:number)
    {
        let pos:DOMRect = this.currentMouseTarget.getBoundingClientRect();
        var x = pageX - pos.left;
		var y = pageY - pos.top;
		var width = pos.width;
        var height = pos.height;

		if (x > width) x = width;
		if (y > height) y = height;
		if (x < 0) x = 0;
		if (y < 0) y = 0;

        if(this.currentMouseParam == 'h')
        {
            let hue:number = ((359 * x) / width);
            this.updateHSV(hue, this.currentHSVColor.s, this.currentHSVColor.v);
        }
        else if(this.currentMouseParam == 'sv')
        {
            let value:number = Math.round(100 - (y * 100 / height))/100;
            let saturation:number = Math.round(x * 100 / width)/100;
            this.updateHSV(this.currentHSVColor.h, saturation, value);
        }
        else if(this.currentMouseParam == 'a')
        {
            let alpha:number = Math.round(x * 100 / width) / 100;
            this.currentRGBColor = new ColorRGBA64(this.currentRGBColor.r, this.currentRGBColor.g, this.currentRGBColor.b, alpha);
            this.updateUIValues(true);
        }
    }

    /**
     * Update the UI values with the current color. This updates the position of the indicators over the Sat/Val, Hue and Alpha elements 
     * and the values in all of the text fields at once. 
     * @param updateValue - Flag to trigger updating of the main text field value and emitting the change event.
     */
    private updateUIValues(updateValue:boolean)
    {
        let newVal = new ColorPickerUI(this.currentRGBColor, this.currentHSVColor);
        this.uiValues = newVal;
        if(updateValue)
        {
            this.value = this.currentRGBColor.a != 1 ? this.currentRGBColor.toStringWebRGBA() : this.currentRGBColor.toStringHexRGB();
            this.$emit("change");
        }
    }
}

/**
 * Simple class for storing all of the UI observable values.
 */
class ColorPickerUI
{
    public RGBColor: ColorRGBA64;
    public HSVColor: ColorHSV;
    public HueCSSColor: string;
    public HuePosition: number;
    public SatValTopPos: number;
    public SatValLeftPos: number;
    public AlphaPos: number;

    constructor(rgbColor:ColorRGBA64, hsvColor:ColorHSV)
    {
        this.RGBColor = rgbColor;
        this.HSVColor = hsvColor;
        let temp = new ColorHSV(this.HSVColor.h,1,1);
        this.HueCSSColor = hsvToRGB(temp).toStringHexRGB();
        this.HuePosition = (this.HSVColor.h / 360) * 100;
        this.SatValLeftPos = this.HSVColor.s * 100;
        this.SatValTopPos = 100 - (this.HSVColor.v * 100);
        this.AlphaPos = this.RGBColor.a * 100;
    }

}