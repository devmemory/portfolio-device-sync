import { PaginationDto } from '../dto';

export const getPagination = (dto: PaginationDto) => {
  const { page, limit, orderBy, order } = dto;

  if (orderBy && order) {
    return {
      skip: (page - 1) * limit,
      take: limit,
      order: { [orderBy]: order },
    };
  }

  return {
    skip: (page - 1) * limit,
    take: limit,
  };
};
