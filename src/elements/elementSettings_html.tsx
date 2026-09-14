import React from "react";
import { HTMLSettings } from "src/formRendering/ElementConstants";

import ScriptEditor from "../helpers/ScriptEditor";

interface HtmlSettingsEditorProps {
    htmlSettings?: HTMLSettings;
    onChange?: (settings: HTMLSettings) => void;
}

interface HtmlSettingsEditorState {
    settings: HTMLSettings;
    touched: Record<string, boolean>;
}

/** Validation error messages for the mandatory html-settings fields. */

const defaultHtmlSettings: HTMLSettings = {
    htmlCode: "",
};

export class HtmlSettingsEditor extends React.Component<HtmlSettingsEditorProps, HtmlSettingsEditorState> {
    private readonly scriptProps: Record<string, string>;

    constructor(props: HtmlSettingsEditorProps) {
        super(props);
        this.state = {
            settings: props.htmlSettings ?? defaultHtmlSettings,
            touched: {},
        };
        this.scriptProps = { htmlCode: this.state.settings.htmlCode ?? "" };
    }

    private handleScriptChange = () => {
        const newSettings = { ...this.state.settings, htmlCode: this.scriptProps.htmlCode };
        this.setState((prev) => ({
            settings: newSettings,
            touched: { ...prev.touched, htmlCode: true },
        }));
        this.props.onChange?.(newSettings);
    };

    public render() {
        const { settings } = this.state;

        return (
            <div className="form-group">
                <label htmlFor="htmlCodeInput">HTML content</label>
                <ScriptEditor
                    id="htmlCodeInput"
                    fieldName="htmlCode"
                    initialDoc={settings.htmlCode ?? ""}
                    ariaLabel="HTML content"
                    className="script-editor"
                    scriptProps={this.scriptProps}
                    callback={this.handleScriptChange}
                />
            </div>
        );
    }
}
