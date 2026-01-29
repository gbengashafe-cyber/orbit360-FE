export function createPageUrl(pageName: string) {
  return '/' + pageName.toLowerCase().replace(/ /g, '-');
}

export class logger {
  static error = async (payload) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(payload);
    }
  };
}
