// Row shapes as they cross the API boundary (camelCased, JSON-serialized).

export type Trip = {
  id: number;
  tripName: string;
  tripDate: string;
  tripText: string | null;
};

export type Memory = {
  id: number;
  tripId: number;
  memoryTitle: string | null;
  memoryText: string | null;
};

export type Photo = {
  id: number;
  cityId: number | null;
  photoFilepath: string;
  date: string | null;
  caption: string | null;
};

export type City = {
  id: number;
  provinceId: number;
  cityName: string;
};

export type Province = {
  id: number;
  countryId: number;
  provinceName: string;
  provinceCode: string;
};

export type Country = {
  id: number;
  countryName: string | null;
  countryCode: string | null;
};

export type SearchResult = {
  id: number;
  name: string;
  type: 'city' | 'province' | 'country' | 'trip' | 'memory';
  score: number;
};

export type CitySearchResult = {
  id: number;
  cityName: string;
  score: number;
};

export type ProvinceSearchResult = {
  id: number;
  provinceName: string;
  score: number;
};

export type CountrySearchResult = {
  id: number;
  countryId: number;
  countryName: string;
  score: number;
};

export type TripSearchResult = Trip & { score: number };

export type MemorySearchResult = Memory & { score: number };
