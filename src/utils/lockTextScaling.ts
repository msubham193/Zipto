import React from 'react';
import { Animated, Text, TextInput } from 'react-native';

const LOCKED_TEXT_DEFAULTS = {
  allowFontScaling: false,
  maxFontSizeMultiplier: 1,
} as const;

const TEXT_COMPONENTS = new Set<unknown>([Text, TextInput, Animated.Text]);

function applyDefaultTextProps() {
  const textDefaults = ((Text as any).defaultProps ?? {}) as Record<string, unknown>;
  (Text as any).defaultProps = { ...textDefaults, ...LOCKED_TEXT_DEFAULTS };

  const inputDefaults = ((TextInput as any).defaultProps ?? {}) as Record<string, unknown>;
  (TextInput as any).defaultProps = { ...inputDefaults, ...LOCKED_TEXT_DEFAULTS };
}

function isTextElement(type: unknown): boolean {
  return TEXT_COMPONENTS.has(type);
}

function withLockedTextProps(props: Record<string, unknown> | null | undefined) {
  const merged = { ...(props ?? {}) };
  const allowFontScaling = merged.allowFontScaling === true;

  return {
    ...merged,
    allowFontScaling,
    maxFontSizeMultiplier: allowFontScaling
      ? Math.min(
          typeof merged.maxFontSizeMultiplier === 'number'
            ? merged.maxFontSizeMultiplier
            : 1,
          1.2,
        )
      : 1,
  };
}

function patchCreateElement() {
  const createElement = React.createElement.bind(React);

  (React as any).createElement = (type: any, props: any, ...children: any[]) => {
    if (isTextElement(type)) {
      return createElement(type, withLockedTextProps(props), ...children);
    }
    return createElement(type, props, ...children);
  };
}

function patchJsxRuntime(module: { jsx: any; jsxs: any }) {
  const { jsx, jsxs } = module;

  module.jsx = (type: any, props: any, key?: string) => {
    if (isTextElement(type)) {
      return jsx(type, withLockedTextProps(props), key);
    }
    return jsx(type, props, key);
  };

  module.jsxs = (type: any, props: any, key?: string) => {
    if (isTextElement(type)) {
      return jsxs(type, withLockedTextProps(props), key);
    }
    return jsxs(type, props, key);
  };
}

patchCreateElement();
applyDefaultTextProps();

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  patchJsxRuntime(require('react/jsx-runtime'));
} catch {
  // Non-fatal when the runtime is unavailable in some test environments.
}

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  patchJsxRuntime(require('react/jsx-dev-runtime'));
} catch {
  // Non-fatal when the dev runtime is unavailable.
}
