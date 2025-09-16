export function FromDTOtoEntity<
  TDto extends Record<string, any>,
  TEntity extends Record<string, any>,
>(dto: TDto, entity: any): TEntity {
  const dtoEntries = Object.entries(dto);

  for (const [key, value] of dtoEntries) {
    if (entity.hasOwnProperty(key)) {
      entity[key] = value;
    }
  }

  for (const [key, value] of Object.entries(entity)) {
    if (!value) delete entity[key];
  }

  return entity;
}
