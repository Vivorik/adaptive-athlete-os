import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { EXERCISES, MUSCLE_GROUPS, EQUIPMENT, DIFFICULTIES } from "../src/lib/exercise-catalog.ts";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = resolve(projectRoot, "supabase/seed.sql");

function sqlString(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

function assertUniqueNames() {
  const seen = new Set<string>();

  for (const exercise of EXERCISES) {
    if (seen.has(exercise.name)) {
      throw new Error(`Дубликат name в каталоге: ${exercise.name}`);
    }
    seen.add(exercise.name);
  }
}

function assertTagsMatchDatabaseSchema() {
  const problems: string[] = [];

  for (const exercise of EXERCISES) {
    if (!MUSCLE_GROUPS.includes(exercise.muscleGroup)) {
      problems.push(`${exercise.name}: muscleGroup "${exercise.muscleGroup}"`);
    }
    if (!EQUIPMENT.includes(exercise.equipment)) {
      problems.push(`${exercise.name}: equipment "${exercise.equipment}"`);
    }
    if (!DIFFICULTIES.includes(exercise.difficulty)) {
      problems.push(`${exercise.name}: difficulty "${exercise.difficulty}"`);
    }
  }

  if (problems.length > 0) {
    throw new Error(
      `Теги не совпадают с CHECK-констрейнтами в 001_init.sql:\n${problems.join("\n")}`,
    );
  }
}

assertUniqueNames();
assertTagsMatchDatabaseSchema();

const rows = EXERCISES.map(
  (exercise) =>
    `  (${sqlString(exercise.name)}, ${sqlString(exercise.muscleGroup)}, ${sqlString(
      exercise.equipment,
    )}, ${sqlString(exercise.difficulty)}, ${exercise.isCompound})`,
).join(",\n");

const counts = {
  total: EXERCISES.length,
  compound: EXERCISES.filter((exercise) => exercise.isCompound).length,
  byGroup: Object.fromEntries(
    MUSCLE_GROUPS.map((group) => [
      group,
      EXERCISES.filter((exercise) => exercise.muscleGroup === group).length,
    ]),
  ),
  byEquipment: Object.fromEntries(
    EQUIPMENT.map((equipment) => [
      equipment,
      EXERCISES.filter((exercise) => exercise.equipment === equipment).length,
    ]),
  ),
};

const sql = `-- Сгенерировано из src/lib/exercise-catalog.ts — не редактируй вручную.
-- Команда пересборки: npm run db:seed

insert into public.exercises (name, muscle_group, equipment, difficulty, is_compound)
values
${rows}
on conflict (name) do update
  set muscle_group = excluded.muscle_group,
      equipment = excluded.equipment,
      difficulty = excluded.difficulty,
      is_compound = excluded.is_compound;
`;

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, sql, "utf8");

console.log(`Записано ${EXERCISES.length} упражнений в supabase/seed.sql`);
console.log(`  многосуставных: ${counts.compound}, изоляция: ${counts.total - counts.compound}`);
console.log(`  по группам: ${JSON.stringify(counts.byGroup)}`);
console.log(`  по инвентарю: ${JSON.stringify(counts.byEquipment)}`);
