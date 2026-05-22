export interface OwnerNotes {
  habits: string;
  feeding: string;
  symptoms: string;
}

export interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: number;
  weight: number;
  ownerId: string;
  ownerName: string;
  photo: string | null;
  allergies?: string;
  clinicalNotes?: string;
  ownerNotes?: OwnerNotes;
  createdAt: string;
}

export interface PetInput {
  name: string;
  species: string;
  breed: string;
  age: number;
  weight: number;
  ownerId?: string;
  ownerName?: string;
  photo?: string | null;
  allergies?: string;
  clinicalNotes?: string;
}

export interface OwnerOption {
  id: string;
  fullName: string;
  email: string;
}
