import React from 'react';
import { Control } from 'react-hook-form';
import { FormControl, FormDescription, FormField, FormItem } from './ui/form';
import { Switch } from './ui/switch';

type Props<TFormValues extends Record<string, any>> = {
  description: string;
  controlName: keyof TFormValues & string;
  control: Control<TFormValues, any>;
};

const SettingsContainer: React.FC<Props<any>> = ({
  description,
  controlName,
  control,
}) => {
  return (
    <FormField
      control={control}
      name={controlName}
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border shadow-sm">
          <FormDescription className="text-sm text-foreground">
            {description}
          </FormDescription>

          <FormControl>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
        </FormItem>
      )}
    />
  );
};

export default SettingsContainer;
