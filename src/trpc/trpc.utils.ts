// trpc utility functions

export const mapStatusCodeToTRPCCode = (statusCode: number | undefined) => {
  switch (statusCode) {
    case 400:
      return -32600;
    case 401:
      return -32001;
    case 403:
      return -32003;
    case 404:
      return -32004;
    case 405:
      return -32005;
    case 408:
      return -32008;
    case 409:
      return -32009;
    case 412:
      return -32012;
    case 413:
      return -32013;
    case 415:
      return -32015;
    case 422:
      return -32022;
    case 429:
      return -32029;
    case 499:
      return -32099;
    case 500:
    default:
      return -32603;
  }
};
