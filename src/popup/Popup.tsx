import { updateAppIcon } from '@/lib/utils';
import React, { useEffect, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';
import Setting from '../components/Setting';
import SettingsContainer from '../components/SettingsContainer';
import SettingsHeader from '../components/SettingsHeader';
import { Form } from '../components/ui/form';
import { Separator } from '../components/ui/separator';
import { getSettings, saveSettings } from '../lib/settings';
import { SettingsSchema, SettingsSchemaType } from '../schemas/settings.schema';

const Popup: React.FC = () => {
  const form = useForm<SettingsSchemaType>({
    defaultValues: {
      clio_open_docs: true,
      clio_enhance_docs: true,
      pacer_auto_save_and_archive: true,
      pacer_notify_when_archived: true,
    },
  });
  const [initialValues, setInitialValues] = useState<SettingsSchemaType>({
    clio_open_docs: true,
    clio_enhance_docs: true,
    pacer_auto_save_and_archive: true,
    pacer_notify_when_archived: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getSettings();

        form.reset(settings);
        setInitialValues(settings || initialValues);
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    const subscription = form.watch(async (data) => {
      await saveSettings(data);

      updateAppIcon();
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit: SubmitHandler<z.infer<typeof SettingsSchema>> = (data) =>
    console.log(data);

  if (loading) {
    return <div>Loading settings...</div>;
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          <SettingsHeader>Clio Options</SettingsHeader>

          <SettingsContainer>
            <Setting
              control={form.control}
              controlName="clio_open_docs"
              description="Open Documents with Faster Suite"
            />

            <Setting
              control={form.control}
              controlName="clio_enhance_docs"
              description="Enhance my Clio Documents Experience"
            />
          </SettingsContainer>

          <SettingsHeader>PACER Options</SettingsHeader>

          <SettingsContainer>
            <Setting
              control={form.control}
              controlName="pacer_auto_save_and_archive"
              description="Automatically Save and Archive PACER Documents"
            />

            <Setting
              control={form.control}
              controlName="pacer_notify_when_archived"
              description="Notify me when files are archived"
            />
          </SettingsContainer>
        </form>
      </Form>

      <Separator className="bg-slate-500" />

      <p className="p-5 text-center ">
        <a
          href="https://www.FasterLaw.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4"
        >
          www.FasterLaw.com
        </a>
      </p>
    </>
  );
};

export default Popup;
