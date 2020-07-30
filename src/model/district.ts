import nuts from './nuts';
import { asc } from '../utils/compareStrings';

export const all = nuts
  .filter(({ id }) => id.length === 6)
  .sort((a, b) => asc(a.name, b.name));

export const byId = (id: string) => all.find((d) => d.id === id);
