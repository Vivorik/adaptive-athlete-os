export const MUSCLE_GROUPS = [
  "chest",
  "back",
  "legs",
  "shoulders",
  "arms",
  "core",
  "full_body",
] as const;

export const EQUIPMENT = [
  "barbell",
  "dumbbell",
  "machine",
  "cable",
  "bodyweight",
  "kettlebell",
  "band",
] as const;

export const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];
export type Equipment = (typeof EQUIPMENT)[number];
export type Difficulty = (typeof DIFFICULTIES)[number];

export type Exercise = {
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  difficulty: Difficulty;
  isCompound: boolean;
};

export const EXERCISES: Exercise[] = [
  { name: "Жим штанги лёжа", muscleGroup: "chest", equipment: "barbell", difficulty: "intermediate", isCompound: true },
  { name: "Жим гантелей лёжа", muscleGroup: "chest", equipment: "dumbbell", difficulty: "intermediate", isCompound: true },
  { name: "Жим гантелей на наклонной скамье", muscleGroup: "chest", equipment: "dumbbell", difficulty: "intermediate", isCompound: true },
  { name: "Отжимания от пола", muscleGroup: "chest", equipment: "bodyweight", difficulty: "beginner", isCompound: true },
  { name: "Сведение рук в кроссовере", muscleGroup: "chest", equipment: "cable", difficulty: "beginner", isCompound: false },
  { name: "Разводка гантелей", muscleGroup: "chest", equipment: "dumbbell", difficulty: "beginner", isCompound: false },
  { name: "Жим в кроссовере одной рукой", muscleGroup: "chest", equipment: "cable", difficulty: "beginner", isCompound: false },

  { name: "Становая тяга штанги", muscleGroup: "back", equipment: "barbell", difficulty: "intermediate", isCompound: true },
  { name: "Тяга штанги в наклоне", muscleGroup: "back", equipment: "barbell", difficulty: "intermediate", isCompound: true },
  { name: "Подтягивания", muscleGroup: "back", equipment: "bodyweight", difficulty: "advanced", isCompound: true },
  { name: "Тяга верхнего блока", muscleGroup: "back", equipment: "cable", difficulty: "beginner", isCompound: true },
  { name: "Тяга гантели в одной руке", muscleGroup: "back", equipment: "dumbbell", difficulty: "beginner", isCompound: true },
  { name: "Тяга гантели в наклоне с упором", muscleGroup: "back", equipment: "dumbbell", difficulty: "beginner", isCompound: true },
  { name: "Австралийские подтягивания", muscleGroup: "back", equipment: "bodyweight", difficulty: "beginner", isCompound: true },
  { name: "Тяга гантели сидя на скамье", muscleGroup: "back", equipment: "dumbbell", difficulty: "beginner", isCompound: false },
  { name: "Разведение рук в кроссовере", muscleGroup: "back", equipment: "cable", difficulty: "beginner", isCompound: false },
  { name: "Тяга резинки сидя", muscleGroup: "back", equipment: "band", difficulty: "beginner", isCompound: false },

  { name: "Присед со штангой", muscleGroup: "legs", equipment: "barbell", difficulty: "intermediate", isCompound: true },
  { name: "Жим ногами в тренажёре", muscleGroup: "legs", equipment: "machine", difficulty: "beginner", isCompound: true },
  { name: "Румынская тяга с гантелями", muscleGroup: "legs", equipment: "dumbbell", difficulty: "beginner", isCompound: true },
  { name: "Выпады с гантелями", muscleGroup: "legs", equipment: "dumbbell", difficulty: "beginner", isCompound: true },
  { name: "Присед с гантели на одной ноге", muscleGroup: "legs", equipment: "dumbbell", difficulty: "intermediate", isCompound: true },
  { name: "Разгибания ног в тренажёре", muscleGroup: "legs", equipment: "machine", difficulty: "beginner", isCompound: false },
  { name: "Сгибания ног лёжа в тренажёре", muscleGroup: "legs", equipment: "machine", difficulty: "beginner", isCompound: false },
  { name: "Подъёмы на носки стоя", muscleGroup: "legs", equipment: "machine", difficulty: "beginner", isCompound: false },

  { name: "Взятие гантелей на грудь стоя", muscleGroup: "full_body", equipment: "dumbbell", difficulty: "intermediate", isCompound: true },
  { name: "Гоблет-присед", muscleGroup: "full_body", equipment: "dumbbell", difficulty: "beginner", isCompound: true },
  { name: "Жим гантелей над головой сидя", muscleGroup: "full_body", equipment: "dumbbell", difficulty: "beginner", isCompound: true },
  { name: "Отжимания узким хватом на брусьях", muscleGroup: "full_body", equipment: "bodyweight", difficulty: "advanced", isCompound: true },

  { name: "Жим штанги стоя", muscleGroup: "shoulders", equipment: "barbell", difficulty: "intermediate", isCompound: true },
  { name: "Жим гантелей сидя", muscleGroup: "shoulders", equipment: "dumbbell", difficulty: "beginner", isCompound: true },
  { name: "Тяга штанги к подбородку", muscleGroup: "shoulders", equipment: "barbell", difficulty: "beginner", isCompound: true },
  { name: "Махи гантелями в стороны", muscleGroup: "shoulders", equipment: "dumbbell", difficulty: "beginner", isCompound: false },
  { name: "Разводка в кроссовере", muscleGroup: "shoulders", equipment: "cable", difficulty: "beginner", isCompound: false },

  { name: "Подъём штанги на бицепс стоя", muscleGroup: "arms", equipment: "barbell", difficulty: "beginner", isCompound: false },
  { name: "Молотки с гантелями", muscleGroup: "arms", equipment: "dumbbell", difficulty: "beginner", isCompound: false },
  { name: "Сгибания на скамье Скотта", muscleGroup: "arms", equipment: "machine", difficulty: "beginner", isCompound: false },
  { name: "Разгибания на верхнем блоке", muscleGroup: "arms", equipment: "cable", difficulty: "beginner", isCompound: false },
  { name: "Французский жим гантелей", muscleGroup: "arms", equipment: "dumbbell", difficulty: "intermediate", isCompound: false },

  { name: "Планка", muscleGroup: "core", equipment: "bodyweight", difficulty: "beginner", isCompound: false },
  { name: "Скручивания", muscleGroup: "core", equipment: "bodyweight", difficulty: "beginner", isCompound: false },
  { name: "Подъёмы ног в висе", muscleGroup: "core", equipment: "bodyweight", difficulty: "intermediate", isCompound: false },
  { name: "Русские скручивания", muscleGroup: "core", equipment: "dumbbell", difficulty: "beginner", isCompound: true },

  { name: "Ягодичный мост с резинкой", muscleGroup: "legs", equipment: "band", difficulty: "beginner", isCompound: true },
  { name: "Разгибания на резинке", muscleGroup: "arms", equipment: "band", difficulty: "beginner", isCompound: false },
  { name: "Присед с гирей", muscleGroup: "full_body", equipment: "kettlebell", difficulty: "intermediate", isCompound: true },
];
