import { Control, FieldValues, Path } from 'react-hook-form';
import { FormControl, FormDescription, FormField, FormItem } from './ui/form';
import { Switch } from './ui/switch';

type Props<TFormValues extends FieldValues> = {
  description: string;
  controlName: Path<TFormValues>;
  control: Control<TFormValues>;
};

const SettingsContainer = <TFormValues extends FieldValues>({
  description,
  controlName,
  control,
}: Props<TFormValues>) => {
  return (
    <FormField
      control={control}
      name={controlName}
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between">
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
