import { MODULE_SCHEMAS } from './modules';
import { Separator } from '@/components/ui/separator';
import { FieldDisplay } from './shared/field-display';
import { TYPE_RENDERERS } from './shared/field-renderers';
import { resolvePath } from './shared/resolve.path';

export function RequestDetailsView({ item, moduleName }) {
  const schema = MODULE_SCHEMAS[moduleName];

  if (!schema) {
    return <p className="text-sm text-gray-500">No schema available for this module.</p>;
  }

  return (
    <div className="px-1">
      <div className="space-y-6">
        {schema.sections.map((section) => (
          <div key={section.title} className="space-y-4">
            {section.title && (
              <>
                <h3 className="text-sm font-semibold text-gray-700">{section.title}</h3>
                <Separator />
              </>
            )}
            <div className="grid grid-cols-2 gap-6 pb-8">
              {section.fields.map((field, index) => {
                let rawValue = resolvePath(item, field.path);
                const formattedValue = field.formatter ? field.formatter(rawValue, item) : rawValue;
                const renderer = TYPE_RENDERERS[field.type];
                const value = renderer ? renderer(formattedValue) : formattedValue;

                return <FieldDisplay key={index} label={field.label} value={value} fullWidth={field.fullWidth} />;
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
