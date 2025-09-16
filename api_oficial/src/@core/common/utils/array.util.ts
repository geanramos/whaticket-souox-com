export function validarFields(fields: Array<string>, obj: any) {
  return fields.reduce((acc, cur) => {
    if (obj[`${cur}`] instanceof Object) {
      if (obj[`${cur}`] == null) {
        acc.push(cur);
      }
    } else {
      if (obj[`${cur}`] == null || obj[`${cur}`] == undefined) {
        acc.push(cur);
      }
    }
    return acc;
  }, []);
}

/**
 * ordena os valores de um array de objetos pela propriedade
 *
 * @example array.sort(dynamicSort("propriedade")) // ordenação asc
 * @example array.sort(dynamicSort("-propriedade")) // ordenação desc
 *
 * @param {Array} property
 * @returns {Array}
 */
export function dynamicSort(property: string) {
  let sortOrder = 1;
  if (property[0] === '-') {
    sortOrder = -1;
    property = property.substr(1);
  }
  return function (a, b) {
    const result =
      a[property] < b[property] ? -1 : a[property] > b[property] ? 1 : 0;
    return result * sortOrder;
  };
}
