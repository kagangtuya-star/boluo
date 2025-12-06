import { type FC, useCallback, useMemo, useRef, useState, useEffect } from 'react';
import {
  PALETTE_PREFIX,
  RANDOM_PREFIX,
  computeColors,
  generateColor,
  palette,
  paletteKeys,
  parseGameColor,
} from '@boluo/color';
import { type ApiError, type User } from '@boluo/api';
import { FormattedMessage } from 'react-intl';
import useSWRMutation from 'swr/mutation';
import { post } from '@boluo/api-browser';
import { mutate } from 'swr';
import { useTheme } from '@boluo/theme/react';
import { resolveSystemTheme } from '@boluo/theme';
import { Button } from '@boluo/ui/Button';
import { SketchPicker, type ColorResult } from 'react-color';

const isValidHexColor = (color: string): boolean => {
  if (typeof color !== 'string') return false;
  return /^#[0-9a-fA-F]{6}$/.test(color);
};

const ColorCell: FC<{
  color: string;
  selected: boolean;
  onClick: (color: string) => void;
  isLoading: boolean;
  title?: string;
}> = ({ color, selected, onClick, isLoading, title }) => {
  return (
    <button
      type="button"
      title={title}
      className={`h-10 w-10 rounded border-[2px] ${isLoading ? 'cursor-not-allowed grayscale' : 'cursor-pointer'} ${selected ? 'border-highest' : 'border-lowest'}`}
      style={{ backgroundColor: color }}
      onClick={() => !isLoading && onClick(color)}
      disabled={isLoading}
    />
  );
};

const PresetSwatch: FC<{
  color: string;
  onClick: (color: string) => void;
  disabled: boolean;
}> = ({ color, onClick, disabled }) => {
  return (
    <button
      type="button"
      title={`Select ${color}`}
      className={`border-lowest h-6 w-6 rounded border ${disabled ? 'cursor-not-allowed grayscale' : 'hover:border-medium cursor-pointer'}`}
      style={{ backgroundColor: color }}
      onClick={() => !disabled && onClick(color)}
      disabled={disabled}
    />
  );
};

// Simple Refresh Icon SVG (can be replaced with text or icon font)
const RefreshIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.8}
    stroke="currentColor"
    className="h-4 w-4"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
    />
  </svg>
);

export const EditDefaultColor: FC<{ currentUser: User }> = ({ currentUser }) => {
  const theme = resolveSystemTheme(useTheme());
  const key = ['/users/query', null] as const;
  const { trigger, isMutating } = useSWRMutation<User, ApiError, typeof key, string>(
    key,
    async (_, { arg: color }) => {
      if (!color) {
        throw new Error('Invalid color selected');
      }
      const editResult = await post('/users/edit', null, { defaultColor: color });
      return editResult.unwrap();
    },
    {
      onSuccess: async () => {
        await mutate(['/users/query', null]);
        await mutate(['/users/query', currentUser.id]);
      },
      onError: (err) => {
        console.error('Failed to update color:', err);
      },
    },
  );

  const isCurrentColorCustomHex = useMemo(
    () => isValidHexColor(currentUser.defaultColor),
    [currentUser.defaultColor],
  );

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customColorDraft, setCustomColorDraft] = useState<string>('#FFFFFF');
  const pickerContainerRef = useRef<HTMLDivElement>(null);

  // Function to generate presets
  const generateRandomPresets = useCallback((userId: string): string[] => {
    return Array.from({ length: 16 }, (_, i) =>
      // Adding Math.random() to the seed ensures they change on refresh
      generateColor(userId + '-preset-' + i + Math.random().toString()),
    );
  }, []); // No dependencies needed for the function itself

  // State to hold the presets
  const [randomPresets, setRandomPresets] = useState<string[]>(() =>
    generateRandomPresets(currentUser.id),
  );

  // Function to refresh presets
  const handleRefreshPresets = useCallback(() => {
    setRandomPresets(generateRandomPresets(currentUser.id));
  }, [currentUser.id, generateRandomPresets]); // Recreate if userId or generator changes

  useEffect(() => {
    const currentCustom = isCurrentColorCustomHex ? currentUser.defaultColor : '#FFFFFF';
    setCustomColorDraft(currentCustom);
  }, [currentUser.defaultColor, isCurrentColorCustomHex]);

  const handleEditDefaultColor = useCallback(
    (color: string) => {
      if (color !== currentUser.defaultColor) {
        void trigger(color);
      }
    },
    [currentUser.defaultColor, trigger],
  );

  const handlePickerChange = useCallback((color: ColorResult) => {
    setCustomColorDraft(color.hex);
  }, []);

  const handleApplyCustomColor = useCallback(() => {
    if (isValidHexColor(customColorDraft)) {
      handleEditDefaultColor(customColorDraft);
    }
    setShowColorPicker(false);
  }, [customColorDraft, handleEditDefaultColor]);

  const handleCancelCustomColor = useCallback(() => {
    const currentCustom = isCurrentColorCustomHex ? currentUser.defaultColor : '#FFFFFF';
    setCustomColorDraft(currentCustom);
    setShowColorPicker(false);
  }, [currentUser.defaultColor, isCurrentColorCustomHex]);

  const handleSelectRandomSwatch = useCallback(
    (color: string) => {
      if (isValidHexColor(color)) {
        handleEditDefaultColor(color);
      }
      setShowColorPicker(false);
    },
    [handleEditDefaultColor],
  );

  const toggleColorPicker = useCallback(() => {
    const newState = !showColorPicker;
    if (newState) {
      const currentCustom = isCurrentColorCustomHex ? currentUser.defaultColor : '#FFFFFF';
      setCustomColorDraft(currentCustom);
      // Optionally refresh presets when picker opens? Or keep manual refresh only.
      // handleRefreshPresets();
    }
    setShowColorPicker(newState);
  }, [showColorPicker, isCurrentColorCustomHex, currentUser.defaultColor]); // Removed handleRefreshPresets from here unless desired

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerContainerRef.current &&
        !pickerContainerRef.current.contains(event.target as Node)
      ) {
        handleCancelCustomColor();
      }
    };

    if (showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColorPicker, handleCancelCustomColor]);

  const parsedColors = useMemo(
    () => parseGameColor(currentUser.defaultColor),
    [currentUser.defaultColor],
  );
  const computedColors = useMemo(
    () => computeColors(currentUser.id, parsedColors),
    [currentUser.id, parsedColors],
  );

  const isRandomSelected = useMemo(() => {
    const parsed = parsedColors[theme];
    return parsed?.type === 'random';
  }, [parsedColors, theme]);

  const randomColorSeedSuffix = useMemo(() => {
    const parsed = parsedColors[theme];
    return parsed?.type === 'random' ? parsed.seed : '';
  }, [parsedColors, theme]);

  const currentRandomColor = useMemo(
    () => generateColor(currentUser.id + randomColorSeedSuffix),
    [currentUser.id, randomColorSeedSuffix],
  );

  const customColorButtonSwatch = isCurrentColorCustomHex ? currentUser.defaultColor : '#ccc';

  return (
    <div>
      <div className="block pb-1 font-bold">
        <FormattedMessage defaultMessage="Default Color" />
      </div>
      <div className="flex w-full gap-2 py-4">
        <div className="light">
          <div className="bg-pane-bg rounded-lg border p-6" style={{ color: computedColors.light }}>
            <FormattedMessage defaultMessage="In Light Mode" />
          </div>
        </div>
        <div className="dark">
          <div className="bg-pane-bg rounded-lg border p-6" style={{ color: computedColors.dark }}>
            <FormattedMessage defaultMessage="In Dark Mode" />
          </div>
        </div>
      </div>

      {/* Random Color Section */}
      <div className="flex items-center gap-2 py-2">
        <ColorCell
          color={generateColor(currentUser.id + randomColorSeedSuffix)}
          selected={parsedColors[theme].type === 'random'}
          onClick={() => handleEditDefaultColor(RANDOM_PREFIX + randomColorSeedSuffix)}
          isLoading={isMutating}
        />
        <Button
          onClick={() => {
            handleEditDefaultColor(RANDOM_PREFIX + Math.random().toString());
            setShowColorPicker(false);
          }}
          disabled={isMutating}
        >
          <FormattedMessage defaultMessage="Shuffle Random Color" />
        </Button>
      </div>

      {/* Custom Color Section - Button and Picker Area */}
      <div className="relative py-2">
        <div className="flex items-center gap-2">
          <div
            title={
              isCurrentColorCustomHex
                ? `Current: ${currentUser.defaultColor}`
                : 'No custom color selected'
            }
            className={`h-10 w-10 flex-shrink-0 rounded border-[2px] ${isCurrentColorCustomHex ? 'border-highest' : 'border-lowest'} ${isMutating && isCurrentColorCustomHex ? 'grayscale' : ''}`}
            style={{ backgroundColor: customColorButtonSwatch }}
          />
          <Button onClick={toggleColorPicker} disabled={isMutating}>
            <FormattedMessage defaultMessage="自定义颜色" />
          </Button>
        </div>

        {/* Picker, Preview, Presets and Action Buttons Container */}
        {showColorPicker && (
          <div
            ref={pickerContainerRef}
            className="bg-lowest absolute z-10 mt-2 w-auto rounded border p-3 shadow-lg"
          >
            <SketchPicker
              color={customColorDraft}
              onChange={handlePickerChange}
              disableAlpha={true}
              presetColors={[]}
            />

            {/* Preview and Random Preset Swatches */}
            <div className="border-lowest mt-3 border-t pt-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-medium text-xs font-medium">
                  <FormattedMessage defaultMessage="拖动色板预览颜色" />
                </span>
                <div
                  title={`Preview: ${customColorDraft}`}
                  className="border-lowest h-6 w-10 rounded border"
                  style={{ backgroundColor: customColorDraft }}
                />
              </div>

              {/* --- Title Row with Refresh Button --- */}
              <div className="mb-1 flex items-center justify-between">
                <span className="text-medium text-xs font-medium">
                  <FormattedMessage defaultMessage="或在下面选择一个随机颜色:" />
                </span>
                <button
                  type="button"
                  onClick={handleRefreshPresets}
                  className="text-low hover:bg-higher hover:text-high rounded p-0.5 disabled:opacity-50"
                  title="Refresh suggestions"
                  disabled={isMutating} // Disable refresh during save
                >
                  <RefreshIcon />
                </button>
              </div>
              {/* --- End Title Row --- */}

              <div className="flex flex-wrap gap-2">
                {randomPresets.map((presetColor) => (
                  <PresetSwatch
                    key={presetColor} // Key might change on refresh, which is fine
                    color={presetColor}
                    onClick={handleSelectRandomSwatch}
                    disabled={isMutating}
                  />
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-lowest mt-3 flex justify-end gap-2 border-t pt-3">
              <Button variant="default" onClick={handleCancelCustomColor}>
                <FormattedMessage defaultMessage="Cancel" />
              </Button>
              <Button variant="primary" onClick={handleApplyCustomColor} disabled={isMutating}>
                <FormattedMessage defaultMessage="应用" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Palette Color Section */}
      <div className="flex flex-wrap gap-1 py-2">
        {paletteKeys.map((colorKey) => {
          const paletteColorString = `${PALETTE_PREFIX}${colorKey}`;
          const selected = currentUser.defaultColor === paletteColorString;
          return (
            <ColorCell
              key={colorKey}
              title={`Palette: ${colorKey}`}
              color={palette[colorKey][theme]}
              selected={selected}
              onClick={() => handleEditDefaultColor(`${PALETTE_PREFIX}${color}`)}
              isLoading={isMutating}
            />
          );
        })}
      </div>
    </div>
  );
};
