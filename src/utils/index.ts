export function createPageUrl(pageName: string) {
  return '/' + pageName.toLowerCase().replace(/ /g, '-');
}

export class logger {
  static error = async ({ caller, payload }: { caller: string; payload: any }) => {
    if (!caller || !payload) {
      throw new Error('Error logger accepts only {caller, payload} arguments');
    }
    if (process.env.NODE_ENV === 'development') {
      console.error(caller);
      console.error(payload);
    }
  };
}
