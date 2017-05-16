import args from './args';

function multivendor(path) {
  return [`app/${args.vendor}/${path}`, `app/common/${path}`];
}

export { multivendor };
